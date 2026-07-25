import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Check,
  ChevronDown,
  Loader2,
  MessageCircle,
  Send,
  X,
} from 'lucide-react';
import { getApiBaseUrl } from '../../lib/api-config';
import type {
  AssistantAction,
  AssistantMessage,
  ChatRequest,
  ConfirmedAction,
  StreamEvent,
} from '@life-dashboard/shared';

// ── Entry types ────────────────────────────────────────────────────────────────
type MessageEntry = { type: 'message'; data: AssistantMessage };
type ActionsEntry = { type: 'actions'; id: string; data: AssistantAction[] };
type ChatEntry = MessageEntry | ActionsEntry;

function pickMessages(entries: ChatEntry[]): AssistantMessage[] {
  return entries
    .filter((e): e is MessageEntry => e.type === 'message')
    .map((e) => e.data);
}

export const AssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState('');

  // Streaming state — active only while a stream is in flight
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingActions, setStreamingActions] = useState<AssistantAction[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  // AbortController for the active fetch so we can cancel mid-stream
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight stream when the widget unmounts
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Auto-scroll to bottom whenever content changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, isStreaming, streamingText]);

  // ── Core streaming function ─────────────────────────────────────────────────
  const streamChat = useCallback(
    async (messages: AssistantMessage[], confirmedActions?: ConfirmedAction[]) => {
      // Cancel previous stream if any
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
      setStreamingText('');
      setStreamingActions([]);

      // Attach Bearer token the same way the shared axios instance does
      const token = localStorage.getItem('token');
      const body: ChatRequest = {
        messages,
        ...(confirmedActions ? { confirmedActions } : {}),
      };

      let response: Response;
      try {
        response = await fetch(`${getApiBaseUrl()}/api/v1/assistant/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (err) {
        // AbortError = intentional cancel (new message sent, widget unmounted)
        if ((err as Error).name === 'AbortError') return;
        setEntries((prev) => [
          ...prev,
          { type: 'message', data: { role: 'assistant', content: 'Connection error. Please try again.' } },
        ]);
        setIsStreaming(false);
        return;
      }

      if (!response.ok || !response.body) {
        setEntries((prev) => [
          ...prev,
          { type: 'message', data: { role: 'assistant', content: 'Server error. Please try again.' } },
        ]);
        setIsStreaming(false);
        return;
      }

      // ── SSE read loop ───────────────────────────────────────────────────────
      // The server sends events as:  data: {JSON}\n\n
      // We read raw bytes from the stream, decode them, and split on the \n\n
      // event boundary. The last element after split may be an incomplete event
      // so we keep it in `buffer` and prepend it to the next chunk.
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        let done: boolean;
        let value: Uint8Array | undefined;
        try {
          ({ done, value } = await reader.read());
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            setEntries((prev) => [
              ...prev,
              { type: 'message', data: { role: 'assistant', content: 'Stream interrupted.' } },
            ]);
          }
          setIsStreaming(false);
          return;
        }

        if (done) break;

        // Accumulate decoded text and split on SSE event boundaries
        buffer += decoder.decode(value, { stream: true });
        const rawEvents = buffer.split('\n\n');

        // The last element is incomplete (no trailing \n\n yet) — keep it
        buffer = rawEvents.pop() ?? '';

        for (const raw of rawEvents) {
          const line = raw.trim();
          // Every SSE data line starts with "data: "
          if (!line.startsWith('data: ')) continue;

          let event: StreamEvent;
          try {
            event = JSON.parse(line.slice(6)) as StreamEvent;
          } catch {
            // Malformed JSON frame — skip silently
            continue;
          }

          // ── Dispatch by event type ──────────────────────────────────────────
          if (event.type === 'delta') {
            // Append incremental text to the in-progress bubble
            setStreamingText((prev) => prev + event.text);
          } else if (event.type === 'action') {
            // Upsert action card: replace if id already exists, otherwise append
            setStreamingActions((prev) => {
              const idx = prev.findIndex((a) => a.id === event.action.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = event.action;
                return next;
              }
              return [...prev, event.action];
            });
          } else if (event.type === 'error') {
            // Non-fatal — always followed by a `done` event
            setStreamingText((prev) => prev || `Error: ${event.message}`);
          } else if (event.type === 'done') {
            // Terminal event: use the reconciled reply and action list from `done`
            const finalActions = event.actions;
            setEntries((prev) => [
              ...prev,
              { type: 'message', data: { role: 'assistant', content: event.reply } },
              ...(finalActions.length > 0
                ? [{ type: 'actions' as const, id: crypto.randomUUID(), data: finalActions }]
                : []),
            ]);
            setStreamingText('');
            setStreamingActions([]);
            setIsStreaming(false);
            return;
          }
        }
      }

      // Stream closed without a `done` event — clean up gracefully
      setIsStreaming(false);
    },
    [],
  );

  // ── Event handlers ──────────────────────────────────────────────────────────
  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userEntry: MessageEntry = { type: 'message', data: { role: 'user', content: text } };
    const nextEntries = [...entries, userEntry];
    setEntries(nextEntries);
    setInput('');
    void streamChat(pickMessages(nextEntries));
  };

  const handleConfirm = (actionsEntryId: string, action: AssistantAction) => {
    const confirmed: ConfirmedAction = {
      id: action.id,
      toolName: action.toolName,
      params: action.params ?? {},
    };
    const currentMessages = pickMessages(entries);
    setEntries((prev) => prev.filter((e) => !(e.type === 'actions' && e.id === actionsEntryId)));
    void streamChat(currentMessages, [confirmed]);
  };

  const handleDismiss = (actionsEntryId: string) => {
    setEntries((prev) => prev.filter((e) => !(e.type === 'actions' && e.id === actionsEntryId)));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus:outline-none"
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex w-80 flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900 md:w-96"
          style={{ maxHeight: '65vh' }}
        >
          {/* Header */}
          <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 px-5 py-4 dark:border-white/10">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white">AI Assistant</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                Ask me anything about your dashboard
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="ml-auto flex-shrink-0 rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-gray-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Collapse"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Message list */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ minHeight: 0 }}>
            {entries.length === 0 && !isStreaming && (
              <div className="py-6 text-center">
                <Bot className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Hi! I can help you manage tasks, habits, focus sessions, finance, and more.
                </p>
              </div>
            )}

            {entries.map((entry, i) => {
              if (entry.type === 'message') {
                const isUser = entry.data.role === 'user';
                return (
                  <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
                          : 'bg-gray-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {entry.data.content}
                    </div>
                  </div>
                );
              }

              // Action entry — pending_confirmation cards + resolved chips
              const pending = entry.data.filter((a) => a.status === 'pending_confirmation');
              const resolved = entry.data.filter((a) => a.status !== 'pending_confirmation');

              return (
                <div key={entry.id} className="space-y-2">
                  {resolved.map((action) => (
                    <div
                      key={action.id}
                      className={`rounded-xl border px-3 py-2 text-xs ${
                        action.status === 'done'
                          ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-400'
                          : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {action.status === 'done' ? (
                          <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        )}
                        <span>{action.description}</span>
                      </div>
                      {action.status === 'failed' && action.errorMessage && (
                        <p className="mt-1 pl-5 opacity-75">{action.errorMessage}</p>
                      )}
                    </div>
                  ))}

                  {pending.length > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/40 dark:bg-amber-900/20">
                      <p className="mb-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                        Confirm action{pending.length > 1 ? 's' : ''}:
                      </p>
                      {pending.map((action) => (
                        <div key={action.id} className="mb-3 last:mb-0">
                          <p className="mb-2 text-xs text-amber-800 dark:text-amber-300">
                            {action.description}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleConfirm(entry.id, action)}
                              disabled={isStreaming}
                              className="flex-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleDismiss(entry.id)}
                              disabled={isStreaming}
                              className="flex-1 rounded-xl border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/40"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Live streaming bubble — shown while stream is in flight */}
            {isStreaming && (
              <>
                <div className="flex justify-start">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-gray-100 px-4 py-2.5 text-sm leading-relaxed text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                    {streamingText === '' ? (
                      // Typing indicator: shown before the first delta arrives
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Thinking…</span>
                      </div>
                    ) : (
                      streamingText
                    )}
                  </div>
                </div>

                {/* Resolved action chips that arrived mid-stream via `action` events */}
                {streamingActions
                  .filter((a) => a.status !== 'pending_confirmation')
                  .map((action) => (
                    <div
                      key={action.id}
                      className={`rounded-xl border px-3 py-2 text-xs ${
                        action.status === 'done'
                          ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-400'
                          : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {action.status === 'done' ? (
                          <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        )}
                        <span>{action.description}</span>
                      </div>
                    </div>
                  ))}
              </>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 border-t border-gray-100 p-3 dark:border-white/10">
            <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-slate-800">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask something…"
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder-slate-500"
                style={{ maxHeight: '96px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white transition-all hover:scale-105 disabled:scale-100 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-slate-400 dark:text-slate-600">
              Enter to send · Shift+Enter for newline
            </p>
          </div>
        </div>
      )}
    </>
  );
};
