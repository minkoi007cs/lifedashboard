import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { MailAccount } from './mail-account.entity';

@Entity('mail_messages')
export class MailMessage extends BaseEntity {
  @Column()
  accountId: string;

  @ManyToOne(() => MailAccount, (acc) => acc.messages, { onDelete: 'CASCADE' })
  account: MailAccount;

  @Column()
  userId: string;

  @Column()
  fromName: string;

  @Column()
  fromAddress: string;

  @Column()
  toAddress: string;

  @Column()
  subject: string;

  @Column({ type: 'text', nullable: true })
  snippet: string;

  @Column({ type: 'text' })
  bodyText: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  receivedAt: Date;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isStarred: boolean;

  @Column({ default: 'work' })
  aiCategory: string;

  @Column({ default: 'normal' })
  aiPriority: string;

  @Column({ type: 'text', nullable: true })
  aiSummary: string;

  @Column({ default: false })
  aiActionRequired: boolean;

  @Column({ type: 'simple-array', nullable: true })
  aiActionItems: string[];

  @Column({ type: 'text', nullable: true })
  aiDraftReply?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  extractedAmount?: number;

  @Column({ nullable: true })
  linkedTaskId?: string;

  @Column({ nullable: true })
  linkedTransactionId?: string;
}
