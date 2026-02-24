import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FocusSession } from './focus.entity';
import { FocusService } from './focus.service';
import { FocusController } from './focus.controller';

@Module({
    imports: [TypeOrmModule.forFeature([FocusSession])],
    controllers: [FocusController],
    providers: [FocusService],
    exports: [FocusService],
})
export class FocusModule { }
