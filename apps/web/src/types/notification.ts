export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  actorName?: string | null;
  actorAvatarUrl?: string | null;
}

export interface NotificationPayload {
  unreadCount: number;
  items: AppNotification[];
}
