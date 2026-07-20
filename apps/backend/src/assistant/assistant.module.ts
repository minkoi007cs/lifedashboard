import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { CaloriesModule } from '../calories/calories.module';
import { TasksModule } from '../tasks/tasks.module';
import { HabitsModule } from '../habits/habits.module';
import { FocusModule } from '../focus/focus.module';
import { WishesModule } from '../wishes/wishes.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';

@Module({
  imports: [FinanceModule, CaloriesModule, TasksModule, HabitsModule, FocusModule, WishesModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
