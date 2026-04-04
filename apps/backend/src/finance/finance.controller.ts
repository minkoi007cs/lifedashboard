import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user';
import { FinanceService } from './finance.service';

interface DailyEntryExpenseDto {
  description: string;
  amount: number;
  category?: string;
}

interface DailyEntryDto {
  date: string;
  serviceSales: number;
  cashTips: number;
  ccTips: number;
  expenses: DailyEntryExpenseDto[];
}

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('daily-entry')
  createDailyEntry(
    @GetUser() user: AuthenticatedUser,
    @Body() data: DailyEntryDto,
  ) {
    return this.financeService.createDailyEntry(data, user.userId);
  }

  @Get('pay-period/active')
  getActivePayPeriod(@GetUser() user: AuthenticatedUser) {
    return this.financeService.getActivePayPeriod(user.userId);
  }

  @Post('pay-period/start')
  startPayPeriod(
    @GetUser() user: AuthenticatedUser,
    @Body('startDate') startDate: string,
  ) {
    return this.financeService.startPayPeriod(user.userId, startDate);
  }

  @Get('statistics')
  getStatistics(@GetUser() user: AuthenticatedUser) {
    return this.financeService.getStatistics(user.userId);
  }
}
