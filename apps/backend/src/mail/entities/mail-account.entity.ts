import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/user.entity';
import { MailMessage } from './mail-message.entity';

@Entity('mail_accounts')
export class MailAccount extends BaseEntity {
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ default: 'gmail' })
  provider: 'gmail' | 'outlook';

  @Column()
  email: string;

  @Column({ default: 'Hộp thư' })
  label: string;

  @Column({ default: '#ef4444' })
  color: string;

  @Column({ name: 'access_token', type: 'text', nullable: true })
  accessToken?: string;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken?: string;

  @Column({ name: 'sync_status', default: 'active' })
  syncStatus: string;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt?: Date;

  @OneToMany(() => MailMessage, (msg) => msg.account, { cascade: true })
  messages: MailMessage[];
}
