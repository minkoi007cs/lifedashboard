import React, { useEffect } from 'react';
import { CircleHelp, X } from 'lucide-react';
import { helpContentByPage, helpTitleByPage, type HelpPageKey } from '../../help/help-content';

type HelpPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  pageKey: HelpPageKey;
};

export const HelpPanel: React.FC<HelpPanelProps> = ({
  isOpen,
  onClose,
  pageKey,
}) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-slate-950/35 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-[70] w-full max-w-[560px] border-l border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(255,247,237,0.96))] shadow-[0_24px_80px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96))]">
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-white/50 px-5 py-4 dark:border-white/10">
            <div className="min-w-0">
              <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-fuchsia-600 text-white shadow-lg shadow-pink-300/35">
                <CircleHelp className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {helpTitleByPage[pageKey]}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Guidance is loaded from a dedicated local HTML file for this page.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-100 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
              aria-label="Close help panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="help-panel-scroll flex-1 overflow-y-auto px-5 py-5">
            <div
              dangerouslySetInnerHTML={{ __html: helpContentByPage[pageKey] }}
            />
          </div>
        </div>
      </aside>
    </>
  );
};
