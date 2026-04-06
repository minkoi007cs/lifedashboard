import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@GetUser() user: AuthenticatedUser) {
    return this.usersService.findProfileById(user.userId);
  }

  @Get('search')
  search(@GetUser() user: AuthenticatedUser, @Query('q') query: string) {
    return this.usersService.search(query ?? '', user.userId);
  }
}
