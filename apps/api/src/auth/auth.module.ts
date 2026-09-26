import { Global, Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// Global để mọi controller dùng @UseGuards(JwtAuthGuard) mà không phải import UsersModule.
@Global()
@Module({
  imports: [UsersModule],
  providers: [JwtAuthGuard],
  exports: [UsersModule, JwtAuthGuard],
})
export class AuthModule {}
