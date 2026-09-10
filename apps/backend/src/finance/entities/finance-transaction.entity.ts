import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/user.entity';
import { FinanceWallet } from './finance-wallet.entity';
import { FinanceCategory } from './finance-category.entity';

export type TransactionType = 'income' | 'expense' | 'transfer';

@Entity('finance_transactions')
export class FinanceTransaction extends BaseEntity {
  @Column({ type: 'float' })
  amount: number;

  @Column({ default: 'expense' })
  type: TransactionType;

  @Column()
  date: string; // YYYY-MM-DD

  @Column({ nullable: true })
  note?: string;

  @Column({ name: 'receipt_image', type: 'text', nullable: true })
  receiptImage?: string;

  @Column({ name: 'is_family_shared', default: false })
  isFamilyShared: boolean;

  @ManyToOne(() => FinanceWallet, { onDelete: 'SET NULL', nullable: true })
  wallet?: FinanceWallet;

  @Column({ nullable: true })
  walletId?: string;

  @ManyToOne(() => FinanceCategory, { onDelete: 'SET NULL', nullable: true })
  category?: FinanceCategory;

  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  paidByUser?: User;

  @Column({ name: 'paid_by_user_id', nullable: true })
  paidByUserId?: string;
}
