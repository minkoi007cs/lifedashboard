import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { User } from '../users/user.entity';

export enum NotificationType {
    WISH_SHARED = 'WISH_SHARED',
    WISH_RESPONSE = 'WISH_RESPONSE',
    WISH_COMMENT = 'WISH_COMMENT',
    WISH_UPDATED = 'WISH_UPDATED',
    WISH_PLAN_CREATED = 'WISH_PLAN_CREATED',
}

@Entity('notifications')
export class AppNotification extends BaseEntity {
    @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
    user: User;

    @Column()
    userId: string;

    @Column({ nullable: true })
    actorId?: string;

    @Column({ nullable: true })
    actorName?: string;

    @Column({ nullable: true })
    actorAvatarUrl?: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column()
    type: string;

    @Column({ nullable: true })
    link?: string;

    @Column({ default: false })
    isRead: boolean;
}
