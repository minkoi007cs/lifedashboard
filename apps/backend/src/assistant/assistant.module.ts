import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { CaloriesModule } from '../calories/calories.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';

@Module({
  imports: [FinanceModule, CaloriesModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
