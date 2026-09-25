import { MailMcpService } from './mail-mcp.service';
import { MailService } from '../mail.service';

describe('MailMcpService', () => {
  let mcpService: MailMcpService;
  let mailService: Partial<MailService>;

  beforeEach(() => {
    mailService = {
      getAccounts: jest.fn().mockResolvedValue([
        { id: 'acc-1', email: 'test@outlook.com', label: 'Outlook Work', unreadCount: 2 },
      ]),
      getMessages: jest.fn().mockResolvedValue([
        {
          id: 'msg-1',
          accountLabel: 'Outlook Work',
          provider: 'outlook' as any,
          fromName: 'Prof. John',
          fromAddress: 'john@edu.com',
          subject: 'Thesis defense date',
          aiCategory: 'academic' as any,
          aiSummary: 'Defense on 25th',
          aiActionRequired: true,
          isRead: false,
          receivedAt: new Date().toISOString(),
        },
      ]),
      getMessageById: jest.fn().mockResolvedValue({
        id: 'msg-1',
        subject: 'Thesis defense date',
        fromName: 'Prof. John',
        aiCategory: 'academic' as any,
        aiSummary: 'Defense on 25th',
        aiActionItems: ['Submit slides'],
        aiPriority: 'urgent' as any,
      }),
      classifyEmailContent: jest.fn().mockReturnValue('academic'),
      cleanSpamAndPromotions: jest.fn().mockResolvedValue({ deletedCount: 5 }),
      convertToTask: jest.fn().mockResolvedValue({ success: true }),
      generateReply: jest.fn().mockResolvedValue({ draftReply: 'Kính gửi Thầy' }),
    };

    mcpService = new MailMcpService(mailService as MailService);
  });

  it('should return valid MCP manifest with all mail tools', () => {
    const manifest = mcpService.getManifest();

    expect(manifest.name).toBe('lifedashboard-mail-mcp');
    expect(manifest.schemaVersion).toBe('2024-11-05');
    const toolNames = manifest.tools.map((t) => t.name);
    expect(toolNames).toContain('list_mail_accounts');
    expect(toolNames).toContain('fetch_unread_emails');
    expect(toolNames).toContain('summarize_email');
    expect(toolNames).toContain('classify_email');
    expect(toolNames).toContain('clean_spam');
    expect(toolNames).toContain('convert_to_task');
  });

  it('should return server status', async () => {
    const status = await mcpService.getStatus('user-1');

    expect(status.isConnected).toBe(true);
    expect(status.serverUrl).toBe('/api/v1/mail/mcp');
    expect(status.activeAccountsCount).toBe(1);
    expect(status.supportedTools.length).toBeGreaterThan(0);
  });

  it('should handle tool call fetch_unread_emails correctly', async () => {
    const response = await mcpService.handleToolCall('user-1', 'fetch_unread_emails', {
      category: 'academic',
    });

    expect(response.isError).toBeFalsy();
    expect(response.content[0].type).toBe('text');
    const data = JSON.parse(response.content[0].text);
    expect(data.length).toBe(1);
    expect(data[0].subject).toBe('Thesis defense date');
  });

  it('should handle tool call classify_email correctly', async () => {
    const response = await mcpService.handleToolCall('user-1', 'classify_email', {
      subject: 'Đồ án tốt nghiệp',
      body: 'Nộp báo cáo',
      fromAddress: 'nam@hust.edu.vn',
    });

    expect(response.isError).toBeFalsy();
    const data = JSON.parse(response.content[0].text);
    expect(data.isAcademic).toBe(true);
    expect(data.category).toBe('academic');
  });

  it('should handle tool call clean_spam correctly', async () => {
    const response = await mcpService.handleToolCall('user-1', 'clean_spam', {});

    expect(response.isError).toBeFalsy();
    const data = JSON.parse(response.content[0].text);
    expect(data.deletedCount).toBe(5);
  });
});
