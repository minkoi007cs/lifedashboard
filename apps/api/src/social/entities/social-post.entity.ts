import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/user.entity';

@Entity('social_posts')
export class SocialPost extends BaseEntity {
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-array' })
  platforms: string[];

  @Column({ default: 'idea' })
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @Column({ nullable: true })
  postUrl?: string;

  @Column({ type: 'simple-array', nullable: true })
  mediaUrls?: string[];

  @Column({ type: 'simple-array', nullable: true })
  hashtags?: string[];

  @Column({ type: 'jsonb', nullable: true })
  metrics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
}
