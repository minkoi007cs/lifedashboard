import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailAccount } from './entities/mail-account.entity';
import { MailMessage } from './entities/mail-message.entity';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { MailMcpService } from './mcp/mail-mcp.service';
import { MailMcpController } from './mcp/mail-mcp.controller';
import { TasksModule } from '../tasks/tasks.module';
import { FinanceModule } from '../finance/finance.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MailAccount, MailMessage]),
    TasksModule,
    FinanceModule,
    NotificationsModule,
  ],
  controllers: [MailController, MailMcpController],
  providers: [MailService, MailMcpService],
  exports: [MailService, MailMcpService],
})
export class MailModule {}
