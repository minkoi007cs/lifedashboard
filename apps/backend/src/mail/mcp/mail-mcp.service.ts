import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MailService } from '../mail.service';
import type { MailMcpStatus } from '@life-dashboard/shared';

@Injectable()
export class MailMcpService {
  private readonly logger = new Logger(MailMcpService.name);

  constructor(private readonly mailService: MailService) {}

  getManifest() {
    return {
      schemaVersion: '2024-11-05',
      name: 'lifedashboard-mail-mcp',
      description: 'Model Context Protocol (MCP) Server for Smart Mail Management (Gmail & Outlook Multi-Account Copilot)',
      version: '1.0.0',
      tools: [
        {
          name: 'list_mail_accounts',
          description: 'List all connected Gmail and Outlook accounts with unread and action-required counts',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'fetch_unread_emails',
          description: 'Fetch recent unread emails with AI summary and category filters (academic, work, finance, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              accountId: { type: 'string', description: 'Optional specific account ID' },
              category: {
                type: 'string',
                enum: ['all', 'academic', 'action_required', 'work', 'finance', 'newsletter', 'promotions', 'spam'],
                description: 'Filter by category',
              },
              limit: { type: 'number', description: 'Max number of emails to return' },
            },
          },
        },
        {
          name: 'summarize_email',
          description: 'Get deep AI summary, TL;DR, and extracted actionable items for a specific email message',
          inputSchema: {
            type: 'object',
            properties: {
              messageId: { type: 'string', description: 'The unique message ID' },
            },
            required: ['messageId'],
          },
        },
        {
          name: 'classify_email',
          description: 'Classify an email content into Academic, Work, Finance, Spam, or Promotion',
          inputSchema: {
            type: 'object',
            properties: {
              subject: { type: 'string' },
              body: { type: 'string' },
              fromAddress: { type: 'string' },
            },
            required: ['subject', 'body'],
          },
        },
        {
          name: 'clean_spam',
          description: 'Auto-detect and batch clean spam, phishing, and unwanted promotional emails',
          inputSchema: {
            type: 'object',
            properties: {
              accountId: { type: 'string', description: 'Optional specific account ID' },
            },
          },
        },
        {
          name: 'convert_to_task',
          description: 'Convert an actionable email into a tracked task in the LifeDashboard workspace',
          inputSchema: {
            type: 'object',
            properties: {
              messageId: { type: 'string', description: 'The message ID to convert' },
            },
            required: ['messageId'],
          },
        },
        {
          name: 'draft_reply',
          description: 'Generate an AI context-aware reply draft for an email',
          inputSchema: {
            type: 'object',
            properties: {
              messageId: { type: 'string', description: 'The message ID to reply to' },
              tone: { type: 'string', enum: ['professional', 'quick_confirm', 'academic'] },
            },
            required: ['messageId'],
          },
        },
      ],
    };
  }

  async getStatus(userId: string): Promise<MailMcpStatus> {
    const accounts = await this.mailService.getAccounts(userId);
    const manifest = this.getManifest();

    return {
      isConnected: true,
      serverUrl: '/api/v1/mail/mcp',
      protocolVersion: manifest.schemaVersion,
      supportedTools: manifest.tools.map((t) => ({
        name: t.name,
        description: t.description,
      })),
      activeAccountsCount: accounts.length,
      lastPingAt: new Date().toISOString(),
    };
  }

  async handleToolCall(
    userId: string,
    toolName: string,
    args: Record<string, any> = {},
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    this.logger.log(`MCP Tool Call: ${toolName} for user: ${userId}`);

    try {
      let resultData: any;

      switch (toolName) {
        case 'list_mail_accounts': {
          resultData = await this.mailService.getAccounts(userId);
          break;
        }

        case 'fetch_unread_emails': {
          const messages = await this.mailService.getMessages(userId, {
            accountId: args.accountId,
            category: args.category,
          });
          const unread = messages.filter((m) => !m.isRead);
          resultData = (args.limit ? unread.slice(0, args.limit) : unread).map((m) => ({
            id: m.id,
            accountLabel: m.accountLabel,
            provider: m.provider,
            from: `${m.fromName} <${m.fromAddress}>`,
            subject: m.subject,
            aiCategory: m.aiCategory,
            aiSummary: m.aiSummary,
            actionRequired: m.aiActionRequired,
            receivedAt: m.receivedAt,
          }));
          break;
        }

        case 'summarize_email': {
          if (!args.messageId) throw new NotFoundException('messageId is required');
          const message = await this.mailService.getMessageById(args.messageId, userId);
          resultData = {
            subject: message.subject,
            from: message.fromName,
            aiCategory: message.aiCategory,
            aiSummary: message.aiSummary,
            aiActionItems: message.aiActionItems,
            aiPriority: message.aiPriority,
          };
          break;
        }

        case 'classify_email': {
          const category = this.mailService.classifyEmailContent(
            args.subject || '',
            args.body || '',
            args.fromAddress || '',
          );
          resultData = {
            category,
            isAcademic: category === 'academic',
            isSpam: category === 'spam',
            isPromotion: category === 'promotions',
          };
          break;
        }

        case 'clean_spam': {
          resultData = await this.mailService.cleanSpamAndPromotions(userId, args.accountId);
          break;
        }

        case 'convert_to_task': {
          if (!args.messageId) throw new NotFoundException('messageId is required');
          resultData = await this.mailService.convertToTask(args.messageId, userId);
          break;
        }

        case 'draft_reply': {
          if (!args.messageId) throw new NotFoundException('messageId is required');
          resultData = await this.mailService.generateReply(args.messageId, userId, args.tone);
          break;
        }

        default:
          throw new NotFoundException(`Unknown MCP Tool: ${toolName}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(resultData, null, 2),
          },
        ],
      };
    } catch (err: any) {
      this.logger.error(`MCP Tool Call failed: ${toolName}`, err.stack);
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error executing ${toolName}: ${err.message}`,
          },
        ],
      };
    }
  }
}
