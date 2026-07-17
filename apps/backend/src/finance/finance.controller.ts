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
import { CreateDailyEntryDto } from './dto/daily-entry.dto';
import { SaveExpenseDto } from './dto/save-expense.dto';
import { SaveIncomeDto } from './dto/save-income.dto';
import { InviteShareDto } from './dto/invite-share.dto';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('daily-entry')
  createDailyEntry(
    @GetUser() user: AuthenticatedUser,
    @Body() data: CreateDailyEntryDto,
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
    @Body() data: SaveExpenseDto,
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
    @Body() data: SaveIncomeDto,
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
  inviteUser(@GetUser() user: AuthenticatedUser, @Body() body: InviteShareDto) {
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
