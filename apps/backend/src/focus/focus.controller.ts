import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user';
import { FocusService } from './focus.service';
import { CreateFocusSessionDto } from './dto/create-focus-session.dto';

@Controller('focus')
@UseGuards(JwtAuthGuard)
export class FocusController {
  constructor(private readonly focusService: FocusService) {}

  @Post()
  create(
    @GetUser() user: AuthenticatedUser,
    @Body() createDto: CreateFocusSessionDto,
  ) {
    return this.focusService.create(createDto, user.userId);
  }

  @Get()
  findAll(@GetUser() user: AuthenticatedUser) {
    return this.focusService.findAll(user.userId);
  }

  @Get('stats')
  getStats(@GetUser() user: AuthenticatedUser) {
    return this.focusService.getStats(user.userId);
  }

  @Delete(':id')
  remove(@GetUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.focusService.remove(id, user.userId);
  }
}
