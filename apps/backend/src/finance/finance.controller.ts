import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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

interface InviteDto {
  email: string;
  permission: 'view' | 'edit';
}

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('daily-entry')
  createDailyEntry(
    @GetUser() user: AuthenticatedUser,
    @Body() data: DailyEntryDto,
    @Query('targetUserId') targetUserId?: string,
  ) {
    return this.financeService.createDailyEntry(
      data,
      user.userId,
      targetUserId,
    );
  }

  @Get('statistics')
  getStatistics(
    @GetUser() user: AuthenticatedUser,
    @Query('targetUserId') targetUserId?: string,
  ) {
    return this.financeService.getStatistics(user.userId, targetUserId);
  }

  @Delete('daily-entry/:date')
  deleteDailyEntry(
    @GetUser() user: AuthenticatedUser,
    @Param('date') date: string,
    @Query('targetUserId') targetUserId?: string,
  ) {
    return this.financeService.deleteDailyEntry(
      date,
      user.userId,
      targetUserId,
    );
  }

  @Post('expense')
  saveExpense(
    @GetUser() user: AuthenticatedUser,
    @Body() data: {
      id?: string;
      date: string;
      amount: number;
      description: string;
      category?: string;
      receiptImage?: string;
    },
    @Query('targetUserId') targetUserId?: string,
  ) {
    return this.financeService.saveExpense(data, user.userId, targetUserId);
  }

  @Delete('expense/:id')
  deleteExpense(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('targetUserId') targetUserId?: string,
  ) {
    return this.financeService.deleteExpense(id, user.userId, targetUserId);
  }

  @Post('income')
  saveIncome(
    @GetUser() user: AuthenticatedUser,
    @Body() data: {
      id?: string;
      date: string;
      serviceSales: number;
      cashTips: number;
      description?: string;
      receiptImage?: string;
    },
    @Query('targetUserId') targetUserId?: string,
  ) {
    return this.financeService.saveIncome(data, user.userId, targetUserId);
  }

  @Delete('income/:id')
  deleteIncome(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('targetUserId') targetUserId?: string,
  ) {
    return this.financeService.deleteIncome(id, user.userId, targetUserId);
  }

  // ── Share endpoints ──────────────────────────────────────────────────────

  @Post('share')
  inviteUser(@GetUser() user: AuthenticatedUser, @Body() body: InviteDto) {
    return this.financeService.inviteUser(
      user.userId,
      user.email,
      body.email,
      body.permission,
    );
  }

  @Get('share/sent')
  getSentShares(@GetUser() user: AuthenticatedUser) {
    return this.financeService.getSentShares(user.userId);
  }

  @Get('share/received')
  getReceivedInvites(@GetUser() user: AuthenticatedUser) {
    return this.financeService.getReceivedInvites(user.userId);
  }

  @Patch('share/:id/accept')
  acceptInvite(
    @GetUser() user: AuthenticatedUser,
    @Param('id') shareId: string,
  ) {
    return this.financeService.acceptInvite(shareId, user.userId);
  }

  @Patch('share/:id/reject')
  rejectInvite(
    @GetUser() user: AuthenticatedUser,
    @Param('id') shareId: string,
  ) {
    return this.financeService.rejectInvite(shareId, user.userId);
  }

  @Delete('share/:id')
  revokeShare(
    @GetUser() user: AuthenticatedUser,
    @Param('id') shareId: string,
  ) {
    return this.financeService.revokeShare(shareId, user.userId);
  }
}
