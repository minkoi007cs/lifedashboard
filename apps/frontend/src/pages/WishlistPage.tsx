import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gift } from 'lucide-react';
import api from '../lib/axios';
import { PageHeader } from '../components/ui/shell';
import type { FeedWish, MyWish, WishlistUser } from '../types/wishlist';
import { WishComposer } from '../components/wishlist/WishComposer';
import { FriendsWishlistSection } from '../components/wishlist/FriendsWishlistSection';
import { MyWishlistSection } from '../components/wishlist/MyWishlistSection';
import { defaultWishForm, type ResponseDraft, type WishFormState, type WishTimeTag } from '../components/wishlist/wishlist-helpers';

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
}

export const WishlistPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<WishFormState>(defaultWishForm);
  const [editingWishId, setEditingWishId] = useState<string | null>(null);
  const [shareWishId, setShareWishId] = useState<string | null>(null);
  const [planWishId, setPlanWishId] = useState<string | null>(null);
  const [planStartDate, setPlanStartDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [planEndDate, setPlanEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<WishlistUser[]>([]);
  const [responseDrafts, setResponseDrafts] = useState<Record<string, ResponseDraft>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [myFilter, setMyFilter] = useState<'all' | WishTimeTag>('all');
  const [feedFilter, setFeedFilter] = useState<'all' | 'pending' | 'responded'>('all');
  const [formFeedback, setFormFeedback] = useState<{ error?: string | null; success?: string | null }>({});

  const { data: myWishes = [], isLoading: myLoading } = useQuery<MyWish[]>({
    queryKey: ['wishes', 'mine'],
    queryFn: async () => (await api.get('/api/v1/wishes/mine')).data,
  });

  const { data: feedWishes = [], isLoading: feedLoading } = useQuery<FeedWish[]>({
    queryKey: ['wishes', 'feed'],
    queryFn: async () => (await api.get('/api/v1/wishes/feed')).data,
  });

  const activeShareWish = myWishes.find((wish) => wish.id === shareWishId) ?? null;

  const { data: searchResults = [], isFetching: isSearching } = useQuery<WishlistUser[]>({
    queryKey: ['users', 'search', searchTerm],
    enabled: !!activeShareWish && searchTerm.trim().length > 0,
    queryFn: async () => (await api.get('/api/v1/users/search', { params: { q: searchTerm.trim() } })).data,
  });

  useEffect(() => {
    if (!activeShareWish) {
      setSelectedUsers([]);
      setSearchTerm('');
      return;
    }

    setSelectedUsers(activeShareWish.shares.map((share) => share.recipient));
  }, [activeShareWish]);

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: ['wishes'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const saveWishMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        description: form.description.trim() || undefined,
      };
      if (editingWishId) {
        return api.patch(`/api/v1/wishes/${editingWishId}`, payload);
      }
      return api.post('/api/v1/wishes', payload);
    },
    onSuccess: () => {
      setEditingWishId(null);
      setForm(defaultWishForm);
      setFormFeedback({ success: 'Wish saved successfully.', error: null });
      invalidateData();
    },
    onError: (error) => {
      setFormFeedback({ error: getErrorMessage(error, 'Could not save the wish.'), success: null });
    },
  });

  const deleteWishMutation = useMutation({
    mutationFn: async (wishId: string) => api.delete(`/api/v1/wishes/${wishId}`),
    onSuccess: () => invalidateData(),
  });

  const shareWishMutation = useMutation({
    mutationFn: async () => api.post(`/api/v1/wishes/${shareWishId}/share`, { userIds: selectedUsers.map((user) => user.id) }),
    onSuccess: () => {
      setShareWishId(null);
      setFormFeedback({ success: 'Sharing updated.', error: null });
      invalidateData();
    },
    onError: (error) => {
      setFormFeedback({ error: getErrorMessage(error, 'Could not update sharing.'), success: null });
    },
  });

  const [submitPendingId, setSubmitPendingId] = useState<string | null>(null);
  const respondMutation = useMutation({
    mutationFn: async ({ wishId, payload }: { wishId: string; payload: ResponseDraft }) => {
      setSubmitPendingId(wishId);
      return api.post(`/api/v1/wishes/${wishId}/respond`, payload);
    },
    onSuccess: () => invalidateData(),
    onSettled: () => setSubmitPendingId(null),
  });

  const [commentPendingId, setCommentPendingId] = useState<string | null>(null);
  const addCommentMutation = useMutation({
    mutationFn: async ({ wishId, comment }: { wishId: string; comment: string }) => {
      setCommentPendingId(wishId);
      return api.post(`/api/v1/wishes/${wishId}/comments`, { comment });
    },
    onSuccess: (_, variables) => {
      setCommentDrafts((current) => ({ ...current, [variables.wishId]: '' }));
      invalidateData();
    },
    onSettled: () => setCommentPendingId(null),
  });

  const createPlanMutation = useMutation({
    mutationFn: async (wishId: string) => api.post(`/api/v1/wishes/${wishId}/create-plan`, { startDate: planStartDate, endDate: planEndDate || undefined }),
    onSuccess: () => {
      setPlanWishId(null);
      setFormFeedback({ success: 'Shared plan created.', error: null });
      invalidateData();
    },
    onError: (error) => {
      setFormFeedback({ error: getErrorMessage(error, 'Could not create the shared plan.'), success: null });
    },
  });

  const filteredMyWishes = useMemo(
    () => myWishes.filter((wish) => myFilter === 'all' || wish.timeTag === myFilter),
    [myFilter, myWishes],
  );

  const filteredFeed = useMemo(
    () => feedWishes.filter((wish) => {
      if (feedFilter === 'pending') return !wish.hasResponded;
      if (feedFilter === 'responded') return wish.hasResponded;
      return true;
    }),
    [feedFilter, feedWishes],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Social planning"
        title="Wishlist"
        description="Capture casual wants, share them with people in the system, collect responses, and turn confirmed activities into shared plans."
        icon={<Gift className="h-6 w-6" />}
      />

      <WishComposer
        form={form}
        onChange={setForm}
        onSubmit={() => saveWishMutation.mutate()}
        onCancelEdit={() => {
          setEditingWishId(null);
          setForm(defaultWishForm);
          setFormFeedback({});
        }}
        isEditing={!!editingWishId}
        isPending={saveWishMutation.isPending}
        errorMessage={formFeedback.error}
        successMessage={formFeedback.success}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <MyWishlistSection
          wishes={filteredMyWishes}
          isLoading={myLoading}
          filter={myFilter}
          onFilterChange={setMyFilter}
          onEdit={(wish) => {
            setEditingWishId(wish.id);
            setForm({ title: wish.title, description: wish.description || '', type: wish.type, timeTag: wish.timeTag });
            setFormFeedback({});
          }}
          onDelete={(wishId) => deleteWishMutation.mutate(wishId)}
          onToggleShare={setShareWishId}
          onTogglePlan={setPlanWishId}
          shareWishId={shareWishId}
          planWishId={planWishId}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          searchResults={searchResults}
          isSearching={isSearching}
          selectedUsers={selectedUsers}
          onToggleSelectedUser={(user) => {
            setSelectedUsers((current) => current.some((item) => item.id === user.id) ? current.filter((item) => item.id !== user.id) : [...current, user]);
          }}
          onSaveSharing={() => shareWishMutation.mutate()}
          isSharingPending={shareWishMutation.isPending}
          planStartDate={planStartDate}
          planEndDate={planEndDate}
          onPlanStartDateChange={setPlanStartDate}
          onPlanEndDateChange={setPlanEndDate}
          onCreatePlan={(wishId) => createPlanMutation.mutate(wishId)}
          isPlanPending={createPlanMutation.isPending}
        />

        <FriendsWishlistSection
          wishes={filteredFeed}
          isLoading={feedLoading}
          filter={feedFilter}
          onFilterChange={setFeedFilter}
          responseDrafts={responseDrafts}
          onDraftChange={(wishId, draft) => setResponseDrafts((current) => ({ ...current, [wishId]: draft }))}
          onSubmitResponse={(wishId) => {
            const wish = filteredFeed.find((item) => item.id === wishId);
            const draft = responseDrafts[wishId] ?? {
              status: wish?.currentResponse?.status ?? 'commented',
              comment: wish?.currentResponse?.comment ?? '',
              addToPlan: wish?.currentResponse?.addToPlan ?? false,
            };
            respondMutation.mutate({
              wishId,
              payload: {
                status: wish?.canEditResponse ? draft.status : wish?.currentResponse?.status || 'commented',
                comment: draft.comment,
                addToPlan: wish?.canEditResponse ? draft.addToPlan : wish?.currentResponse?.addToPlan || false,
              },
            });
          }}
          submitPendingId={submitPendingId}
          commentDrafts={commentDrafts}
          onCommentDraftChange={(wishId, comment) => setCommentDrafts((current) => ({ ...current, [wishId]: comment }))}
          onSubmitComment={(wishId) => addCommentMutation.mutate({ wishId, comment: commentDrafts[wishId] ?? '' })}
          commentPendingId={commentPendingId}
        />
      </div>
    </div>
  );
};

export default WishlistPage;
