import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { ActionButton, SoftButton, SurfaceCard } from '../ui/shell';
import {
  defaultWishForm,
  timeTagOptions,
  typeOptions,
  type WishFormState,
} from './wishlist-helpers';

export function WishComposer({
  form,
  onChange,
  onSubmit,
  onCancelEdit,
  isEditing,
  isPending,
  errorMessage,
  successMessage,
}: {
  form: WishFormState;
  onChange: React.Dispatch<React.SetStateAction<WishFormState>>;
  onSubmit: () => void;
  onCancelEdit: () => void;
  isEditing: boolean;
  isPending: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
}) {
  const titleError = !form.title.trim() ? 'Title is required.' : null;

  return (
    <SurfaceCard className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-fuchsia-600 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {isEditing ? 'Edit wish' : 'Create wish'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Use casual time tags now. Schedule the exact time only when
            creating a plan.
          </p>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {errorMessage}
        </div>
      ) : null}
      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          {successMessage}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div>
            <input
              value={form.title}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Wish title"
              className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:text-white"
            />
            {titleError ? (
              <p className="mt-1 text-xs text-red-500">{titleError}</p>
            ) : null}
          </div>
          <div>
            <textarea
              value={form.description}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Description"
              className="h-28 w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {form.description.trim().length}/500 characters
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Type
            </p>
            {typeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    type: option.value,
                  }))
                }
                className={[
                  'w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                  form.type === option.value
                    ? 'border-transparent bg-gradient-to-r from-orange-400 via-pink-500 to-fuchsia-600 text-white shadow-lg shadow-pink-300/30'
                    : 'border-orange-100 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Time tag
            </p>
            {timeTagOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    timeTag: option.value,
                  }))
                }
                className={[
                  'w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                  form.timeTag === option.value
                    ? 'border-transparent bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'border-orange-100 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <ActionButton
          type="button"
          onClick={onSubmit}
          disabled={!!titleError || isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isEditing ? 'Update wish' : 'Save wish'}
        </ActionButton>
        {isEditing ? (
          <SoftButton type="button" onClick={onCancelEdit}>
            Cancel edit
          </SoftButton>
        ) : null}
        {!isEditing &&
        (form.title ||
          form.description ||
          form.type !== defaultWishForm.type ||
          form.timeTag !== defaultWishForm.timeTag) ? (
          <SoftButton type="button" onClick={() => onChange(defaultWishForm)}>
            Reset
          </SoftButton>
        ) : null}
      </div>
    </SurfaceCard>
  );
}
