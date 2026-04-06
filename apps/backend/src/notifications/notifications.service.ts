import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppNotification, NotificationType } from './notification.entity';
import { User } from '../users/user.entity';

type CreateNotificationInput = {
    userIds: string[];
    actor?: Pick<User, 'id' | 'name' | 'avatarUrl'> | null;
    title: string;
    message: string;
    type: NotificationType;
    link?: string | null;
};

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(AppNotification)
        private notificationsRepository: Repository<AppNotification>,
    ) { }

    async createForUsers(input: CreateNotificationInput) {
        const uniqueUserIds = [...new Set(input.userIds)];
        if (uniqueUserIds.length === 0) {
            return [];
        }

        const notifications = uniqueUserIds.map((userId) => this.notificationsRepository.create({
            userId,
            actorId: input.actor?.id,
            actorName: input.actor?.name,
            actorAvatarUrl: input.actor?.avatarUrl,
            title: input.title,
            message: input.message,
            type: input.type,
            link: input.link ?? undefined,
        }));

        return this.notificationsRepository.save(notifications);
    }

    async getMine(userId: string) {
        const items = await this.notificationsRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 20,
        });

        const unreadCount = await this.notificationsRepository.count({
            where: { userId, isRead: false },
        });

        return {
            unreadCount,
            items,
        };
    }

    async markRead(notificationId: string, userId: string) {
        const notification = await this.notificationsRepository.findOne({
            where: { id: notificationId, userId },
        });
        if (!notification) {
            throw new NotFoundException(`Notification with ID "${notificationId}" not found`);
        }

        notification.isRead = true;
        return this.notificationsRepository.save(notification);
    }

    async markAllRead(userId: string) {
        await this.notificationsRepository.update({ userId, isRead: false }, { isRead: true });
        return this.getMine(userId);
    }
}
