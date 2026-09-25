import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { User } from '../users/user.entity';

@Entity('focus_sessions')
export class FocusSession extends BaseEntity {
  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column()
  durationMinutes: number;

  @Column({ nullable: true })
  label: string; // e.g. "Work", "Study", specific task ID

  @ManyToOne(() => User, (user) => user.focusSessions, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;
}
