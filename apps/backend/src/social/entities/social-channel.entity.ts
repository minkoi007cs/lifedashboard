import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/user.entity';

@Entity('social_channels')
export class SocialChannel extends BaseEntity {
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  platform: string;

  @Column()
  name: string;

  @Column()
  handle: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ type: 'int', default: 0 })
  followersCount: number;

  @Column({ nullable: true })
  profileUrl?: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt?: Date;
}
