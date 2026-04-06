export type WishType = 'activity' | 'item';
export type WishTimeTag = 'today' | 'this_week' | 'soon';
export type WishResponseStatus = 'confirmed' | 'declined' | 'commented';

export interface WishlistUser {
  id: string;
  name?: string;
  email: string;
  avatarUrl?: string;
}

export interface WishResponseItem {
  id: string;
  status: WishResponseStatus;
  comment?: string | null;
  addToPlan: boolean;
  respondedAt: string;
  responder: WishlistUser;
}

export interface WishCommentItem {
  id: string;
  comment: string;
  createdAt: string;
  author: WishlistUser;
}

export interface MyWish {
  id: string;
  title: string;
  description?: string | null;
  type: WishType;
  timeTag: WishTimeTag;
  wasEdited: boolean;
  planTaskId?: string | null;
  planCreatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  shareCount: number;
  shares: Array<{
    id: string;
    recipient: WishlistUser;
  }>;
  responseSummary: {
    confirmed: number;
    declined: number;
    comments: number;
  };
  responses: WishResponseItem[];
  comments: WishCommentItem[];
}

export interface FeedWish {
  id: string;
  title: string;
  description?: string | null;
  type: WishType;
  timeTag: WishTimeTag;
  wasEdited: boolean;
  planCreatedAt?: string | null;
  updatedAt: string;
  owner: WishlistUser;
  comments: WishCommentItem[];
  currentResponse?: {
    id: string;
    wishId: string;
    responderId: string;
    status: WishResponseStatus;
    comment?: string | null;
    addToPlan: boolean;
    respondedAt: string;
  } | null;
  hasResponded: boolean;
  hasUpdatesSinceResponse: boolean;
  canEditResponse: boolean;
}
