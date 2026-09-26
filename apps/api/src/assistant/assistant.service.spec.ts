import type { StreamEvent } from '@life-dashboard/shared';
import { AssistantService } from './assistant.service';
import { createLlmProvider, type LlmProvider, type ToolCall } from './llm';

function fakeProvider(turns: { text: string; calls: ToolCall[] }[]) {
  const toolResults: unknown[] = [];
  const provider: LlmProvider = {
    name: 'openai',
    start: () => ({
      // eslint-disable-next-line @typescript-eslint/require-await
      async *turn() {
        const t = turns.shift()!;
        yield t.text;
        return t.calls;
      },
      addToolResults: (r) => toolResults.push(...r),
    }),
  };
  return { provider, toolResults };
}

function makeService() {
  const repo = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((x: object) => x),
    save: jest.fn((x: object) => Promise.resolve({ id: 'conv-1', ...x })),
  };
  const svc = new AssistantService(
    { get: () => undefined } as never,
    ...([{}, {}, {}, {}, {}, {}] as never[]),
    repo as never,
    repo as never,
  );
  svc.onModuleInit(); // không có key → llm null, tools vẫn đăng ký
  return svc as unknown as {
    llm: LlmProvider | null;
    registry: { register: (t: unknown) => void };
    chatStream: AssistantService['chatStream'];
    chat: AssistantService['chat'];
  };
}

const dto = { messages: [{ role: 'user' as const, content: 'hi' }] };

describe('AssistantService tool loop', () => {
  it('runs READ tools, feeds results back, and finishes with the text', async () => {
    const svc = makeService();
    const execute = jest.fn().mockResolvedValue({ total: 3 });
    svc.registry.register({
      name: 'read_x',
      description: '',
      inputSchema: { type: 'object' },
      type: 'READ',
      execute,
    });
    const { provider, toolResults } = fakeProvider([
      { text: 'Checking. ', calls: [{ id: 'c1', name: 'read_x', input: { a: 1 } }] },
      { text: 'You have 3.', calls: [] },
    ]);
    svc.llm = provider;

    const events: StreamEvent[] = [];
    for await (const e of svc.chatStream(dto as never, 'user-1')) events.push(e);

    expect(execute).toHaveBeenCalledWith({ a: 1 }, 'user-1');
    expect(toolResults).toEqual([{ id: 'c1', content: '{"total":3}' }]);
    const done = events.at(-1);
    expect(done).toMatchObject({
      type: 'done',
      reply: 'Checking. You have 3.',
      conversationId: 'conv-1',
    });
  });

  it('queues MUTATE tools for confirmation instead of executing', async () => {
    const svc = makeService();
    const execute = jest.fn();
    svc.registry.register({
      name: 'delete_x',
      description: '',
      inputSchema: { type: 'object' },
      type: 'MUTATE',
      execute,
    });
    svc.llm = fakeProvider([
      { text: '', calls: [{ id: 'c1', name: 'delete_x', input: {} }] },
      { text: 'Confirm?', calls: [] },
    ]).provider;

    const res = await svc.chat(dto as never, 'user-1');

    expect(execute).not.toHaveBeenCalled();
    expect(res.reply).toBe('Confirm?');
    expect(res.actions[0]).toMatchObject({
      toolName: 'delete_x',
      status: 'pending_confirmation',
    });
  });

  it('returns a friendly error when no AI key is configured', async () => {
    const res = await makeService().chat(dto as never, 'user-1');
    expect(res.reply).toMatch(/no AI API key/);
  });
});

describe('createLlmProvider', () => {
  const pick = (keys: Record<string, string>) =>
    createLlmProvider((k) => keys[k], 'sys', [])?.name ?? null;

  it('prefers Anthropic → OpenAI → Gemini by configured key', () => {
    expect(pick({ ANTHROPIC_API_KEY: 'a', GEMINI_API_KEY: 'g' })).toBe('anthropic');
    expect(pick({ OPENAI_API_KEY: 'o', GEMINI_API_KEY: 'g' })).toBe('openai');
    expect(pick({ GEMINI_API_KEY: 'g' })).toBe('gemini');
    expect(pick({})).toBeNull();
  });
});
