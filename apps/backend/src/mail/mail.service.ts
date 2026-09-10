import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailAccount } from './entities/mail-account.entity';
import { MailMessage } from './entities/mail-message.entity';
import { TasksService } from '../tasks/tasks.service';
import { FinanceService } from '../finance/finance.service';
import { TaskPriority, TaskStatus } from '../tasks/task.entity';
import type {
  CreateMailAccountDto,
  MailOverview,
  MailMessage as SharedMailMessage,
  MailAccount as SharedMailAccount,
} from '@life-dashboard/shared';
import { format } from 'date-fns';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @InjectRepository(MailAccount)
    private readonly accountRepo: Repository<MailAccount>,
    @InjectRepository(MailMessage)
    private readonly messageRepo: Repository<MailMessage>,
    private readonly tasksService: TasksService,
    private readonly financeService: FinanceService,
  ) {}

  async getAccounts(userId: string): Promise<SharedMailAccount[]> {
    const accounts = await this.accountRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
      relations: ['messages'],
    });

    return accounts.map((acc) => {
      const messages = acc.messages || [];
      const unreadCount = messages.filter((m) => !m.isRead).length;
      const actionRequiredCount = messages.filter((m) => m.aiActionRequired && !m.isRead).length;

      return {
        id: acc.id,
        provider: acc.provider,
        email: acc.email,
        label: acc.label,
        color: acc.color,
        syncStatus: acc.syncStatus as any,
        lastSyncedAt: acc.lastSyncedAt ? acc.lastSyncedAt.toISOString() : undefined,
        unreadCount,
        actionRequiredCount,
        createdAt: acc.createdAt.toISOString(),
      };
    });
  }

  async createAccount(userId: string, dto: CreateMailAccountDto): Promise<MailAccount> {
    const defaultColor = dto.provider === 'gmail' ? '#ea4335' : '#0078d4';
    const defaultLabel = dto.provider === 'gmail' ? 'Gmail' : 'Outlook';

    const account = this.accountRepo.create({
      userId,
      provider: dto.provider,
      email: dto.email,
      label: dto.label || defaultLabel,
      color: dto.color || defaultColor,
      accessToken: dto.accessToken || 'mock_token',
      syncStatus: 'active',
      lastSyncedAt: new Date(),
    });

    const saved = await this.accountRepo.save(account);

    // Automatically populate starter emails with realistic AI summaries & actions
    await this.seedAccountMessages(saved);

    return saved;
  }

  async deleteAccount(id: string, userId: string): Promise<{ success: boolean }> {
    const account = await this.accountRepo.findOne({ where: { id, userId } });
    if (!account) throw new NotFoundException('Mail account not found');
    await this.accountRepo.remove(account);
    return { success: true };
  }

  async syncAccount(id: string, userId: string): Promise<{ syncedCount: number; lastSyncedAt: Date }> {
    const account = await this.accountRepo.findOne({ where: { id, userId } });
    if (!account) throw new NotFoundException('Mail account not found');

    account.lastSyncedAt = new Date();
    account.syncStatus = 'active';
    await this.accountRepo.save(account);

    return {
      syncedCount: 3,
      lastSyncedAt: account.lastSyncedAt,
    };
  }

  async syncAll(userId: string): Promise<{ accountsSynced: number }> {
    const accounts = await this.accountRepo.find({ where: { userId } });
    const now = new Date();
    for (const acc of accounts) {
      acc.lastSyncedAt = now;
      acc.syncStatus = 'active';
      await this.accountRepo.save(acc);
    }
    return { accountsSynced: accounts.length };
  }

  async getMessages(
    userId: string,
    filters?: { accountId?: string; category?: string; search?: string },
  ): Promise<SharedMailMessage[]> {
    // If user has zero accounts, seed 2 default accounts (Gmail Work + Outlook Personal)
    const count = await this.accountRepo.count({ where: { userId } });
    if (count === 0) {
      await this.createAccount(userId, {
        provider: 'gmail',
        email: 'khoi.work@gmail.com',
        label: 'Gmail Công việc',
        color: '#ea4335',
      });
      await this.createAccount(userId, {
        provider: 'outlook',
        email: 'khoi.personal@outlook.com',
        label: 'Outlook Cá nhân',
        color: '#0078d4',
      });
    }

    const qb = this.messageRepo
      .createQueryBuilder('msg')
      .innerJoinAndSelect('msg.account', 'acc')
      .where('msg.userId = :userId', { userId })
      .orderBy('msg.receivedAt', 'DESC');

    if (filters?.accountId && filters.accountId !== 'all') {
      qb.andWhere('msg.accountId = :accountId', { accountId: filters.accountId });
    }

    if (filters?.category && filters.category !== 'all') {
      if (filters.category === 'action_required') {
        qb.andWhere('msg.aiActionRequired = true');
      } else {
        qb.andWhere('msg.aiCategory = :category', { category: filters.category });
      }
    }

    if (filters?.search) {
      qb.andWhere(
        '(LOWER(msg.subject) LIKE :search OR LOWER(msg.fromName) LIKE :search OR LOWER(msg.snippet) LIKE :search)',
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }

    const messages = await qb.getMany();

    return messages.map((m) => this.mapToShared(m));
  }

  async getMessage(id: string, userId: string): Promise<SharedMailMessage> {
    const message = await this.messageRepo.findOne({
      where: { id, userId },
      relations: ['account'],
    });
    if (!message) throw new NotFoundException('Message not found');

    if (!message.isRead) {
      message.isRead = true;
      await this.messageRepo.save(message);
    }

    return this.mapToShared(message);
  }

  async toggleStarred(id: string, userId: string): Promise<SharedMailMessage> {
    const message = await this.messageRepo.findOne({
      where: { id, userId },
      relations: ['account'],
    });
    if (!message) throw new NotFoundException('Message not found');

    message.isStarred = !message.isStarred;
    const saved = await this.messageRepo.save(message);
    return this.mapToShared(saved);
  }

  async convertToTask(id: string, userId: string): Promise<{ task: any; message: SharedMailMessage }> {
    const message = await this.messageRepo.findOne({
      where: { id, userId },
      relations: ['account'],
    });
    if (!message) throw new NotFoundException('Message not found');

    const actionText = (message.aiActionItems || []).join('\n- ');
    const description = `Nguồn từ Email [${message.account.label}]: ${message.fromName} <${message.fromAddress}>\n\n**Tóm tắt AI:**\n${message.aiSummary}\n\n**Việc cần làm:**\n- ${actionText || message.subject}`;

    const priority =
      message.aiPriority === 'urgent'
        ? TaskPriority.HIGH
        : message.aiPriority === 'high'
        ? TaskPriority.HIGH
        : TaskPriority.MEDIUM;

    const task = await this.tasksService.create(
      {
        title: message.subject,
        description,
        priority,
        status: TaskStatus.TODO,
        dueDate: new Date(),
      },
      userId,
    );

    message.linkedTaskId = task.id;
    await this.messageRepo.save(message);

    return {
      task,
      message: this.mapToShared(message),
    };
  }

  async convertToExpense(
    id: string,
    userId: string,
    walletId?: string,
  ): Promise<{ transaction: any; message: SharedMailMessage }> {
    const message = await this.messageRepo.findOne({
      where: { id, userId },
      relations: ['account'],
    });
    if (!message) throw new NotFoundException('Message not found');

    const amount = Number(message.extractedAmount) || 49.99;
    const note = `Hóa đơn từ Email: ${message.subject} (${message.fromName})`;

    // Get or fallback to active wallet
    let targetWalletId = walletId;
    if (!targetWalletId) {
      const wallets = await this.financeService.getWallets(userId);
      if (wallets.length > 0) {
        targetWalletId = wallets[0].id;
      }
    }

    const tx = await this.financeService.createTransaction(
      {
        walletId: targetWalletId,
        amount,
        type: 'expense',
        note,
        date: format(message.receivedAt || new Date(), 'yyyy-MM-dd'),
        isFamilyShared: false,
      },
      userId,
    );

    message.linkedTransactionId = tx.id;
    await this.messageRepo.save(message);

    return {
      transaction: tx,
      message: this.mapToShared(message),
    };
  }

  async generateReply(
    id: string,
    userId: string,
    tone: string = 'professional',
  ): Promise<{ draftReply: string }> {
    const message = await this.messageRepo.findOne({ where: { id, userId } });
    if (!message) throw new NotFoundException('Message not found');

    let reply = `Chào ${message.fromName},\n\nCảm ơn bạn đã gửi thông tin về "${message.subject}". Tôi đã nhận được email và sẽ xem xét chi tiết trong hôm nay để phản hồi bạn sớm nhất.\n\nTrân trọng,\nKhoi Hoang`;

    if (tone === 'quick_confirm') {
      reply = `Chào ${message.fromName},\n\nTôi xác nhận đồng ý với kế hoạch. Tôi đã thêm các đầu việc vào hệ thống LifeOS để tiến hành triển khai.\n\nCảm ơn bạn!`;
    }

    message.aiDraftReply = reply;
    await this.messageRepo.save(message);

    return { draftReply: reply };
  }

  async getMailOverview(userId: string): Promise<MailOverview> {
    const accounts = await this.getAccounts(userId);
    const messages = await this.messageRepo.find({ where: { userId } });

    const totalUnread = messages.filter((m) => !m.isRead).length;
    const totalActionRequired = messages.filter((m) => m.aiActionRequired && !m.isRead).length;
    const totalFinanceBills = messages.filter((m) => m.aiCategory === 'finance').length;

    return {
      totalAccounts: accounts.length,
      totalUnread,
      totalActionRequired,
      totalFinanceBills,
      accounts,
    };
  }

  private mapToShared(m: MailMessage): SharedMailMessage {
    return {
      id: m.id,
      accountId: m.accountId,
      accountEmail: m.account?.email || '',
      accountLabel: m.account?.label || 'Mail',
      accountColor: m.account?.color || '#3b82f6',
      provider: (m.account?.provider as any) || 'gmail',
      fromName: m.fromName,
      fromAddress: m.fromAddress,
      toAddress: m.toAddress,
      subject: m.subject,
      snippet: m.snippet,
      bodyText: m.bodyText,
      receivedAt: m.receivedAt.toISOString(),
      isRead: m.isRead,
      isStarred: m.isStarred,
      aiCategory: m.aiCategory as any,
      aiPriority: m.aiPriority as any,
      aiSummary: m.aiSummary,
      aiActionRequired: m.aiActionRequired,
      aiActionItems: m.aiActionItems || [],
      aiDraftReply: m.aiDraftReply,
      extractedAmount: m.extractedAmount ? Number(m.extractedAmount) : undefined,
      linkedTaskId: m.linkedTaskId,
      linkedTransactionId: m.linkedTransactionId,
    };
  }

  private async seedAccountMessages(account: MailAccount) {
    const now = new Date();

    if (account.provider === 'gmail') {
      const msgs = [
        {
          accountId: account.id,
          userId: account.userId,
          fromName: 'Sarah Jenkins (Tech Lead)',
          fromAddress: 'sarah.j@techcorp.io',
          toAddress: account.email,
          subject: 'Khẩn: Chốt Kiến trúc C4 & Sơ đồ luồng AI trước 15:00 hôm nay',
          snippet: 'Chào Khôi, team cần bạn rà soát lại diagram C4 và luồng tool-use confirmation...',
          bodyText: `Chào Khôi,\n\nTeam backend và frontend đang chuẩn bị release version 2.0. Chúng tôi cần bạn xác nhận lại 2 điểm quan trọng trước 15:00 chiều nay:\n1. Kiểm tra sơ đồ C4 và thứ tự các bảng database đã chuẩn hóa camelCase chưa.\n2. Xác nhận thời gian phản hồi của Claude 3.7 Sonnet trong luồng tool-use có đạt dưới 2.5s không.\n\nVui lòng phản hồi sớm để kịp giờ họp sprint review nhé!\n\nThân mến,\nSarah Jenkins.`,
          receivedAt: new Date(now.getTime() - 25 * 60 * 1000),
          isRead: false,
          isStarred: true,
          aiCategory: 'action_required',
          aiPriority: 'urgent',
          aiSummary: 'Sarah yêu cầu bạn review sơ đồ C4 và xác nhận latency Claude Sonnet trước 15:00 chiều nay để chuẩn bị họp sprint review.',
          aiActionRequired: true,
          aiActionItems: [
            'Rà soát sơ đồ C4 trong tech.md trước 15:00',
            'Kiểm tra latency API Claude Sonnet dưới 2.5s',
            'Gửi email phản hồi xác nhận cho Sarah',
          ],
          aiDraftReply: `Chào Sarah,\n\nTôi đã kiểm tra kỹ lưỡng sơ đồ C4 và tài liệu tech.md. Luồng tool-use và thời gian phản hồi đang chạy rất ổn định (~1.8s). Mọi thứ đã sẵn sàng cho buổi sprint review 15:00 nhé.\n\nThân ái,\nKhôi`,
        },
        {
          accountId: account.id,
          userId: account.userId,
          fromName: 'Cloud Billing Team',
          fromAddress: 'no-reply@cloudservices.com',
          toAddress: account.email,
          subject: 'Hóa đơn dịch vụ đám mây tháng 9: $49.00 đã thanh toán thành công',
          snippet: 'Cảm ơn bạn đã sử dụng dịch vụ. Hóa đơn số INV-2026-9042 trị giá $49.00 đã được thanh toán qua thẻ tín dụng...',
          bodyText: `Kính gửi quý khách,\n\nDịch vụ Cloud Hosting & AI Inference tháng 9/2026 đã được thanh toán tự động.\n- Mã hóa đơn: INV-2026-9042\n- Tổng số tiền: $49.00 USD\n- Phương thức: Visa kết thúc bằng 4242\n- Trạng thái: Đã thanh toán thành công\n\nBạn có thể tải file PDF đính kèm để lưu hồ sơ thuế.`,
          receivedAt: new Date(now.getTime() - 2 * 3600 * 1000),
          isRead: false,
          isStarred: false,
          aiCategory: 'finance',
          aiPriority: 'normal',
          aiSummary: 'Hóa đơn dịch vụ Cloud Hosting & AI tháng 9 trị giá $49.00 đã thanh toán tự động thành công qua Visa *4242.',
          aiActionRequired: false,
          aiActionItems: ['Lưu chi phí $49.00 vào báo cáo tài chính hàng tháng'],
          extractedAmount: 49.0,
        },
        {
          accountId: account.id,
          userId: account.userId,
          fromName: 'Hacker Newsletter',
          fromAddress: 'digest@hackernewsletter.xyz',
          toAddress: account.email,
          subject: 'Weekly Tech Digest: Sự trỗi dậy của Personal LifeOS và AI Agent tự hành',
          snippet: 'Bản tin tuần này: Khảo sát xu hướng xây dựng hệ điều hành cuộc sống cá nhân, tối ưu prompt caching và NextJS vs NestJS...',
          bodyText: `Chào bạn,\n\nTuần này trong thế giới công nghệ:\n1. Personal LifeOS đang trở thành trào lưu mới của các kỹ sư: tích hợp tài chính, calo, thói quen và deep work.\n2. Prompt caching giúp cắt giảm 90% chi phí gọi LLM trong các ứng dụng AI tương tác dài.\n3. Thiết kế Kanban Board hiện đại với React 19 và TailwindCSS.`,
          receivedAt: new Date(now.getTime() - 14 * 3600 * 1000),
          isRead: true,
          isStarred: false,
          aiCategory: 'newsletter',
          aiPriority: 'low',
          aiSummary: 'Bản tin tổng hợp tuần: Xu hướng Personal LifeOS kết hợp AI Agent, kỹ thuật prompt caching tiết kiệm 90% chi phí LLM.',
          aiActionRequired: false,
          aiActionItems: [],
        },
      ];

      for (const m of msgs) {
        await this.messageRepo.save(this.messageRepo.create(m));
      }
    } else {
      const msgs = [
        {
          accountId: account.id,
          userId: account.userId,
          fromName: 'Luật sư Trần Văn Bảo',
          fromAddress: 'bao.tran@luatviet.vn',
          toAddress: account.email,
          subject: 'Hợp đồng chuyển nhượng nhà đất: Cần ký xác nhận phụ lục số 2',
          snippet: 'Kính gửi anh Khôi, tôi gửi kèm phụ lục số 2 điều chỉnh thời hạn thanh toán đợt 3...',
          bodyText: `Kính gửi anh Khôi,\n\nTheo trao đổi hôm qua giữa các bên, văn phòng luật sư đã soạn thảo lại Phụ lục 02 về tiến độ thanh toán và nghĩa vụ thuế.\n\nĐề nghị anh xem xét các điều khoản tại trang 3 và ký số (hoặc scan ký tay) gửi lại trước ngày 12/09 để kịp công chứng.\n\nTrân trọng,\nLuật sư Trần Văn Bảo.`,
          receivedAt: new Date(now.getTime() - 4 * 3600 * 1000),
          isRead: false,
          isStarred: true,
          aiCategory: 'action_required',
          aiPriority: 'urgent',
          aiSummary: 'Luật sư gửi Phụ lục số 2 hợp đồng nhà đất, yêu cầu đọc kỹ trang 3 và ký xác nhận gửi lại trước ngày 12/09 để công chứng.',
          aiActionRequired: true,
          aiActionItems: [
            'Đọc điều khoản thanh toán tại trang 3 phụ lục',
            'Ký xác nhận và gửi lại trước ngày 12/09',
          ],
          aiDraftReply: `Kính gửi Luật sư Bảo,\n\nTôi đã xem qua phụ lục 02. Các điều khoản điều chỉnh hoàn toàn phù hợp. Tôi sẽ in, ký và gửi bản scan cho luật sư trong ngày mai.\n\nTrân trọng,\nKhôi Hoang`,
        },
        {
          accountId: account.id,
          userId: account.userId,
          fromName: 'Điện lực EVN',
          fromAddress: 'cskh@evn.com.vn',
          toAddress: account.email,
          subject: 'Thông báo tiền điện kỳ 08/2026: 1,420,000 VNĐ (~$58.00)',
          snippet: 'EVN thông báo tiền điện tháng 8 của mã khách hàng PE020019231 là 1,420,000 VNĐ, hạn nộp ngày 15/09...',
          bodyText: `Kính gửi quý khách,\n\nTiền điện tháng 08/2026 của quý khách như sau:\n- Mã KH: PE020019231\n- Sản lượng: 412 kWh\n- Tổng tiền: 1,420,000 VNĐ (~$58.00 USD)\n- Hạn thanh toán: 15/09/2026\n\nQuý khách vui lòng thanh toán đúng hạn qua ví điện tử hoặc trích nợ tự động.`,
          receivedAt: new Date(now.getTime() - 8 * 3600 * 1000),
          isRead: false,
          isStarred: false,
          aiCategory: 'finance',
          aiPriority: 'high',
          aiSummary: 'Hóa đơn tiền điện tháng 8 là 1,420,000 VNĐ (~$58.00), hạn nộp đến 15/09/2026.',
          aiActionRequired: true,
          aiActionItems: ['Thanh toán 1,420,000đ tiền điện EVN trước ngày 15/09'],
          extractedAmount: 58.0,
        },
      ];

      for (const m of msgs) {
        await this.messageRepo.save(this.messageRepo.create(m));
      }
    }
  }
}
