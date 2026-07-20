import Anthropic from '@anthropic-ai/sdk';

export type ToolType = 'READ' | 'MUTATE';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Anthropic.Tool['input_schema'];
  type: ToolType;
  /** Execute the tool for the given user. userId is always injected here — never from params. */
  execute: (params: Record<string, unknown>, userId: string) => Promise<unknown>;
  /** Human-readable summary of the action (shown in the confirm dialog). MUTATE only. */
  describeAction?: (params: Record<string, unknown>) => string;
}

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /** Returns the Anthropic-format tool list for messages.create(). */
  toAnthropicTools(): Anthropic.Tool[] {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema,
    }));
  }
}
