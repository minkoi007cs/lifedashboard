import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
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
  description?: string;
  originalDate?: string;
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

  @Get('statistics')
  getStatistics(@GetUser() user: AuthenticatedUser) {
    return this.financeService.getStatistics(user.userId);
  }

  @Delete('daily-entry/:date')
  deleteDailyEntry(
    @GetUser() user: AuthenticatedUser,
    @Param('date') date: string,
  ) {
    return this.financeService.deleteDailyEntry(date, user.userId);
  }
}
