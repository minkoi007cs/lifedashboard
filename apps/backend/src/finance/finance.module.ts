import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceSale, FinanceExpense, FinanceShare } from './finance.entity';
import { FinanceWallet } from './entities/finance-wallet.entity';
import { FinanceCategory } from './entities/finance-category.entity';
import { FinanceTransaction } from './entities/finance-transaction.entity';
import { FinanceBudget } from './entities/finance-budget.entity';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinanceSale,
      FinanceExpense,
      FinanceShare,
      FinanceWallet,
      FinanceCategory,
      FinanceTransaction,
      FinanceBudget,
      User,
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
