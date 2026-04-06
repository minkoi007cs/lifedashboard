import { Column, Entity, ManyToOne, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { User } from '../users/user.entity';

export enum WishType {
    ACTIVITY = 'activity',
    ITEM = 'item',
}

export enum WishTimeTag {
    TODAY = 'today',
    THIS_WEEK = 'this_week',
    SOON = 'soon',
}

export enum WishResponseStatus {
    CONFIRMED = 'confirmed',
    DECLINED = 'declined',
    COMMENTED = 'commented',
}

@Entity('wish_entries')
export class WishEntry extends BaseEntity {
    @ManyToOne(() => User, (user) => user.wishes, { onDelete: 'CASCADE' })
    owner: User;

    @Column()
    ownerId: string;

    @Column()
    type: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column()
    timeTag: string;

    @Column({ default: false })
    wasEdited: boolean;

    @Column({ nullable: true })
    planTaskId?: string;

    @Column({ nullable: true })
    planCreatedAt?: Date;

    @OneToMany(() => WishShare, (share) => share.wish, { cascade: true })
    shares: WishShare[];

    @OneToMany(() => WishResponse, (response) => response.wish, { cascade: true })
    responses: WishResponse[];

    @OneToMany(() => WishComment, (comment) => comment.wish, { cascade: true })
    comments: WishComment[];
}

@Entity('wish_shares')
@Unique(['wishId', 'recipientId'])
export class WishShare extends BaseEntity {
    @ManyToOne(() => WishEntry, (wish) => wish.shares, { onDelete: 'CASCADE' })
    wish: WishEntry;

    @Column()
    wishId: string;

    @ManyToOne(() => User, (user) => user.wishShares, { onDelete: 'CASCADE' })
    recipient: User;

    @Column()
    recipientId: string;
}

@Entity('wish_responses')
@Unique(['wishId', 'responderId'])
export class WishResponse extends BaseEntity {
    @ManyToOne(() => WishEntry, (wish) => wish.responses, { onDelete: 'CASCADE' })
    wish: WishEntry;

    @Column()
    wishId: string;

    @ManyToOne(() => User, (user) => user.wishResponses, { onDelete: 'CASCADE' })
    responder: User;

    @Column()
    responderId: string;

    @Column()
    status: string;

    @Column({ type: 'text', nullable: true })
    comment?: string;

    @Column({ default: false })
    addToPlan: boolean;

    @Column()
    respondedAt: Date;
}

@Entity('wish_comments')
export class WishComment extends BaseEntity {
    @ManyToOne(() => WishEntry, (wish) => wish.comments, { onDelete: 'CASCADE' })
    wish: WishEntry;

    @Column()
    wishId: string;

    @ManyToOne(() => User, (user) => user.wishComments, { onDelete: 'CASCADE' })
    author: User;

    @Column()
    authorId: string;

    @Column({ type: 'text' })
    comment: string;
}
