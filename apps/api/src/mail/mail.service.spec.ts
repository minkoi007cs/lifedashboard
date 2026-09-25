import { Repository } from 'typeorm';
import { MailService } from './mail.service';
import { MailAccount } from './entities/mail-account.entity';
import { MailMessage } from './entities/mail-message.entity';
import { TasksService } from '../tasks/tasks.service';
import { FinanceService } from '../finance/finance.service';
import { NotificationsService } from '../notifications/notifications.service';

type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('MailService', () => {
  let mailService: MailService;
  let accountRepo: MockRepository<MailAccount>;
  let messageRepo: MockRepository<MailMessage>;
  let tasksService: Partial<TasksService>;
  let financeService: Partial<FinanceService>;
  let notificationsService: Partial<NotificationsService>;

  beforeEach(() => {
    accountRepo = {
      count: jest.fn().mockResolvedValue(1),
      find: jest.fn().mockResolvedValue([{ id: 'acc-1', provider: 'outlook', label: 'Outlook' }]),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'acc-1', ...entity })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    messageRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'msg-1', ...entity })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 3 }),
      }),
    };

    tasksService = {
      create: jest.fn().mockResolvedValue({ id: 'task-1', title: 'Test Task' }),
    };

    financeService = {
      getWallets: jest.fn().mockResolvedValue([{ id: 'wallet-1', name: 'Main' }]),
      createTransaction: jest.fn().mockResolvedValue({ id: 'tx-1', amount: 150 }),
    };

    notificationsService = {
      createForUsers: jest.fn().mockResolvedValue([]),
    };

    mailService = new MailService(
      accountRepo as Repository<MailAccount>,
      messageRepo as Repository<MailMessage>,
      tasksService as TasksService,
      financeService as FinanceService,
      notificationsService as NotificationsService,
    );
  });

  it('should create an account and seed initial messages', async () => {
    const created = await mailService.createAccount('user-1', {
      provider: 'gmail',
      email: 'work@example.com',
      label: 'Work Gmail',
    });

    expect(accountRepo.save).toHaveBeenCalled();
    expect(messageRepo.save).toHaveBeenCalled();
    expect(created.email).toBe('work@example.com');
  });

  it('should batch create multiple accounts from wizard', async () => {
    const accounts = await mailService.batchCreateAccounts('user-1', [
      { provider: 'gmail', email: 'personal@gmail.com', label: 'Gmail Cá nhân' },
      { provider: 'outlook', email: 'student@hust.edu.vn', label: 'Outlook ĐH' },
    ]);

    expect(accounts.length).toBe(2);
    expect(accountRepo.save).toHaveBeenCalledTimes(2);
  });

  it('should correctly classify academic, spam, and promotional content', () => {
    const academicCat = mailService.classifyEmailContent(
      'Nhắc nhở nộp đề cương đồ án tốt nghiệp',
      'Hạn chót ngày 25/09 cho sinh viên bảo vệ',
      'nam.dang@hust.edu.vn',
    );
    expect(academicCat).toBe('academic');

    const spamCat = mailService.classifyEmailContent(
      'Chúc mừng bạn trúng thưởng 50 triệu casino',
      'Nhận quà miễn phí ngay trong ngày',
      'scam@lucky.xyz',
    );
    expect(spamCat).toBe('spam');

    const promoCat = mailService.classifyEmailContent(
      'Flash sale 40% khóa học lập trình web',
      'Áp dụng voucher giảm giá ngay',
      'marketing@shop.com',
    );
    expect(promoCat).toBe('promotions');
  });

  it('should receive incoming email, summarize with AI, and trigger notification', async () => {
    const incoming = await mailService.receiveIncomingEmail('user-1', {
      fromName: 'GS. Nam',
      fromAddress: 'nam.dang@hust.edu.vn',
      subject: 'Lịch bảo vệ đồ án kỳ 1',
      bodyText: 'Hạn chót bảo vệ và nộp đề cương là tuần tới.',
    });

    expect(messageRepo.save).toHaveBeenCalled();
    expect(notificationsService.createForUsers).toHaveBeenCalled();
    expect(incoming.aiCategory).toBe('academic');
    expect(incoming.aiSummary).toContain('GS. Nam');
  });

  it('should clean spam and promotions with 1-click', async () => {
    const res = await mailService.cleanSpamAndPromotions('user-1');
    expect(res.deletedCount).toBe(3);
  });

  it('should convert an email to a task successfully', async () => {
    const mockEmail = {
      id: 'msg-100',
      userId: 'user-1',
      subject: 'Review Contract Q3',
      body: 'Please review before tomorrow.',
      fromName: 'Sarah Lin',
      fromAddress: 'sarah@example.com',
      aiSummary: 'Contract review deadline tomorrow',
      aiActionItems: ['Review agreement and sign'],
      aiPriority: 'urgent',
      account: { label: 'Work Gmail' },
      receivedAt: new Date(),
    };
    (messageRepo.findOne as jest.Mock).mockResolvedValue(mockEmail);

    const result = await mailService.convertToTask('msg-100', 'user-1');

    expect(tasksService.create).toHaveBeenCalled();
    expect(messageRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedTaskId: 'task-1',
      }),
    );
    expect(result.task).toBeDefined();
    expect(result.message.linkedTaskId).toBe('task-1');
  });

  it('should convert an invoice email to a finance expense', async () => {
    const mockEmail = {
      id: 'msg-101',
      userId: 'user-1',
      subject: 'AWS Cloud Invoice',
      fromName: 'Amazon Web Services',
      fromAddress: 'no-reply@amazon.com',
      extractedAmount: 150,
      account: { label: 'Work Gmail' },
      receivedAt: new Date(),
    };
    (messageRepo.findOne as jest.Mock).mockResolvedValue(mockEmail);

    const result = await mailService.convertToExpense('msg-101', 'user-1');

    expect(financeService.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 150,
        type: 'expense',
      }),
      'user-1',
    );
    expect(messageRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedTransactionId: 'tx-1',
      }),
    );
    expect(result.transaction).toBeDefined();
    expect(result.message.linkedTransactionId).toBe('tx-1');
  });

  it('should generate an AI reply draft with academic tone', async () => {
    const mockEmail = {
      id: 'msg-102',
      userId: 'user-1',
      subject: 'Thông báo đề cương đồ án',
      fromName: 'GS. Đặng Văn Nam',
      category: 'academic',
    };
    (messageRepo.findOne as jest.Mock).mockResolvedValue(mockEmail);

    const result = await mailService.generateReply('msg-102', 'user-1', 'academic');

    expect(result.draftReply).toContain('Thầy/Cô');
    expect(result.draftReply).toContain('GS. Đặng Văn Nam');
    expect(messageRepo.save).toHaveBeenCalled();
  });
});
