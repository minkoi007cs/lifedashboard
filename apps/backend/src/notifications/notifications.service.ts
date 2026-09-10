import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { format } from 'date-fns';
import { AppNotification, NotificationType } from './notification.entity';
import { ConnectedAccount, AccountProvider } from './entities/connected-account.entity';
import { TasksService } from '../tasks/tasks.service';
import { HabitsService } from '../habits/habits.service';
import { TaskPriority, TaskStatus } from '../tasks/task.entity';
import { User } from '../users/user.entity';
import type {
  DailyDigest,
  DigestTaskItem,
  DigestHabitItem,
  DigestHighlightItem,
} from '@life-dashboard/shared';

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
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(AppNotification)
    private readonly notificationsRepository: Repository<AppNotification>,
    @InjectRepository(ConnectedAccount)
    private readonly accountsRepository: Repository<ConnectedAccount>,
    private readonly tasksService: TasksService,
    private readonly habitsService: HabitsService,
  ) {}

  async createForUsers(input: CreateNotificationInput) {
    const uniqueUserIds = [...new Set(input.userIds)];
    if (uniqueUserIds.length === 0) {
      return [];
    }

    const notifications = uniqueUserIds.map((userId) =>
      this.notificationsRepository.create({
        userId,
        actorId: input.actor?.id,
        actorName: input.actor?.name,
        actorAvatarUrl: input.actor?.avatarUrl,
        title: input.title,
        message: input.message,
        type: input.type,
        link: input.link ?? undefined,
      }),
    );

    return this.notificationsRepository.save(notifications);
  }

  async getMine(userId: string) {
    const items = await this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 30,
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
      throw new NotFoundException(
        `Notification with ID "${notificationId}" not found`,
      );
    }

    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }

  async markAllRead(userId: string) {
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return this.getMine(userId);
  }

  // ── Connected Accounts (Notification Hub) ───────────────────────────────────

  async getConnectedAccounts(userId: string) {
    return this.accountsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async connectAccount(
    userId: string,
    data: {
      provider: AccountProvider;
      emailOrUsername?: string;
      accessToken?: string;
      refreshToken?: string;
    },
  ) {
    const existing = await this.accountsRepository.findOne({
      where: { userId, provider: data.provider },
    });

    if (existing) {
      existing.emailOrUsername = data.emailOrUsername || existing.emailOrUsername;
      existing.accessToken = data.accessToken || existing.accessToken;
      existing.refreshToken = data.refreshToken || existing.refreshToken;
      existing.syncStatus = 'active';
      existing.lastSyncedAt = new Date();
      return this.accountsRepository.save(existing);
    }

    const account = this.accountsRepository.create({
      userId,
      provider: data.provider,
      emailOrUsername: data.emailOrUsername || `${data.provider}_user`,
      accessToken: data.accessToken || 'mock_token',
      refreshToken: data.refreshToken,
      syncStatus: 'active',
      lastSyncedAt: new Date(),
    });

    return this.accountsRepository.save(account);
  }

  async disconnectAccount(id: string, userId: string) {
    const account = await this.accountsRepository.findOne({
      where: { id, userId },
    });
    if (!account) {
      throw new NotFoundException(`Connected account "${id}" not found`);
    }
    await this.accountsRepository.remove(account);
    return { success: true };
  }

  async syncAccount(id: string, userId: string) {
    const account = await this.accountsRepository.findOne({
      where: { id, userId },
    });
    if (!account) {
      throw new NotFoundException(`Connected account "${id}" not found`);
    }

    const newNotifications: AppNotification[] = [];
    const now = new Date();

    if (account.provider === 'github') {
      const mockGithubEvents = [
        {
          title: 'PR Review Requested: #42 Refactor Finance Engine',
          message: 'khoihoang requested your review on pull request #42 in lifedashboard.',
          type: NotificationType.GITHUB_PR,
          link: 'https://github.com/minkoi007cs/lifedashboard/pull/42',
          actorName: 'khoihoang',
        },
        {
          title: 'Issue Assigned: #15 Support Weekly Habit Streaks',
          message: 'You were assigned to issue #15 in lifedashboard: "Support custom rest days without streak penalty".',
          type: NotificationType.GITHUB_ISSUE,
          link: 'https://github.com/minkoi007cs/lifedashboard/issues/15',
          actorName: 'github-bot',
        },
      ];

      for (const ev of mockGithubEvents) {
        const existing = await this.notificationsRepository.findOne({
          where: { userId, title: ev.title },
        });
        if (!existing) {
          const item = this.notificationsRepository.create({
            userId,
            title: ev.title,
            message: ev.message,
            type: ev.type,
            link: ev.link,
            actorName: ev.actorName,
            isRead: false,
          });
          newNotifications.push(item);
        }
      }
    } else if (account.provider === 'google') {
      const mockGoogleEvents = [
        {
          title: 'Urgent: Team Architecture Alignment',
          message: 'From: lead@company.org — "Please review the updated C4 architecture diagrams before tomorrow\'s sync."',
          type: NotificationType.EMAIL_IMPORTANT,
          link: 'https://mail.google.com',
          actorName: 'Engineering Lead',
        },
        {
          title: 'Calendar: Family Dinner & Bill Split Tonight',
          message: 'Calendar event scheduled for 7:00 PM tonight.',
          type: NotificationType.CALENDAR_REMINDER,
          link: 'https://calendar.google.com',
          actorName: 'Google Calendar',
        },
      ];

      for (const ev of mockGoogleEvents) {
        const existing = await this.notificationsRepository.findOne({
          where: { userId, title: ev.title },
        });
        if (!existing) {
          const item = this.notificationsRepository.create({
            userId,
            title: ev.title,
            message: ev.message,
            type: ev.type,
            link: ev.link,
            actorName: ev.actorName,
            isRead: false,
          });
          newNotifications.push(item);
        }
      }
    } else if (account.provider === 'microsoft') {
      const mockMicrosoftEvents = [
        {
          title: 'Outlook Priority: Contract Renewal Notice',
          message: 'High priority flag: Please review and acknowledge the terms before end of week.',
          type: NotificationType.EMAIL_IMPORTANT,
          link: 'https://outlook.office.com',
          actorName: 'Microsoft 365',
        },
      ];

      for (const ev of mockMicrosoftEvents) {
        const existing = await this.notificationsRepository.findOne({
          where: { userId, title: ev.title },
        });
        if (!existing) {
          const item = this.notificationsRepository.create({
            userId,
            title: ev.title,
            message: ev.message,
            type: ev.type,
            link: ev.link,
            actorName: ev.actorName,
            isRead: false,
          });
          newNotifications.push(item);
        }
      }
    }

    if (newNotifications.length > 0) {
      await this.notificationsRepository.save(newNotifications);
    }

    account.lastSyncedAt = now;
    account.syncStatus = 'active';
    await this.accountsRepository.save(account);

    return {
      syncedItems: 3,
      newNotifications: newNotifications.length,
      lastSyncedAt: now,
    };
  }

  // ── AI Daily Digest Generator ───────────────────────────────────────────────

  async getDailyDigest(userId: string, clientDate?: string): Promise<DailyDigest> {
    const todayStr = clientDate || format(new Date(), 'yyyy-MM-dd');
    const hour = new Date().getHours();

    let greetingTime = 'buổi sáng';
    if (hour >= 12 && hour < 18) greetingTime = 'buổi chiều';
    else if (hour >= 18) greetingTime = 'buổi tối';

    // 1. Tasks analysis
    const allTasks = await this.tasksService.findAll(userId);
    const pendingTasks = allTasks.filter((t) => t.status !== TaskStatus.DONE);
    const topPriorities: DigestTaskItem[] = pendingTasks
      .slice(0, 3)
      .map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate ? format(new Date(t.dueDate), 'yyyy-MM-dd') : undefined,
        status: t.status,
      }));

    // 2. Habits analysis
    const habits = await this.habitsService.findAll(userId);
    const activeHabits = habits.filter((h) => !h.isArchived);
    const completedTodayCount = activeHabits.filter((h) => {
      const todayLog = h.logs?.find((l) => l.date === todayStr);
      return todayLog ? todayLog.completedCount >= h.targetCount : false;
    }).length;

    const activeStreaks: DigestHabitItem[] = activeHabits
      .filter((h) => h.streak > 0)
      .slice(0, 3)
      .map((h) => {
        const todayLog = h.logs?.find((l) => l.date === todayStr);
        return {
          id: h.id,
          name: h.name,
          streak: h.streak,
          targetCount: h.targetCount,
          completedCount: todayLog ? todayLog.completedCount : 0,
          isCompleted: todayLog ? todayLog.completedCount >= h.targetCount : false,
        };
      });

    // 3. Notification Highlights
    const unread = await this.notificationsRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
      take: 3,
    });
    const notificationHighlights: DigestHighlightItem[] = unread.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      actorName: n.actorName,
      createdAt: n.createdAt.toISOString(),
    }));

    // Quotes collection
    const quotes = [
      { text: 'Chất lượng không phải là một hành động, nó là một thói quen.', author: 'Aristotle' },
      { text: 'Tập trung sâu là siêu năng lực của thế kỷ 21.', author: 'Cal Newport' },
      { text: 'Kỷ luật đưa bạn đến nơi mà động lực không thể mang lại.', author: 'Jim Rohn' },
      { text: 'Làm những việc nhỏ với sự kiên trì phi thường.', author: 'James Clear' },
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    // AI Focus Recommendation
    let focusRecommendation = 'Hôm nay hãy dành 1 phiên Pomodoro 25 phút để dọn dẹp các ghi chú và lên kế hoạch.';
    if (topPriorities.length > 0) {
      focusRecommendation = `Khuyến nghị tập trung: Dành ít nhất 45 phút Deep Work hoàn thành nhiệm vụ ưu tiên: "${topPriorities[0].title}".`;
    } else if (activeHabits.length > 0 && completedTodayCount < activeHabits.length) {
      focusRecommendation = `Tất cả nhiệm vụ đã xong! Hãy tập trung duy trì chuỗi Streak cho thói quen: "${activeHabits[0].name}".`;
    }

    return {
      date: todayStr,
      greeting: `Chào ${greetingTime}! Chúc bạn một ngày làm việc hiệu quả và tràn đầy năng lượng.`,
      quote,
      taskSummary: {
        totalPending: pendingTasks.length,
        topPriorities,
      },
      habitSummary: {
        dueTodayCount: activeHabits.length,
        completedTodayCount,
        activeStreaks,
      },
      notificationHighlights,
      focusRecommendation,
    };
  }

  // ── 1-Click Convert Notification to Task ─────────────────────────────────────

  async convertToTask(
    notificationId: string,
    userId: string,
    overrides?: {
      title?: string;
      priority?: TaskPriority;
      dueDate?: string;
    },
  ) {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundException(`Notification "${notificationId}" not found`);
    }

    const dueDate = overrides?.dueDate ? new Date(overrides.dueDate) : new Date();
    const priority = overrides?.priority || TaskPriority.MEDIUM;
    const taskTitle = overrides?.title || notification.title;

    const task = await this.tasksService.create(
      {
        title: taskTitle,
        description: `Nguồn: ${notification.message}${notification.link ? `\nLink: ${notification.link}` : ''}`,
        priority,
        status: TaskStatus.TODO,
        dueDate,
      },
      userId,
    );

    notification.isRead = true;
    await this.notificationsRepository.save(notification);

    return task;
  }
}
