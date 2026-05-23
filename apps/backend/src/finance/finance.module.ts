import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceSale, FinanceExpense, FinanceShare } from './finance.entity';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinanceSale, FinanceExpense, FinanceShare, User]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
