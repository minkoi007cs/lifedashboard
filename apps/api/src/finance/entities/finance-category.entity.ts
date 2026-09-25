import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/user.entity';

export type CategoryType = 'income' | 'expense';

@Entity('finance_categories')
export class FinanceCategory extends BaseEntity {
  @Column()
  name: string;

  @Column({ default: 'expense' })
  type: CategoryType;

  @Column({ default: 'Tag' })
  icon: string;

  @Column({ default: '#3b82f6' })
  color: string;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  user?: User;

  @Column({ nullable: true })
  userId?: string;
}
