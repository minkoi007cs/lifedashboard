import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
import api from '../../lib/axios';
import type {
  AssistantAction,
  AssistantMessage,
  ChatRequest,
  ChatResponse,
  ConfirmedAction,
} from '@life-dashboard/shared';

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
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (body: ChatRequest) => {
      const res = await api.post<ChatResponse>('/api/v1/assistant/chat', body);
      return res.data;
    },
    onSuccess: (data) => {
      const assistantEntry: MessageEntry = {
        type: 'message',
        data: { role: 'assistant', content: data.reply },
      };
      if (data.actions.length > 0) {
        const actionsEntry: ActionsEntry = {
          type: 'actions',
          id: crypto.randomUUID(),
          data: data.actions,
        };
        setEntries((prev) => [...prev, assistantEntry, actionsEntry]);
      } else {
        setEntries((prev) => [...prev, assistantEntry]);
      }
    },
    onError: () => {
      setEntries((prev) => [
        ...prev,
        {
          type: 'message',
          data: { role: 'assistant', content: 'Something went wrong. Please try again.' },
        },
      ]);
    },
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;

    const userEntry: MessageEntry = { type: 'message', data: { role: 'user', content: text } };
    const nextEntries = [...entries, userEntry];
    setEntries(nextEntries);
    setInput('');
    chatMutation.mutate({ messages: pickMessages(nextEntries) });
  };

  const handleConfirm = (actionsEntryId: string, action: AssistantAction) => {
    const confirmed: ConfirmedAction = {
      id: action.id,
      toolName: action.toolName,
      params: action.params ?? {},
    };
    const currentMessages = pickMessages(entries);
    setEntries((prev) => prev.filter((e) => !(e.type === 'actions' && e.id === actionsEntryId)));
    chatMutation.mutate({ messages: currentMessages, confirmedActions: [confirmed] });
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, chatMutation.isPending]);

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
            {entries.length === 0 && (
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
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
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

              // Action entry
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
                              disabled={chatMutation.isPending}
                              className="flex-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleDismiss(entry.id)}
                              disabled={chatMutation.isPending}
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

            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2.5 dark:bg-slate-800">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Thinking…</span>
                </div>
              </div>
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
                disabled={!input.trim() || chatMutation.isPending}
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
