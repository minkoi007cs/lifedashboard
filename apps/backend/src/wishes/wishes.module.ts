import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishComment, WishEntry, WishResponse, WishShare } from './wish.entity';
import { WishesController } from './wishes.controller';
import { WishesService } from './wishes.service';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([WishEntry, WishResponse, WishShare, WishComment]),
        UsersModule,
        NotificationsModule,
        TasksModule,
    ],
    controllers: [WishesController],
    providers: [WishesService],
    exports: [WishesService],
})
export class WishesModule { }
