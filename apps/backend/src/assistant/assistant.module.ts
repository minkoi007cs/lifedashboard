import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceModule } from '../finance/finance.module';
import { CaloriesModule } from '../calories/calories.module';
import { TasksModule } from '../tasks/tasks.module';
import { HabitsModule } from '../habits/habits.module';
import { FocusModule } from '../focus/focus.module';
import { WishesModule } from '../wishes/wishes.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { AssistantConversation } from './entities/assistant-conversation.entity';
import { AssistantMessageEntity } from './entities/assistant-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssistantConversation, AssistantMessageEntity]),
    FinanceModule,
    CaloriesModule,
    TasksModule,
    HabitsModule,
    FocusModule,
    WishesModule,
  ],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
