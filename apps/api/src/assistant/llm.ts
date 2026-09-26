import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { ToolDefinition } from './tools/tool-registry';

/**
 * Lớp mỏng cho 3 provider. Anthropic dùng SDK riêng (giữ prompt caching);
 * OpenAI và Gemini dùng chung SDK openai (Gemini có endpoint OpenAI-compatible).
 * Chọn provider theo key có mặt: ANTHROPIC_API_KEY → OPENAI_API_KEY → GEMINI_API_KEY.
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}
export interface ToolResult {
  id: string;
  content: string;
  isError?: boolean;
}

export interface LlmConversation {
  /** Stream một lượt: yield text delta; return tool calls ([] = kết thúc). */
  turn(opts: {
    useTools: boolean;
    maxTokens: number;
  }): AsyncGenerator<string, ToolCall[]>;
  addToolResults(results: ToolResult[]): void;
}

export interface LlmProvider {
  name: 'anthropic' | 'openai' | 'gemini';
  start(messages: ChatMessage[]): LlmConversation;
}

const MODELS = {
  anthropic: 'claude-sonnet-5',
  openai: 'gpt-5-mini',
  gemini: 'gemini-2.5-flash',
} as const;

const GEMINI_OPENAI_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/openai/';

export function createLlmProvider(
  env: (key: string) => string | undefined,
  systemPrompt: string,
  tools: ToolDefinition[],
): LlmProvider | null {
  const anthropicKey = env('ANTHROPIC_API_KEY');
  if (anthropicKey) {
    return anthropicProvider(
      new Anthropic({ apiKey: anthropicKey }),
      systemPrompt,
      tools,
    );
  }
  const openaiKey = env('OPENAI_API_KEY');
  if (openaiKey) {
    return openaiProvider(
      'openai',
      new OpenAI({ apiKey: openaiKey }),
      systemPrompt,
      tools,
    );
  }
  const geminiKey = env('GEMINI_API_KEY');
  if (geminiKey) {
    return openaiProvider(
      'gemini',
      new OpenAI({ apiKey: geminiKey, baseURL: GEMINI_OPENAI_BASE_URL }),
      systemPrompt,
      tools,
    );
  }
  return null;
}

/** HTTP status của lỗi API (cả 2 SDK đều có `status`), dùng để báo 401/429 thân thiện. */
export function llmErrorStatus(err: unknown): number | undefined {
  return err instanceof Anthropic.APIError || err instanceof OpenAI.APIError
    ? (err.status as number | undefined)
    : undefined;
}

function anthropicProvider(
  client: Anthropic,
  systemPrompt: string,
  tools: ToolDefinition[],
): LlmProvider {
  // Prompt caching: tools -> system là prefix cố định; breakpoint trên system cache cả hai.
  // Không nhét dữ liệu theo request (userId, timestamp) vào system prompt / tool definitions.
  const system: Anthropic.TextBlockParam[] = [
    { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
  ];
  const anthropicTools: Anthropic.Tool[] = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema,
  }));

  return {
    name: 'anthropic',
    start(initial) {
      const messages: Anthropic.MessageParam[] = initial.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      return {
        async *turn({ useTools, maxTokens }) {
          const stream = client.messages.stream({
            model: MODELS.anthropic,
            max_tokens: maxTokens,
            system,
            tools: useTools ? anthropicTools : undefined,
            messages,
          });
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              yield event.delta.text;
            }
          }
          const final = await stream.finalMessage();
          const calls = final.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
          );
          if (final.stop_reason === 'end_turn' || calls.length === 0) return [];
          messages.push({ role: 'assistant', content: final.content });
          return calls.map((c) => ({
            id: c.id,
            name: c.name,
            input: c.input as Record<string, unknown>,
          }));
        },
        addToolResults(results) {
          messages.push({
            role: 'user',
            content: results.map((r) => ({
              type: 'tool_result' as const,
              tool_use_id: r.id,
              content: r.content,
              is_error: r.isError,
            })),
          });
        },
      };
    },
  };
}

function openaiProvider(
  name: 'openai' | 'gemini',
  client: OpenAI,
  systemPrompt: string,
  tools: ToolDefinition[],
): LlmProvider {
  const openaiTools: OpenAI.ChatCompletionTool[] = tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    },
  }));

  return {
    name,
    start(initial) {
      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...initial.map((m) => ({ role: m.role, content: m.content })),
      ];
      return {
        async *turn({ useTools, maxTokens }) {
          const stream = client.chat.completions.stream({
            model: MODELS[name],
            messages,
            tools: useTools ? openaiTools : undefined,
            max_completion_tokens: maxTokens,
          });
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) yield text;
          }
          const message = await stream.finalMessage();
          const calls = (message.tool_calls ?? []).filter(
            (c) => c.type === 'function',
          );
          if (!calls.length) return [];
          messages.push({
            role: 'assistant',
            content: message.content,
            tool_calls: calls,
          });
          return calls.map((c) => ({
            id: c.id,
            name: c.function.name,
            input: safeJson(c.function.arguments),
          }));
        },
        addToolResults(results) {
          for (const r of results) {
            messages.push({
              role: 'tool',
              tool_call_id: r.id,
              content: r.content,
            });
          }
        },
      };
    },
  };
}

function safeJson(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text || '{}') as Record<string, unknown>;
  } catch {
    return {};
  }
}
