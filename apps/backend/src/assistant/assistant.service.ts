import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'crypto';
import { FinanceService } from '../finance/finance.service';
import { CaloriesService } from '../calories/calories.service';
import { ToolRegistry } from './tools/tool-registry';
import { buildFinanceTools } from './tools/finance.tools';
import { buildCaloriesTools } from './tools/calories.tools';
import { ChatRequestDto } from './dto/chat.dto';
import type { AssistantAction, ChatResponse } from '@life-dashboard/shared';

const MODEL = 'claude-sonnet-5';
const MAX_TOKENS = 4096;
// Maximum tool-use iterations per request to prevent runaway loops.
const MAX_TOOL_ITERATIONS = 10;

const SYSTEM_PROMPT = `You are a helpful personal assistant integrated into the LifeDashboard app.
You help users manage their finances and calorie/nutrition tracking.

Guidelines:
- Always use the available tools to fetch real data before answering questions about the user's finances or calories.
- When a user asks you to ADD, EDIT, or DELETE data, use the appropriate MUTATE tool. These actions require confirmation — you will see a "pending_confirmation" status in the tool result. Acknowledge this clearly and tell the user what will happen once they confirm.
- Never guess or fabricate financial or nutritional data. Use tools.
- Keep responses concise and actionable.
- Today's date context: the user's local date. Infer it from conversation context if mentioned.
- Currency is USD unless stated otherwise.`;

@Injectable()
export class AssistantService implements OnModuleInit {
  private readonly logger = new Logger(AssistantService.name);
  private anthropic: Anthropic | null = null;
  private readonly registry = new ToolRegistry();

  constructor(
    private readonly configService: ConfigService,
    private readonly financeService: FinanceService,
    private readonly caloriesService: CaloriesService,
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
}

function toAnthropicMessage(msg: { role: 'user' | 'assistant'; content: string }): Anthropic.MessageParam {
  return { role: msg.role, content: msg.content };
}
