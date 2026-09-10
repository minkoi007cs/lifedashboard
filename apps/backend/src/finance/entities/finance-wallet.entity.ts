import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/user.entity';

export type WalletType = 'cash' | 'bank' | 'savings' | 'credit';

@Entity('finance_wallets')
export class FinanceWallet extends BaseEntity {
  @Column()
  name: string;

  @Column({ default: 'cash' })
  type: WalletType;

  @Column({ type: 'float', default: 0 })
  balance: number;

  @Column({ default: 'VND' })
  currency: string;

  @Column({ name: 'is_family_shared', default: false })
  isFamilyShared: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;
}
