import { Loader2, MessageSquare, Send } from 'lucide-react';
import type { FeedWish, WishResponseStatus } from '../../types/wishlist';
import { ActionButton, SegmentedTabs, SurfaceCard } from '../ui/shell';
import { getResponseLabel, getTimeTagLabel, type ResponseDraft } from './wishlist-helpers';

export function FriendsWishlistSection({
  wishes,
  isLoading,
  filter,
  onFilterChange,
  responseDrafts,
  onDraftChange,
  onSubmitResponse,
  submitPendingId,
  commentDrafts,
  onCommentDraftChange,
  onSubmitComment,
  commentPendingId,
}: {
  wishes: FeedWish[];
  isLoading: boolean;
  filter: 'all' | 'pending' | 'responded';
  onFilterChange: (value: 'all' | 'pending' | 'responded') => void;
  responseDrafts: Record<string, ResponseDraft>;
  onDraftChange: (wishId: string, draft: ResponseDraft) => void;
  onSubmitResponse: (wishId: string) => void;
  submitPendingId: string | null;
  commentDrafts: Record<string, string>;
  onCommentDraftChange: (wishId: string, comment: string) => void;
  onSubmitComment: (wishId: string) => void;
  commentPendingId: string | null;
}) {
  return (
    <SurfaceCard className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-pink-500 dark:text-pink-300">Section 2</p>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Friends' Wishes</h2>
        </div>
        <SegmentedTabs value={filter} onChange={onFilterChange} tabs={[{ id: 'all', label: 'All' }, { id: 'pending', label: 'Pending' }, { id: 'responded', label: 'Responded' }]} className="xl:w-auto" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-pink-500" /></div>
      ) : wishes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-orange-100 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
          No wishes in this inbox view.
        </div>
      ) : wishes.map((wish) => {
        const draft = responseDrafts[wish.id] ?? {
          status: wish.currentResponse?.status ?? 'commented',
          comment: wish.currentResponse?.comment ?? '',
          addToPlan: wish.currentResponse?.addToPlan ?? false,
        };

        return (
          <div key={wish.id} className="rounded-[28px] border border-orange-100 bg-orange-50/50 p-5 dark:border-white/10 dark:bg-slate-800/40">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white dark:bg-white dark:text-slate-900">{wish.type}</span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">{getTimeTagLabel(wish.timeTag)}</span>
              {wish.currentResponse ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{getResponseLabel(wish.currentResponse.status)}</span> : null}
              {wish.hasUpdatesSinceResponse ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Updated since your response</span> : null}
            </div>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{wish.owner.name || wish.owner.email}</p>
            <h3 className="mt-2 text-xl font-black text-slate-900 dark:text-white">{wish.title}</h3>
            {wish.description ? <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{wish.description}</p> : null}
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Updated {new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(Math.round((new Date(wish.updatedAt).getTime() - Date.now()) / 86400000), 'day')}</p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {(['confirmed', 'declined', 'commented'] as WishResponseStatus[]).map((status) => (
                <button key={status} type="button" disabled={!wish.canEditResponse} onClick={() => onDraftChange(wish.id, { ...draft, status, addToPlan: status === 'confirmed' ? draft.addToPlan : false })} className={['rounded-2xl border px-4 py-3 text-sm font-semibold transition', draft.status === status ? 'border-transparent bg-gradient-to-r from-orange-400 via-pink-500 to-fuchsia-600 text-white shadow-lg shadow-pink-300/30' : 'border-orange-100 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200', !wish.canEditResponse ? 'cursor-not-allowed opacity-60' : ''].join(' ')}>
                  {getResponseLabel(status)}
                </button>
              ))}
            </div>

            <textarea value={draft.comment} onChange={(event) => onDraftChange(wish.id, { ...draft, comment: event.target.value })} placeholder="Response note" className="mt-3 h-24 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-pink-300 dark:border-white/10 dark:bg-slate-900 dark:text-white" />
            {wish.type === 'activity' && draft.status === 'confirmed' ? (
              <label className="mt-3 flex items-center gap-3 rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
                <input type="checkbox" checked={draft.addToPlan} disabled={!wish.canEditResponse} onChange={(event) => onDraftChange(wish.id, { ...draft, addToPlan: event.target.checked })} />
                Add this to my calendar if the owner creates the plan
              </label>
            ) : null}
            {!wish.canEditResponse && wish.currentResponse ? <p className="mt-3 text-sm text-amber-600 dark:text-amber-300">The plan is already created. Status is locked, but comments stay open.</p> : null}
            <div className="mt-4 flex justify-end">
              <ActionButton type="button" onClick={() => onSubmitResponse(wish.id)} disabled={submitPendingId === wish.id || (!wish.canEditResponse && !wish.currentResponse)}>
                {submitPendingId === wish.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit response
              </ActionButton>
            </div>

            <div className="mt-4 rounded-2xl border border-white/70 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-900/80">
              <p className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Comments</p>
              <div className="space-y-2">
                {wish.comments.map((comment) => (
                  <div key={comment.id} className="rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-800/70">
                    <p className="font-semibold text-slate-900 dark:text-white">{comment.author.name || comment.author.email}</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{comment.comment}</p>
                  </div>
                ))}
                {wish.comments.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No comments yet.</p>
                ) : null}
              </div>
              <div className="mt-3 space-y-3">
                <textarea value={commentDrafts[wish.id] ?? ''} onChange={(event) => onCommentDraftChange(wish.id, event.target.value)} placeholder="Add a comment to the thread" className="h-20 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-pink-300 dark:border-white/10 dark:bg-slate-900 dark:text-white" />
                <div className="flex justify-end">
                  <ActionButton type="button" onClick={() => onSubmitComment(wish.id)} disabled={commentPendingId === wish.id || !(commentDrafts[wish.id] ?? '').trim()}>
                    {commentPendingId === wish.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                    Add comment
                  </ActionButton>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </SurfaceCard>
  );
}
