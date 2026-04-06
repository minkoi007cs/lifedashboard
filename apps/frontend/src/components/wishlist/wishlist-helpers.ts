import type {
  WishResponseStatus,
  WishTimeTag,
  WishType,
} from '../../types/wishlist';

export type { WishTimeTag } from '../../types/wishlist';

export type WishFormState = {
  title: string;
  description: string;
  type: WishType;
  timeTag: WishTimeTag;
};

export type ResponseDraft = {
  status: WishResponseStatus;
  comment: string;
  addToPlan: boolean;
};

export const defaultWishForm: WishFormState = {
  title: '',
  description: '',
  type: 'activity',
  timeTag: 'soon',
};

export const timeTagOptions: Array<{ value: WishTimeTag; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'soon', label: 'Soon' },
];

export const typeOptions: Array<{ value: WishType; label: string }> = [
  { value: 'activity', label: 'Want to do' },
  { value: 'item', label: 'Want to have' },
];

export function getTimeTagLabel(timeTag: WishTimeTag) {
  return (
    timeTagOptions.find((option) => option.value === timeTag)?.label ?? timeTag
  );
}

export function getResponseLabel(status: WishResponseStatus) {
  if (status === 'confirmed') return 'Confirmed';
  if (status === 'declined') return 'Declined';
  return 'Commented';
}
