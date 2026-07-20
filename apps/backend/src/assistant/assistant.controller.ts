import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user';
import { AssistantService } from './assistant.service';
import { ChatRequestDto } from './dto/chat.dto';

@ApiTags('assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('chat')
  chat(@Body() body: ChatRequestDto, @GetUser() user: AuthenticatedUser) {
    // userId is always sourced from the validated JWT — never from the request body.
    return this.assistantService.chat(body, user.userId);
  }
}
