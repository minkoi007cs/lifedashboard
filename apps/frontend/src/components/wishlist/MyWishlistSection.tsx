import {
  CalendarPlus,
  Check,
  Loader2,
  Pencil,
  Share2,
  Trash2,
  Users,
} from 'lucide-react';
import type { MyWish, WishlistUser } from '../../types/wishlist';
import {
  ActionButton,
  SegmentedTabs,
  SoftButton,
  SurfaceCard,
} from '../ui/shell';
import { getResponseLabel, getTimeTagLabel, type WishTimeTag } from './wishlist-helpers';

export function MyWishlistSection({
  wishes,
  isLoading,
  filter,
  onFilterChange,
  onEdit,
  onDelete,
  onToggleShare,
  onTogglePlan,
  shareWishId,
  planWishId,
  searchTerm,
  onSearchTermChange,
  searchResults,
  isSearching,
  selectedUsers,
  onToggleSelectedUser,
  onSaveSharing,
  isSharingPending,
  planStartDate,
  planEndDate,
  onPlanStartDateChange,
  onPlanEndDateChange,
  onCreatePlan,
  isPlanPending,
}: {
  wishes: MyWish[];
  isLoading: boolean;
  filter: 'all' | WishTimeTag;
  onFilterChange: (value: 'all' | WishTimeTag) => void;
  onEdit: (wish: MyWish) => void;
  onDelete: (wishId: string) => void;
  onToggleShare: (wishId: string | null) => void;
  onTogglePlan: (wishId: string | null) => void;
  shareWishId: string | null;
  planWishId: string | null;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  searchResults: WishlistUser[];
  isSearching: boolean;
  selectedUsers: WishlistUser[];
  onToggleSelectedUser: (user: WishlistUser) => void;
  onSaveSharing: () => void;
  isSharingPending: boolean;
  planStartDate: string;
  planEndDate: string;
  onPlanStartDateChange: (value: string) => void;
  onPlanEndDateChange: (value: string) => void;
  onCreatePlan: (wishId: string) => void;
  isPlanPending: boolean;
}) {
  return (
    <SurfaceCard className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-pink-500 dark:text-pink-300">
            Section 1
          </p>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            My Wishlist
          </h2>
        </div>
        <SegmentedTabs
          value={filter}
          onChange={onFilterChange}
          tabs={[
            { id: 'all', label: 'All' },
            { id: 'today', label: 'Today' },
            { id: 'this_week', label: 'This week' },
            { id: 'soon', label: 'Soon' },
          ]}
          className="xl:w-auto"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        </div>
      ) : wishes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-orange-100 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
          No wishes in this view yet.
        </div>
      ) : (
        wishes.map((wish) => {
          const canCreatePlan =
            wish.type === 'activity' &&
            !wish.planCreatedAt &&
            wish.responses.some(
              (response) =>
                response.status === 'confirmed' && response.addToPlan,
            );

          return (
            <div
              key={wish.id}
              className="rounded-[28px] border border-orange-100 bg-orange-50/50 p-5 dark:border-white/10 dark:bg-slate-800/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white dark:bg-white dark:text-slate-900">
                  {wish.type}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                  {getTimeTagLabel(wish.timeTag)}
                </span>
                {wish.wasEdited ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    Updated
                  </span>
                ) : null}
                {wish.planCreatedAt ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    Plan created
                  </span>
                ) : null}
              </div>
              <h3 className="mt-3 text-xl font-black text-slate-900 dark:text-white">
                {wish.title}
              </h3>
              {wish.description ? (
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {wish.description}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span>{wish.shareCount} shared</span>
                <span>{wish.responseSummary.confirmed} confirmed</span>
                <span>{wish.responseSummary.declined} declined</span>
                <span>{wish.responseSummary.comments} comments</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {wish.shares.map((share) => (
                  <span
                    key={share.id}
                    className="rounded-full border border-orange-100 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {share.recipient.name || share.recipient.email}
                  </span>
                ))}
              </div>
              {wish.responses.length > 0 ? (
                <div className="mt-4 space-y-2 rounded-2xl border border-white/70 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-900/80">
                  {wish.responses.map((response) => (
                    <div
                      key={response.id}
                      className="rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3 dark:border-white/10 dark:bg-slate-800/70"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {response.responder.name || response.responder.email}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                          {getResponseLabel(response.status)}
                        </span>
                        {response.addToPlan ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            Add to plan
                          </span>
                        ) : null}
                      </div>
                      {response.comment ? (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                          {response.comment}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
              {wish.comments.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-white/70 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-900/80">
                  <p className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
                    Comments
                  </p>
                  <div className="space-y-2">
                    {wish.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-800/70"
                      >
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {comment.author.name || comment.author.email}
                        </p>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                          {comment.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <SoftButton
                  type="button"
                  onClick={() => onEdit(wish)}
                  disabled={!!wish.planCreatedAt}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </SoftButton>
                <SoftButton
                  type="button"
                  onClick={() =>
                    onToggleShare(shareWishId === wish.id ? null : wish.id)
                  }
                >
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </SoftButton>
                <SoftButton
                  type="button"
                  onClick={() =>
                    onTogglePlan(planWishId === wish.id ? null : wish.id)
                  }
                  disabled={!canCreatePlan}
                >
                  <CalendarPlus className="mr-2 h-4 w-4" /> Create plan
                </SoftButton>
                <SoftButton
                  type="button"
                  onClick={() => onDelete(wish.id)}
                  disabled={!!wish.planCreatedAt}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </SoftButton>
              </div>

              {shareWishId === wish.id ? (
                <div className="mt-4 space-y-4 rounded-2xl border border-dashed border-orange-200 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-900/80">
                  <input
                    value={searchTerm}
                    onChange={(event) => onSearchTermChange(event.target.value)}
                    placeholder="Search by name or email"
                    className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Search results {isSearching ? '...' : ''}
                      </p>
                      {searchResults.map((user) => {
                        const isSelected = selectedUsers.some(
                          (item) => item.id === user.id,
                        );
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => onToggleSelectedUser(user)}
                            className={[
                              'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
                              isSelected
                                ? 'border-transparent bg-gradient-to-r from-orange-400 via-pink-500 to-fuchsia-600 text-white shadow-lg shadow-pink-300/30'
                                : 'border-orange-100 bg-orange-50/70 text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200',
                            ].join(' ')}
                          >
                            <span>
                              <span className="block text-sm font-semibold">
                                {user.name || 'Unnamed user'}
                              </span>
                              <span className="block text-xs opacity-80">
                                {user.email}
                              </span>
                            </span>
                            {isSelected ? <Check className="h-4 w-4" /> : null}
                          </button>
                        );
                      })}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Selected
                      </p>
                      {selectedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {user.name || user.email}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <ActionButton
                      type="button"
                      onClick={onSaveSharing}
                      disabled={selectedUsers.length === 0 || isSharingPending}
                    >
                      <Users className="mr-2 h-4 w-4" /> Save sharing
                    </ActionButton>
                    <SoftButton type="button" onClick={() => onToggleShare(null)}>
                      Close
                    </SoftButton>
                  </div>
                </div>
              ) : null}

              {planWishId === wish.id ? (
                <div className="mt-4 space-y-4 rounded-2xl border border-dashed border-orange-200 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-900/80">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Start
                      </p>
                      <input
                        type="datetime-local"
                        value={planStartDate}
                        onChange={(event) =>
                          onPlanStartDateChange(event.target.value)
                        }
                        className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        End
                      </p>
                      <input
                        type="datetime-local"
                        value={planEndDate}
                        onChange={(event) =>
                          onPlanEndDateChange(event.target.value)
                        }
                        className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <ActionButton
                      type="button"
                      onClick={() => onCreatePlan(wish.id)}
                      disabled={!planStartDate || isPlanPending}
                    >
                      <CalendarPlus className="mr-2 h-4 w-4" /> Confirm plan
                    </ActionButton>
                    <SoftButton type="button" onClick={() => onTogglePlan(null)}>
                      Close
                    </SoftButton>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </SurfaceCard>
  );
}
