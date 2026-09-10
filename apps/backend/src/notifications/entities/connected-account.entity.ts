import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/user.entity';

export type AccountProvider = 'google' | 'microsoft' | 'github';

@Entity('connected_accounts')
export class ConnectedAccount extends BaseEntity {
  @Column()
  provider: AccountProvider;

  @Column({ name: 'email_or_username', nullable: true })
  emailOrUsername: string;

  @Column({ name: 'access_token', type: 'text', nullable: true })
  accessToken: string;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken: string;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @Column({ name: 'sync_status', default: 'active' })
  syncStatus: string;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;
}
