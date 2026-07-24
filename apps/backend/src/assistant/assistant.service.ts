import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
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
import type { AssistantAction, ChatResponse, StreamError, StreamEvent } from '@life-dashboard/shared';

const MODEL = 'claude-sonnet-5';
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
  private anthropic: Anthropic | null = null;
  private readonly registry = new ToolRegistry();

  constructor(
    private readonly configService: ConfigService,
    private readonly financeService: FinanceService,
    private readonly caloriesService: CaloriesService,
    private readonly tasksService: TasksService,
    private readonly habitsService: HabitsService,
    private readonly focusService: FocusService,
    private readonly wishesService: WishesService,
  ) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      // Warn loudly but don't crash — let the controller return a user-friendly error.
      this.logger.warn(
        'ANTHROPIC_API_KEY is not set. /assistant/chat will return 503 until the key is configured.',
      );
      return;
    }

    this.anthropic = new Anthropic({ apiKey });

    // Register all tools.
    for (const tool of buildFinanceTools(this.financeService)) {
      this.registry.register(tool);
    }
    for (const tool of buildCaloriesTools(this.caloriesService)) {
      this.registry.register(tool);
    }
    for (const tool of buildTasksTools(this.tasksService)) {
      this.registry.register(tool);
    }
    for (const tool of buildHabitsTools(this.habitsService)) {
      this.registry.register(tool);
    }
    for (const tool of buildFocusTools(this.focusService)) {
      this.registry.register(tool);
    }
    for (const tool of buildWishesTools(this.wishesService)) {
      this.registry.register(tool);
    }

    this.logger.log(
      `AssistantService ready. Tools registered: ${this.registry.toAnthropicTools().map((t) => t.name).join(', ')}`,
    );
  }

  async chat(dto: ChatRequestDto, userId: string): Promise<ChatResponse> {
    if (!this.anthropic) {
      return {
        reply:
          'The AI assistant is not available — ANTHROPIC_API_KEY is not configured on the server. Please contact the administrator.',
        actions: [],
      };
    }

    const collectedActions: AssistantAction[] = [];

    // ── Phase 1: Execute any confirmed MUTATE actions from the previous turn ──
    if (dto.confirmedActions && dto.confirmedActions.length > 0) {
      for (const confirmed of dto.confirmedActions) {
        const tool = this.registry.get(confirmed.toolName);
        if (!tool || tool.type !== 'MUTATE') {
          this.logger.warn(
            `Ignoring unknown or non-MUTATE confirmed action: ${confirmed.toolName}`,
          );
          continue;
        }

        try {
          const result = await tool.execute(confirmed.params, userId);
          collectedActions.push({
            id: confirmed.id,
            toolName: confirmed.toolName,
            description: tool.describeAction
              ? tool.describeAction(confirmed.params)
              : confirmed.toolName,
            status: 'done',
            result,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Confirmed action ${confirmed.toolName} failed: ${msg}`);
          collectedActions.push({
            id: confirmed.id,
            toolName: confirmed.toolName,
            description: tool.describeAction
              ? tool.describeAction(confirmed.params)
              : confirmed.toolName,
            status: 'failed',
            errorMessage: msg,
          });
        }
      }

      // If all confirmed actions completed (none failed), generate a short acknowledgement.
      const allDone = collectedActions.every((a) => a.status === 'done');
      if (allDone && collectedActions.length > 0) {
        const doneDescriptions = collectedActions.map((a) => `• ${a.description}`).join('\n');
        const ackMessages: Anthropic.MessageParam[] = [
          ...dto.messages.map(toAnthropicMessage),
          {
            role: 'user',
            content: `The user confirmed these actions, which have now been executed:\n${doneDescriptions}\nPlease acknowledge briefly and naturally.`,
          },
        ];

        const ack = await this.callClaude(ackMessages, []);
        return { reply: ack, actions: collectedActions };
      }

      // Some failed — let Claude explain.
      const failedDescriptions = collectedActions
        .filter((a) => a.status === 'failed')
        .map((a) => `• ${a.description}: ${a.errorMessage}`)
        .join('\n');

      return {
        reply: `Some actions could not be completed:\n${failedDescriptions}`,
        actions: collectedActions,
      };
    }

    // ── Phase 2: Normal Claude tool-use loop ─────────────────────────────────
    const anthropicMessages: Anthropic.MessageParam[] = dto.messages.map(toAnthropicMessage);
    const anthropicTools = this.registry.toAnthropicTools();

    let iterations = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      let response: Anthropic.Message;
      try {
        response = await this.anthropic.messages.create({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: SYSTEM_PROMPT,
          tools: anthropicTools,
          messages: anthropicMessages,
        });
      } catch (err: unknown) {
        return this.handleAnthropicError(err);
      }

      // Collect text blocks for the final reply.
      const textBlocks = response.content.filter(
        (b): b is Anthropic.TextBlock => b.type === 'text',
      );
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );

      if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
        return {
          reply: textBlocks.map((b) => b.text).join('\n').trim(),
          actions: collectedActions,
        };
      }

      // Process tool calls.
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolCall of toolUseBlocks) {
        const tool = this.registry.get(toolCall.name);

        if (!tool) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolCall.id,
            content: JSON.stringify({ error: `Unknown tool: ${toolCall.name}` }),
          });
          continue;
        }

        const params = toolCall.input as Record<string, unknown>;

        if (tool.type === 'MUTATE') {
          // Intercept — don't execute. Return a pending status so Claude can explain.
          const actionId = randomUUID();
          const description = tool.describeAction ? tool.describeAction(params) : tool.name;

          collectedActions.push({
            id: actionId,
            toolName: tool.name,
            description,
            status: 'pending_confirmation',
            params, // Sent to frontend so it can echo them back on confirmation.
          });

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolCall.id,
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
            collectedActions.push({
              id: randomUUID(),
              toolName: tool.name,
              description: tool.name,
              status: 'done',
              result,
            });
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: JSON.stringify(result),
            });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error(`READ tool ${tool.name} failed: ${msg}`);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolCall.id,
              is_error: true,
              content: JSON.stringify({ error: msg }),
            });
          }
        }
      }

      // Append assistant turn + tool results to the message history.
      anthropicMessages.push({ role: 'assistant', content: response.content });
      anthropicMessages.push({ role: 'user', content: toolResults });
    }

    return {
      reply: 'Reached maximum tool iterations. Please try a simpler request.',
      actions: collectedActions,
    };
  }

  // ── Streaming endpoint (POST /assistant/chat/stream) ────────────────────────
  //
  // Additive — does NOT replace chat(). The caller (controller) iterates this
  // async generator and writes each yielded StreamEvent as an SSE line:
  //   data: {JSON}\n\n
  //
  // The tool-use loop mirrors chat() exactly:
  //   - READ tools → execute immediately, yield 'action' (done)
  //   - MUTATE tools → intercept, yield 'action' (pending_confirmation), let Claude explain
  //   - confirmedActions → execute first, then stream the acknowledgment
  //
  // Every path ends with a 'done' event, even after an 'error', so the frontend
  // can always close the EventSource cleanly on 'done'.

  async *chatStream(dto: ChatRequestDto, userId: string): AsyncGenerator<StreamEvent> {
    if (!this.anthropic) {
      yield {
        type: 'error',
        message:
          'The AI assistant is not available — ANTHROPIC_API_KEY is not configured on the server.',
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

        try {
          const result = await tool.execute(confirmed.params, userId);
          const action: AssistantAction = {
            id: confirmed.id,
            toolName: confirmed.toolName,
            description: tool.describeAction
              ? tool.describeAction(confirmed.params)
              : confirmed.toolName,
            status: 'done',
            result,
          };
          collectedActions.push(action);
          yield { type: 'action', action };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Confirmed action ${confirmed.toolName} failed: ${msg}`);
          const action: AssistantAction = {
            id: confirmed.id,
            toolName: confirmed.toolName,
            description: tool.describeAction
              ? tool.describeAction(confirmed.params)
              : confirmed.toolName,
            status: 'failed',
            errorMessage: msg,
          };
          collectedActions.push(action);
          yield { type: 'action', action };
        }
      }

      const allDone = collectedActions.every((a) => a.status === 'done');

      if (allDone && collectedActions.length > 0) {
        // Stream a short acknowledgment from Claude so the user gets natural feedback.
        const doneDescriptions = collectedActions.map((a) => `• ${a.description}`).join('\n');
        const ackMessages: Anthropic.MessageParam[] = [
          ...dto.messages.map(toAnthropicMessage),
          {
            role: 'user',
            content: `The user confirmed these actions, which have now been executed:\n${doneDescriptions}\nPlease acknowledge briefly and naturally.`,
          },
        ];

        try {
          const ackStream = this.anthropic.messages.stream({
            model: MODEL,
            max_tokens: 512,
            system: SYSTEM_PROMPT,
            messages: ackMessages,
          });

          for await (const event of ackStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              finalReply += event.delta.text;
              yield { type: 'delta', text: event.delta.text };
            }
          }
        } catch (err: unknown) {
          // Ack stream failed — fall back to inline summary rather than crashing.
          finalReply = `Done: ${collectedActions.map((a) => a.description).join(', ')}`;
          yield { type: 'delta', text: finalReply };
        }
      } else {
        // Some confirmed actions failed — report inline.
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

    // ── Phase 2: Normal streaming Claude tool-use loop ────────────────────────
    const anthropicMessages: Anthropic.MessageParam[] = dto.messages.map(toAnthropicMessage);
    const anthropicTools = this.registry.toAnthropicTools();
    let iterations = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;
      let turnText = '';
      let finalMessage: Anthropic.Message;

      try {
        // Start a streaming request for this iteration.
        const stream = this.anthropic.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: SYSTEM_PROMPT,
          tools: anthropicTools,
          messages: anthropicMessages,
        });

        // Yield text_delta events in real time as Claude generates tokens.
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            turnText += event.delta.text;
            yield { type: 'delta', text: event.delta.text };
          }
        }

        // After the stream exhausts, assemble the complete message for tool inspection.
        finalMessage = await stream.finalMessage();
      } catch (err: unknown) {
        yield this.handleStreamError(err);
        yield { type: 'done', reply: finalReply, actions: collectedActions };
        return;
      }

      // Accumulate this turn's text into the final reply (even when tool calls follow).
      finalReply += turnText;

      const toolUseBlocks = finalMessage.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );

      // Natural end or no tools — we're done.
      if (finalMessage.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
        break;
      }

      // ── Process tool calls ────────────────────────────────────────────────
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolCall of toolUseBlocks) {
        const tool = this.registry.get(toolCall.name);

        if (!tool) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolCall.id,
            content: JSON.stringify({ error: `Unknown tool: ${toolCall.name}` }),
          });
          continue;
        }

        const params = toolCall.input as Record<string, unknown>;

        if (tool.type === 'MUTATE') {
          // Intercept — do NOT execute. Queue for user confirmation and let Claude explain.
          const actionId = randomUUID();
          const description = tool.describeAction ? tool.describeAction(params) : tool.name;
          const action: AssistantAction = {
            id: actionId,
            toolName: tool.name,
            description,
            status: 'pending_confirmation',
            params, // echoed back so the frontend can include it in confirmedActions
          };
          collectedActions.push(action);
          yield { type: 'action', action };

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolCall.id,
            content: JSON.stringify({
              status: 'pending_confirmation',
              actionId,
              message:
                'This action has been queued for user confirmation. Do not retry it automatically.',
            }),
          });
        } else {
          // READ — execute immediately, emit an action event so the frontend can reflect state.
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
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: JSON.stringify(result),
            });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error(`READ tool ${tool.name} failed: ${msg}`);
            // Don't yield an action event — Claude will explain the error in its next turn.
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolCall.id,
              is_error: true,
              content: JSON.stringify({ error: msg }),
            });
          }
        }
      }

      // Append this turn to message history so the next iteration has full context.
      anthropicMessages.push({ role: 'assistant', content: finalMessage.content });
      anthropicMessages.push({ role: 'user', content: toolResults });
    }

    if (iterations >= MAX_TOOL_ITERATIONS) {
      const maxMsg = 'Reached maximum tool iterations. Please try a simpler request.';
      finalReply = finalReply || maxMsg;
      if (!finalReply.includes(maxMsg)) {
        yield { type: 'delta', text: '\n' + maxMsg };
        finalReply += '\n' + maxMsg;
      }
    }

    yield { type: 'done', reply: finalReply, actions: collectedActions };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async callClaude(
    messages: Anthropic.MessageParam[],
    tools: Anthropic.Tool[],
  ): Promise<string> {
    const response = await this.anthropic!.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      tools: tools.length ? tools : undefined,
      messages,
    });
    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
  }

  private handleAnthropicError(err: unknown): ChatResponse {
    if (err instanceof Anthropic.APIError) {
      this.logger.error(`Anthropic API error ${err.status}: ${err.message}`);

      if (err.status === 429) {
        return {
          reply: 'The AI assistant is temporarily rate-limited. Please try again in a moment.',
          actions: [],
        };
      }
      if (err.status === 401) {
        return {
          reply: 'The AI assistant is not properly configured (invalid API key). Please contact support.',
          actions: [],
        };
      }
    }
    this.logger.error(`Unexpected Anthropic error: ${String(err)}`);
    return {
      reply: 'An unexpected error occurred with the AI assistant. Please try again.',
      actions: [],
    };
  }

  private handleStreamError(err: unknown): StreamError {
    if (err instanceof Anthropic.APIError) {
      this.logger.error(`Anthropic stream error ${err.status}: ${err.message}`);
      if (err.status === 429) {
        return {
          type: 'error',
          message: 'The AI assistant is temporarily rate-limited. Please try again in a moment.',
        };
      }
      if (err.status === 401) {
        return {
          type: 'error',
          message:
            'The AI assistant is not properly configured (invalid API key). Please contact support.',
        };
      }
    }
    this.logger.error(`Unexpected Anthropic stream error: ${String(err)}`);
    return {
      type: 'error',
      message: 'An unexpected error occurred with the AI assistant. Please try again.',
    };
  }
}

function toAnthropicMessage(msg: { role: 'user' | 'assistant'; content: string }): Anthropic.MessageParam {
  return { role: msg.role, content: msg.content };
}
