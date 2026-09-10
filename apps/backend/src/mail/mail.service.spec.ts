import { Repository } from 'typeorm';
import { MailService } from './mail.service';
import { MailAccount } from './entities/mail-account.entity';
import { MailMessage } from './entities/mail-message.entity';
import { TasksService } from '../tasks/tasks.service';
import { FinanceService } from '../finance/finance.service';

type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('MailService', () => {
  let mailService: MailService;
  let accountRepo: MockRepository<MailAccount>;
  let messageRepo: MockRepository<MailMessage>;
  let tasksService: Partial<TasksService>;
  let financeService: Partial<FinanceService>;

  beforeEach(() => {
    accountRepo = {
      count: jest.fn().mockResolvedValue(1),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'acc-1', ...entity })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    messageRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'msg-1', ...entity })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    tasksService = {
      create: jest.fn().mockResolvedValue({ id: 'task-1', title: 'Test Task' }),
    };

    financeService = {
      getWallets: jest.fn().mockResolvedValue([{ id: 'wallet-1', name: 'Main' }]),
      createTransaction: jest.fn().mockResolvedValue({ id: 'tx-1', amount: 150 }),
    };

    mailService = new MailService(
      accountRepo as Repository<MailAccount>,
      messageRepo as Repository<MailMessage>,
      tasksService as TasksService,
      financeService as FinanceService,
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

  it('should generate an AI reply draft', async () => {
    const mockEmail = {
      id: 'msg-102',
      userId: 'user-1',
      subject: 'Q3 Product Roadmap Review',
      fromName: 'Sarah Lin',
      category: 'ACTION_REQUIRED',
    };
    (messageRepo.findOne as jest.Mock).mockResolvedValue(mockEmail);

    const result = await mailService.generateReply('msg-102', 'user-1');

    expect(result.draftReply).toContain('Sarah Lin');
    expect(messageRepo.save).toHaveBeenCalled();
  });
});
