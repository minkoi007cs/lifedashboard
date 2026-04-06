import React from 'react';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';

export function SurfaceCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        'rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-[0_18px_50px_rgba(251,146,60,0.12)] backdrop-blur md:p-6 dark:border-white/10 dark:bg-slate-900/78 dark:shadow-[0_18px_50px_rgba(2,6,23,0.38)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[30px] border border-white/60 bg-white/70 p-5 shadow-[0_20px_60px_rgba(251,146,60,0.14)] backdrop-blur xl:flex-row xl:items-center xl:justify-between dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_20px_60px_rgba(2,6,23,0.36)]">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-pink-500 dark:text-pink-300">
            {eyebrow}
          </p>
        ) : null}
        <div className="flex items-center gap-3">
          {icon ? (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-fuchsia-600 text-white shadow-lg shadow-pink-300/35">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white md:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  tabs,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  tabs: Array<{
    id: T;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'inline-flex w-full max-w-full gap-2 overflow-x-auto rounded-[22px] border border-white/70 bg-white/80 p-1.5 shadow-sm dark:border-white/10 dark:bg-slate-900/75',
        className,
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex min-w-fit items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all',
              active
                ? 'bg-gradient-to-r from-orange-400 via-pink-500 to-fuchsia-600 text-white shadow-lg shadow-pink-300/35'
                : 'text-slate-500 hover:bg-orange-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
            )}
          >
            {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function ActionButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-orange-400 via-pink-500 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-pink-300/35 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SoftButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center rounded-2xl border border-orange-100 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-orange-50 dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-200 dark:hover:bg-slate-800',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function WidgetFrame({
  title,
  icon,
  meta,
  children,
  footer,
  accent = 'from-orange-400 via-pink-500 to-fuchsia-600',
}: {
  title: string;
  icon: React.ReactNode;
  meta?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  accent?: string;
}) {
  return (
    <SurfaceCard className="flex h-full flex-col justify-between overflow-hidden">
      <div>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                'flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
                accent,
              )}
            >
              {icon}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {title}
              </h2>
              {meta ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {meta}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {children}
      </div>
      {footer ? <div className="mt-5">{footer}</div> : null}
    </SurfaceCard>
  );
}

export function LinkLikeFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center justify-center gap-1 rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-3 text-sm font-semibold text-pink-600 dark:border-white/10 dark:bg-slate-800/90 dark:text-pink-300">
      {children}
      <ChevronRight className="h-4 w-4" />
    </div>
  );
}
