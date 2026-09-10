import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/user.entity';
import { FinanceCategory } from './finance-category.entity';

@Entity('finance_budgets')
export class FinanceBudget extends BaseEntity {
  @Column()
  month: string; // YYYY-MM

  @Column({ name: 'limit_amount', type: 'float' })
  limitAmount: number;

  @Column({ name: 'notify_threshold', type: 'float', default: 0.8 })
  notifyThreshold: number; // 80%

  @ManyToOne(() => FinanceCategory, { onDelete: 'CASCADE' })
  category: FinanceCategory;

  @Column()
  categoryId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;
}
