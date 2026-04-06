import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
    WishComment,
    WishEntry,
    WishResponse,
    WishResponseStatus,
    WishShare,
    WishType,
} from './wish.entity';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { ShareWishDto } from './dto/share-wish.dto';
import { RespondToWishDto } from './dto/respond-to-wish.dto';
import { CreatePlanFromWishDto } from './dto/create-plan-from-wish.dto';
import { CreateWishCommentDto } from './dto/create-wish-comment.dto';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { TasksService } from '../tasks/tasks.service';
import { TaskPriority, TaskStatus } from '../tasks/task.entity';

type OwnerWishSummary = {
    confirmed: number;
    declined: number;
    comments: number;
};

@Injectable()
export class WishesService {
    constructor(
        @InjectRepository(WishEntry)
        private wishesRepository: Repository<WishEntry>,
        @InjectRepository(WishResponse)
        private wishResponsesRepository: Repository<WishResponse>,
        @InjectRepository(WishShare)
        private wishSharesRepository: Repository<WishShare>,
        private dataSource: DataSource,
        private usersService: UsersService,
        private notificationsService: NotificationsService,
        private tasksService: TasksService,
    ) { }

    private get wishCommentsRepository() {
        return this.dataSource.getRepository(WishComment);
    }

    async create(createWishDto: CreateWishDto, ownerId: string) {
        const wish = this.wishesRepository.create({
            ...createWishDto,
            ownerId,
            description: createWishDto.description ?? undefined,
            planTaskId: undefined,
            planCreatedAt: undefined,
        });

        return this.wishesRepository.save(wish);
    }

    async getMine(ownerId: string) {
        const wishes = await this.wishesRepository.find({
            where: { ownerId },
            relations: ['shares', 'shares.recipient', 'responses', 'responses.responder', 'comments', 'comments.author'],
            order: { createdAt: 'DESC' },
        });

        return wishes.map((wish) => this.serializeOwnerWish(wish));
    }

    async getFeed(userId: string) {
        const shares = await this.wishSharesRepository.find({
            where: { recipientId: userId },
            relations: [
                'wish',
                'wish.owner',
                'wish.shares',
                'wish.responses',
                'wish.responses.responder',
                'wish.comments',
                'wish.comments.author',
            ],
            order: { createdAt: 'DESC' },
        });

        return shares.map((share) => {
            const wish = share.wish;
            const currentResponse = wish.responses.find((response) => response.responderId === userId) ?? null;

            return {
                id: wish.id,
                title: wish.title,
                description: wish.description,
                type: wish.type,
                timeTag: wish.timeTag,
                wasEdited: wish.wasEdited,
                planCreatedAt: wish.planCreatedAt,
                updatedAt: wish.updatedAt,
                owner: {
                    id: wish.owner.id,
                    name: wish.owner.name,
                    email: wish.owner.email,
                    avatarUrl: wish.owner.avatarUrl,
                },
                comments: (wish.comments ?? []).map((comment) => ({
                    id: comment.id,
                    comment: comment.comment,
                    createdAt: comment.createdAt,
                    author: {
                        id: comment.author.id,
                        name: comment.author.name,
                        email: comment.author.email,
                        avatarUrl: comment.author.avatarUrl,
                    },
                })),
                currentResponse,
                hasResponded: !!currentResponse,
                hasUpdatesSinceResponse: !!currentResponse && wish.updatedAt > currentResponse.respondedAt,
                canEditResponse: !wish.planCreatedAt,
            };
        });
    }

    async update(wishId: string, updateWishDto: UpdateWishDto, ownerId: string) {
        const wish = await this.getWishForOwner(wishId, ownerId);
        if (wish.planCreatedAt) {
            throw new BadRequestException('Wish can no longer be edited after a plan has been created');
        }

        Object.assign(wish, {
            ...updateWishDto,
            wasEdited: true,
        });
        if (Object.prototype.hasOwnProperty.call(updateWishDto, 'description')) {
            wish.description = updateWishDto.description ?? undefined;
        }

        const savedWish = await this.wishesRepository.save(wish);
        const recipientIds = (savedWish.shares ?? []).map((share) => share.recipientId);
        const owner = await this.usersService.findById(ownerId);

        if (recipientIds.length > 0 && owner) {
            await this.notificationsService.createForUsers({
                userIds: recipientIds,
                actor: owner,
                title: 'Wish updated',
                message: `${owner.name || owner.email} updated "${savedWish.title}"`,
                type: NotificationType.WISH_UPDATED,
                link: '/wishlist',
            });
        }

        return this.getWishForOwner(savedWish.id, ownerId).then((entry) => this.serializeOwnerWish(entry));
    }

    async remove(wishId: string, ownerId: string) {
        const wish = await this.getWishForOwner(wishId, ownerId);
        if (wish.planCreatedAt) {
            throw new BadRequestException('Wish with a created plan cannot be deleted');
        }

        await this.wishesRepository.delete({ id: wishId, ownerId });
        return { success: true };
    }

    async share(wishId: string, shareWishDto: ShareWishDto, ownerId: string) {
        const wish = await this.getWishForOwner(wishId, ownerId);
        const targetUserIds = [...new Set(shareWishDto.userIds)].filter((id) => id !== ownerId);
        const existingShares = wish.shares ?? [];
        const existingRecipientIds = existingShares.map((share) => share.recipientId);
        const respondedUserIds = new Set((wish.responses ?? []).map((response) => response.responderId));

        const removedRecipientIds = existingRecipientIds.filter((recipientId) => !targetUserIds.includes(recipientId));
        if (removedRecipientIds.some((recipientId) => respondedUserIds.has(recipientId))) {
            throw new BadRequestException('Cannot unshare a wish from users who have already responded');
        }

        const targetUsers = await Promise.all(targetUserIds.map((userId) => this.usersService.findById(userId)));
        if (targetUsers.some((user) => !user)) {
            throw new NotFoundException('One or more selected users were not found');
        }

        if (removedRecipientIds.length > 0) {
            await this.wishSharesRepository.delete({
                wishId,
                recipientId: In(removedRecipientIds),
            });
        }

        const newRecipientIds = targetUserIds.filter((recipientId) => !existingRecipientIds.includes(recipientId));
        if (newRecipientIds.length > 0) {
            const shares = newRecipientIds.map((recipientId) => this.wishSharesRepository.create({
                wishId,
                recipientId,
            }));
            await this.wishSharesRepository.save(shares);

            const owner = await this.usersService.findById(ownerId);
            if (owner) {
                await this.notificationsService.createForUsers({
                    userIds: newRecipientIds,
                    actor: owner,
                    title: 'New wish shared',
                    message: `${owner.name || owner.email} shared "${wish.title}" with you`,
                    type: NotificationType.WISH_SHARED,
                    link: '/wishlist',
                });
            }
        }

        return this.getWishForOwner(wishId, ownerId).then((entry) => this.serializeOwnerWish(entry));
    }

    async respond(wishId: string, respondToWishDto: RespondToWishDto, responderId: string) {
        const wish = await this.wishesRepository.findOne({
            where: { id: wishId },
            relations: ['owner', 'shares'],
        });

        if (!wish) {
            throw new NotFoundException(`Wish with ID "${wishId}" not found`);
        }

        if (wish.ownerId === responderId) {
            throw new ForbiddenException('Wish owner cannot respond to their own wish');
        }

        const isSharedRecipient = (wish.shares ?? []).some((share) => share.recipientId === responderId);
        if (!isSharedRecipient) {
            throw new ForbiddenException('You do not have access to respond to this wish');
        }

        const existingResponse = await this.wishResponsesRepository.findOne({
            where: { wishId, responderId },
        });

        if (wish.planCreatedAt) {
            if (!existingResponse) {
                throw new BadRequestException('Cannot create a new response after the plan has been created');
            }

            existingResponse.comment = respondToWishDto.comment ?? existingResponse.comment;
            existingResponse.respondedAt = new Date();
            const savedResponse = await this.wishResponsesRepository.save(existingResponse);
            return this.notifyWishResponse(wish, savedResponse);
        }

        if (respondToWishDto.status === WishResponseStatus.CONFIRMED && wish.type !== WishType.ACTIVITY && respondToWishDto.addToPlan) {
            throw new BadRequestException('Only activity wishes can be added to a plan');
        }

        const response = existingResponse ?? this.wishResponsesRepository.create({
            wishId,
            responderId,
        });
        response.status = respondToWishDto.status;
        response.comment = respondToWishDto.comment ?? undefined;
        response.addToPlan = respondToWishDto.status === WishResponseStatus.CONFIRMED && wish.type === WishType.ACTIVITY
            ? !!respondToWishDto.addToPlan
            : false;
        response.respondedAt = new Date();

        const savedResponse = await this.wishResponsesRepository.save(response);
        return this.notifyWishResponse(wish, savedResponse);
    }

    async getResponses(wishId: string, ownerId: string) {
        const wish = await this.getWishForOwner(wishId, ownerId);
        return (wish.responses ?? []).map((response) => ({
            id: response.id,
            status: response.status,
            comment: response.comment,
            addToPlan: response.addToPlan,
            respondedAt: response.respondedAt,
            responder: {
                id: response.responder.id,
                name: response.responder.name,
                email: response.responder.email,
                avatarUrl: response.responder.avatarUrl,
            },
        }));
    }

    async addComment(wishId: string, createWishCommentDto: CreateWishCommentDto, userId: string) {
        const wish = await this.wishesRepository.findOne({
            where: { id: wishId },
            relations: ['owner', 'shares'],
        });

        if (!wish) {
            throw new NotFoundException(`Wish with ID "${wishId}" not found`);
        }

        const canAccess = wish.ownerId === userId || (wish.shares ?? []).some((share) => share.recipientId === userId);
        if (!canAccess) {
            throw new ForbiddenException('You do not have access to comment on this wish');
        }

        const comment = this.wishCommentsRepository.create({
            wishId,
            authorId: userId,
            comment: createWishCommentDto.comment.trim(),
        });
        const savedComment = await this.wishCommentsRepository.save(comment);

        const author = await this.usersService.findById(userId);
        if (author) {
            const recipientIds = new Set<string>([wish.ownerId, ...(wish.shares ?? []).map((share) => share.recipientId)]);
            recipientIds.delete(userId);

            await this.notificationsService.createForUsers({
                userIds: [...recipientIds],
                actor: author,
                title: 'New wish comment',
                message: `${author.name || author.email} commented on "${wish.title}"`,
                type: NotificationType.WISH_COMMENT,
                link: '/wishlist',
            });
        }

        return {
            id: savedComment.id,
            comment: savedComment.comment,
            createdAt: savedComment.createdAt,
        };
    }

    async createPlanFromWish(wishId: string, createPlanDto: CreatePlanFromWishDto, ownerId: string) {
        const wish = await this.getWishForOwner(wishId, ownerId);
        if (wish.type !== WishType.ACTIVITY) {
            throw new BadRequestException('Only activity wishes can be turned into plans');
        }
        if (wish.planCreatedAt) {
            throw new BadRequestException('Plan has already been created for this wish');
        }

        const participantIds = (wish.responses ?? [])
            .filter((response) => response.status === WishResponseStatus.CONFIRMED && response.addToPlan)
            .map((response) => response.responderId);

        if (participantIds.length === 0) {
            throw new BadRequestException('At least one confirmed participant must opt in to the plan');
        }

        const task = await this.tasksService.createSharedPlanFromWish({
            title: createPlanDto.title?.trim() || wish.title,
            description: createPlanDto.description?.trim() || wish.description || '',
            dueDate: createPlanDto.startDate,
            startDate: createPlanDto.startDate,
            endDate: createPlanDto.endDate ?? undefined,
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            sourceWishId: wish.id,
        }, ownerId, participantIds);

        wish.planTaskId = task.id;
        wish.planCreatedAt = new Date();
        await this.wishesRepository.save(wish);

        const owner = await this.usersService.findById(ownerId);
        if (owner) {
            await this.notificationsService.createForUsers({
                userIds: [ownerId, ...participantIds],
                actor: owner,
                title: 'Plan created from wish',
                message: `${owner.name || owner.email} created a plan for "${wish.title}"`,
                type: NotificationType.WISH_PLAN_CREATED,
                link: '/tasks',
            });
        }

        return {
            wishId: wish.id,
            planTaskId: task.id,
            participantIds,
            dueDate: task.dueDate,
        };
    }

    private async notifyWishResponse(wish: WishEntry, response: WishResponse) {
        const responder = await this.usersService.findById(response.responderId);
        if (responder) {
            await this.notificationsService.createForUsers({
                userIds: [wish.ownerId],
                actor: responder,
                title: 'Wish response received',
                message: `${responder.name || responder.email} responded to "${wish.title}"`,
                type: NotificationType.WISH_RESPONSE,
                link: '/wishlist',
            });
        }

        return {
            id: response.id,
            wishId: response.wishId,
            responderId: response.responderId,
            status: response.status,
            comment: response.comment,
            addToPlan: response.addToPlan,
            respondedAt: response.respondedAt,
        };
    }

    private async getWishForOwner(wishId: string, ownerId: string) {
        const wish = await this.wishesRepository.findOne({
            where: { id: wishId, ownerId },
            relations: ['owner', 'shares', 'shares.recipient', 'responses', 'responses.responder', 'comments', 'comments.author'],
        });

        if (!wish) {
            throw new NotFoundException(`Wish with ID "${wishId}" not found`);
        }

        return wish;
    }

    private serializeOwnerWish(wish: WishEntry) {
        const responseSummary = (wish.responses ?? []).reduce<OwnerWishSummary>((summary, response) => {
            if (response.status === WishResponseStatus.CONFIRMED) {
                summary.confirmed += 1;
            } else if (response.status === WishResponseStatus.DECLINED) {
                summary.declined += 1;
            }

            if (response.comment) {
                summary.comments += 1;
            }

            return summary;
        }, {
            confirmed: 0,
            declined: 0,
            comments: (wish.comments ?? []).length,
        });

        return {
            id: wish.id,
            title: wish.title,
            description: wish.description,
            type: wish.type,
            timeTag: wish.timeTag,
            wasEdited: wish.wasEdited,
            planTaskId: wish.planTaskId,
            planCreatedAt: wish.planCreatedAt,
            createdAt: wish.createdAt,
            updatedAt: wish.updatedAt,
            shareCount: (wish.shares ?? []).length,
            shares: (wish.shares ?? []).map((share) => ({
                id: share.id,
                recipient: {
                    id: share.recipient.id,
                    name: share.recipient.name,
                    email: share.recipient.email,
                    avatarUrl: share.recipient.avatarUrl,
                },
            })),
            responseSummary,
            responses: (wish.responses ?? []).map((response) => ({
                id: response.id,
                status: response.status,
                comment: response.comment,
                addToPlan: response.addToPlan,
                respondedAt: response.respondedAt,
                responder: {
                    id: response.responder.id,
                    name: response.responder.name,
                    email: response.responder.email,
                    avatarUrl: response.responder.avatarUrl,
                },
            })),
            comments: (wish.comments ?? []).map((comment) => ({
                id: comment.id,
                comment: comment.comment,
                createdAt: comment.createdAt,
                author: {
                    id: comment.author.id,
                    name: comment.author.name,
                    email: comment.author.email,
                    avatarUrl: comment.author.avatarUrl,
                },
            })),
        };
    }
}
