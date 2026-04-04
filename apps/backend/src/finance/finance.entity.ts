import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { User } from '../users/user.entity';

@Entity('finance_sales')
export class FinanceSale extends BaseEntity {
  @Column({ type: 'float' })
  serviceSales: number;

  @Column({ type: 'float' })
  cashTips: number;

  @Column({ type: 'float' })
  ccTips: number;

  @Column({ type: 'float' })
  commissionBase: number;

  @Column({ type: 'float' })
  cashCommission: number;

  @Column({ type: 'float' })
  checkCommission: number;

  @Column({ type: 'float' })
  taxAmount: number;

  @Column({ type: 'float' })
  netCheck: number;

  @Column()
  date: string; // YYYY-MM-DD

  @ManyToOne(() => User, (user) => user.financeSales, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;
}

@Entity('finance_expenses')
export class FinanceExpense extends BaseEntity {
  @Column()
  description: string;

  @Column({ type: 'float' })
  amount: number;

  @Column()
  category: string;

  @Column()
  date: string; // YYYY-MM-DD

  @ManyToOne(() => User, (user) => user.financeExpenses, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column()
  userId: string;
}

@Entity('pay_periods')
export class PayPeriod extends BaseEntity {
  @Column()
  startDate: string;

  @Column()
  endDate: string;

  @Column({ type: 'float', default: 0 })
  grossEarnings: number;

  @Column({ type: 'float', default: 0 })
  taxesPaid: number;

  @Column({ type: 'float', default: 0 })
  netPayout: number;

  @Column({ type: 'float', default: 0 })
  totalExpenses: number;

  @Column({ type: 'float', default: 0 })
  realProfit: number;

  @Column({ default: false })
  isClosed: boolean;

  @ManyToOne(() => User, (user) => user.payPeriods, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;
}
