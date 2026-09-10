import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MailService } from './mail.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user';
import type { CreateMailAccountDto } from '@life-dashboard/shared';

@Controller('mail')
@UseGuards(AuthGuard('jwt'))
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('overview')
  getOverview(@GetUser() user: AuthenticatedUser) {
    return this.mailService.getMailOverview(user.userId);
  }

  @Get('accounts')
  getAccounts(@GetUser() user: AuthenticatedUser) {
    return this.mailService.getAccounts(user.userId);
  }

  @Post('accounts')
  createAccount(
    @GetUser() user: AuthenticatedUser,
    @Body() body: CreateMailAccountDto,
  ) {
    return this.mailService.createAccount(user.userId, body);
  }

  @Delete('accounts/:id')
  deleteAccount(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.mailService.deleteAccount(id, user.userId);
  }

  @Post('accounts/:id/sync')
  syncAccount(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.mailService.syncAccount(id, user.userId);
  }

  @Post('sync-all')
  syncAll(@GetUser() user: AuthenticatedUser) {
    return this.mailService.syncAll(user.userId);
  }

  @Get('messages')
  getMessages(
    @GetUser() user: AuthenticatedUser,
    @Query('accountId') accountId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.mailService.getMessages(user.userId, {
      accountId,
      category,
      search,
    });
  }

  @Get('messages/:id')
  getMessage(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.mailService.getMessage(id, user.userId);
  }

  @Patch('messages/:id/star')
  toggleStarred(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.mailService.toggleStarred(id, user.userId);
  }

  @Post('messages/:id/convert-to-task')
  convertToTask(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.mailService.convertToTask(id, user.userId);
  }

  @Post('messages/:id/convert-to-expense')
  convertToExpense(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body?: { walletId?: string },
  ) {
    return this.mailService.convertToExpense(id, user.userId, body?.walletId);
  }

  @Post('messages/:id/generate-reply')
  generateReply(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body?: { tone?: string },
  ) {
    return this.mailService.generateReply(id, user.userId, body?.tone);
  }
}
