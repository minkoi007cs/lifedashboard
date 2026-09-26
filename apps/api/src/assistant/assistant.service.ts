import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { FinanceService } from '../finance/finance.service';
import { CaloriesService } from '../calories/calories.service';
import { TasksService } from '../tasks/tasks.service';
import { HabitsService } from '../habits/habits.service';
import { FocusService } from '../focus/focus.service';
import { WishesService } from '../wishes/wishes.service';
import { ToolRegistry } from './tools/tool-registry';
import { buildFinanceTools } from './tools/finance.tools';
import { buildCaloriesTools } from './tools/calories.tools';
import { buildTasksTools } from './tools/tasks.tools';
import { buildHabitsTools } from './tools/habits.tools';
import { buildFocusTools } from './tools/focus.tools';
import { buildWishesTools } from './tools/wishes.tools';
import { ChatRequestDto } from './dto/chat.dto';
import { AssistantConversation } from './entities/assistant-conversation.entity';
import { AssistantMessageEntity } from './entities/assistant-message.entity';
import {
  createLlmProvider,
  llmErrorStatus,
  type LlmProvider,
  type ToolCall,
  type ToolResult,
} from './llm';
import type {
  AssistantAction,
  ChatResponse,
  StreamError,
  StreamEvent,
} from '@life-dashboard/shared';

const MAX_TOKENS = 4096;
// Maximum tool-use iterations per request to prevent runaway loops.
const MAX_TOOL_ITERATIONS = 10;

const SYSTEM_PROMPT = `You are a warm, friendly personal assistant built into LifeDashboard — an app that helps users track their finances, nutrition/calories, tasks, habits, focus sessions, and wishlist.

## Language
Always reply in the same language the user writes in. If the user writes Vietnamese, respond in Vietnamese. If they write English, respond in English. Never switch languages mid-conversation unless the user does first.

## Conversational behavior
- Greetings and small talk ("hi", "hello", "chào", "cảm ơn", "what can you do?"): respond warmly and naturally without calling any tools. Briefly mention what you can help with so the user knows what to ask for. Example capabilities: checking finances, logging food, creating tasks or habits, reviewing focus stats, managing wishlist.
- General questions about how you work, what features exist, or how to use the app: answer directly from your knowledge. No tools needed.
- Only call tools when the user is genuinely asking about their real data (e.g. "how much did I spend this month?", "show me my tasks", "log a meal") or wants to create/modify something.

## Data access
- Never guess or fabricate numbers (financial figures, calories, streaks, etc.). Always use the appropriate READ tool first to get live data before answering a data question.
- When a user asks about finances, calories, tasks, habits, focus, or wishlist — fetch the relevant data with a READ tool, then summarize it conversationally.
- Today's date: infer from conversation context if the user mentions it. Otherwise treat dates relative to "today" as the current date.
- Currency is USD unless the user says otherwise.

## Mutating data (add / edit / delete)
When the user wants to create, update, or delete anything, use the appropriate MUTATE tool. MUTATE tools do not execute immediately — you will see \`"status": "pending_confirmation"\` in the tool result. When that happens:
1. Tell the user clearly what action is queued and what will change.
2. Ask them to confirm (e.g. "Confirm this?" or "Bạn có muốn xác nhận không?").
3. Only after they confirm will the action actually execute.
Never skip the confirmation step or pretend the action is done before confirmation.

## Tone
- Be concise and direct. Avoid lengthy disclaimers.
- Be warm and human — not robotic or overly formal.
- When data is missing or empty, say so honestly and offer a helpful next step.`;

@Injectable()
export class AssistantService implements OnModuleInit {
  private readonly logger = new Logger(AssistantService.name);
  private llm: LlmProvider | null = null;
  private readonly registry = new ToolRegistry();

  constructor(
    private readonly configService: ConfigService,
    private readonly financeService: FinanceService,
    private readonly caloriesService: CaloriesService,
    private readonly tasksService: TasksService,
    private readonly habitsService: HabitsService,
    private readonly focusService: FocusService,
    private readonly wishesService: WishesService,
    @InjectRepository(AssistantConversation)
    private readonly conversationRepo: Repository<AssistantConversation>,
    @InjectRepository(AssistantMessageEntity)
    private readonly messageRepo: Repository<AssistantMessageEntity>,
  ) {}

  onModuleInit() {
    for (const tool of [
      ...buildFinanceTools(this.financeService),
      ...buildCaloriesTools(this.caloriesService),
      ...buildTasksTools(this.tasksService),
      ...buildHabitsTools(this.habitsService),
      ...buildFocusTools(this.focusService),
      ...buildWishesTools(this.wishesService),
    ]) {
      this.registry.register(tool);
    }

    this.llm = createLlmProvider(
      (key) => this.configService.get<string>(key)?.trim() || undefined,
      SYSTEM_PROMPT,
      this.registry.list(),
    );
    if (!this.llm) {
      // Warn loudly but don't crash — chat endpoints return a user-friendly error.
      this.logger.warn(
        'No AI key set (ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY). /assistant/chat is disabled.',
      );
      return;
    }
    this.logger.log(
      `AssistantService ready (${this.llm.name}). Tools: ${this.registry
        .list()
        .map((t) => t.name)
        .join(', ')}`,
    );
  }

  /** Non-streaming endpoint: cùng logic với chatStream, gom kết quả cuối. */
  async chat(dto: ChatRequestDto, userId: string): Promise<ChatResponse> {
    let error: string | undefined;
    for await (const event of this.chatStream(dto, userId)) {
      if (event.type === 'error') error = event.message;
      if (event.type === 'done') {
        return {
          reply: error ?? event.reply,
          actions: event.actions,
          conversationId: event.conversationId,
        };
      }
    }
    return { reply: error ?? '', actions: [] };
  }

  // ── Streaming endpoint (POST /assistant/chat/stream) ────────────────────────
  //   - READ tools → execute immediately, yield 'action' (done)
  //   - MUTATE tools → intercept, yield 'action' (pending_confirmation), let the model explain
  //   - confirmedActions → execute first, then stream the acknowledgment
  // Every path ends with a 'done' event, even after an 'error'.
  async *chatStream(
    dto: ChatRequestDto,
    userId: string,
  ): AsyncGenerator<StreamEvent> {
    if (!this.llm) {
      yield {
        type: 'error',
        message:
          'The AI assistant is not available — no AI API key is configured on the server.',
      };
      yield { type: 'done', reply: '', actions: [] };
      return;
    }

    const collectedActions: AssistantAction[] = [];
    let finalReply = '';

    // ── Phase 1: Execute confirmed MUTATE actions from the previous turn ───────
    if (dto.confirmedActions && dto.confirmedActions.length > 0) {
      for (const confirmed of dto.confirmedActions) {
        const tool = this.registry.get(confirmed.toolName);
        if (!tool || tool.type !== 'MUTATE') {
          this.logger.warn(
            `Ignoring unknown or non-MUTATE confirmed action: ${confirmed.toolName}`,
          );
          continue;
        }
        const description = tool.describeAction
          ? tool.describeAction(confirmed.params)
          : confirmed.toolName;
        let action: AssistantAction;
        try {
          const result = await tool.execute(confirmed.params, userId);
          action = {
            id: confirmed.id,
            toolName: confirmed.toolName,
            description,
            status: 'done',
            result,
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `Confirmed action ${confirmed.toolName} failed: ${msg}`,
          );
          action = {
            id: confirmed.id,
            toolName: confirmed.toolName,
            description,
            status: 'failed',
            errorMessage: msg,
          };
        }
        collectedActions.push(action);
        yield { type: 'action', action };
      }

      const allDone = collectedActions.every((a) => a.status === 'done');
      if (allDone && collectedActions.length > 0) {
        const doneDescriptions = collectedActions
          .map((a) => `• ${a.description}`)
          .join('\n');
        const ack = this.llm.start([
          ...dto.messages,
          {
            role: 'user',
            content: `The user confirmed these actions, which have now been executed:\n${doneDescriptions}\nPlease acknowledge briefly and naturally.`,
          },
        ]);
        try {
          for await (const text of ack.turn({
            useTools: false,
            maxTokens: 512,
          })) {
            finalReply += text;
            yield { type: 'delta', text };
          }
        } catch {
          // Ack failed — fall back to inline summary rather than crashing.
          finalReply = `Done: ${collectedActions.map((a) => a.description).join(', ')}`;
          yield { type: 'delta', text: finalReply };
        }
      } else {
        const failedDescriptions = collectedActions
          .filter((a) => a.status === 'failed')
          .map((a) => `• ${a.description}: ${a.errorMessage}`)
          .join('\n');
        finalReply = `Some actions could not be completed:\n${failedDescriptions}`;
        yield { type: 'delta', text: finalReply };
      }

      yield { type: 'done', reply: finalReply, actions: collectedActions };
      return;
    }

    // ── Phase 2: Streaming tool-use loop ──────────────────────────────────────
    const conversation = this.llm.start(dto.messages);
    let iterations = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;
      const turn = conversation.turn({ useTools: true, maxTokens: MAX_TOKENS });
      let toolCalls: ToolCall[];
      try {
        let step = await turn.next();
        while (!step.done) {
          finalReply += step.value;
          yield { type: 'delta', text: step.value };
          step = await turn.next();
        }
        toolCalls = step.value;
      } catch (err: unknown) {
        yield this.handleStreamError(err);
        yield { type: 'done', reply: finalReply, actions: collectedActions };
        return;
      }

      if (toolCalls.length === 0) break;

      const toolResults: ToolResult[] = [];
      for (const toolCall of toolCalls) {
        const tool = this.registry.get(toolCall.name);
        if (!tool) {
          toolResults.push({
            id: toolCall.id,
            content: JSON.stringify({
              error: `Unknown tool: ${toolCall.name}`,
            }),
          });
          continue;
        }
        const params = toolCall.input;

        if (tool.type === 'MUTATE') {
          // Intercept — do NOT execute. Queue for user confirmation and let the model explain.
          const actionId = randomUUID();
          const action: AssistantAction = {
            id: actionId,
            toolName: tool.name,
            description: tool.describeAction
              ? tool.describeAction(params)
              : tool.name,
            status: 'pending_confirmation',
            params, // echoed back so the frontend can include it in confirmedActions
          };
          collectedActions.push(action);
          yield { type: 'action', action };
          toolResults.push({
            id: toolCall.id,
            content: JSON.stringify({
              status: 'pending_confirmation',
              actionId,
              message:
                'This action has been queued for user confirmation. Do not retry it automatically.',
            }),
          });
        } else {
          // READ — execute immediately.
          try {
            const result = await tool.execute(params, userId);
            const action: AssistantAction = {
              id: randomUUID(),
              toolName: tool.name,
              description: tool.name,
              status: 'done',
              result,
            };
            collectedActions.push(action);
            yield { type: 'action', action };
            toolResults.push({
              id: toolCall.id,
              content: JSON.stringify(result),
            });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error(`READ tool ${tool.name} failed: ${msg}`);
            toolResults.push({
              id: toolCall.id,
              isError: true,
              content: JSON.stringify({ error: msg }),
            });
          }
        }
      }
      conversation.addToolResults(toolResults);
    }

    if (iterations >= MAX_TOOL_ITERATIONS) {
      const maxMsg =
        'Reached maximum tool iterations. Please try a simpler request.';
      finalReply = finalReply || maxMsg;
      if (!finalReply.includes(maxMsg)) {
        yield { type: 'delta', text: '\n' + maxMsg };
        finalReply += '\n' + maxMsg;
      }
    }

    const userLastMessage =
      dto.messages[dto.messages.length - 1]?.content || '';
    let savedConvId = dto.conversationId;
    try {
      savedConvId = await this.saveTurn(
        userId,
        dto.conversationId,
        userLastMessage,
        finalReply,
        collectedActions,
      );
    } catch (e) {
      this.logger.error(`Failed to save stream turn: ${e}`);
    }

    yield {
      type: 'done',
      reply: finalReply,
      actions: collectedActions,
      conversationId: savedConvId,
    };
  }

  // ── Conversation Persistence ────────────────────────────────────────────────
  async saveTurn(
    userId: string,
    conversationId: string | undefined,
    userContent: string,
    assistantContent: string,
    actions?: AssistantAction[],
  ): Promise<string> {
    let conversation: AssistantConversation | null = null;
    if (conversationId) {
      conversation = await this.conversationRepo.findOne({
        where: { id: conversationId, userId },
      });
    }

    if (!conversation) {
      const title = userContent.trim().slice(0, 45) || 'Cuộc trò chuyện mới';
      conversation = this.conversationRepo.create({
        userId,
        title,
      });
      conversation = await this.conversationRepo.save(conversation);
    }

    const userMsg = this.messageRepo.create({
      conversationId: conversation.id,
      role: 'user',
      content: userContent,
    });
    const assistantMsg = this.messageRepo.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: assistantContent,
      actions:
        actions && actions.length > 0
          ? (actions as unknown as Record<string, unknown>[])
          : undefined,
    });

    await this.messageRepo.save([userMsg, assistantMsg]);
    return conversation.id;
  }

  async getConversations(userId: string) {
    return this.conversationRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      take: 20,
    });
  }

  async getConversationMessages(conversationId: string, userId: string) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, userId },
      relations: ['messages'],
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: (conversation.messages || []).sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    };
  }

  async deleteConversation(conversationId: string, userId: string) {
    await this.conversationRepo.delete({ id: conversationId, userId });
    return { success: true };
  }

  private handleStreamError(err: unknown): StreamError {
    const status = llmErrorStatus(err);
    this.logger.error(
      `AI (${this.llm?.name}) error ${status ?? ''}: ${String(err)}`,
    );
    if (status === 429) {
      return {
        type: 'error',
        message:
          'The AI assistant is temporarily rate-limited. Please try again in a moment.',
      };
    }
    if (status === 401) {
      return {
        type: 'error',
        message:
          'The AI assistant is not properly configured (invalid API key). Please contact support.',
      };
    }
    return {
      type: 'error',
      message:
        'An unexpected error occurred with the AI assistant. Please try again.',
    };
  }
}
