import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SocialService } from './social.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user';
import type { CreateSocialPostDto, SocialPlatform } from '@life-dashboard/shared';

@Controller('social')
@UseGuards(AuthGuard('jwt'))
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('overview')
  getOverview(@GetUser() user: AuthenticatedUser) {
    return this.socialService.getOverview(user.userId);
  }

  @Get('channels')
  getChannels(@GetUser() user: AuthenticatedUser) {
    return this.socialService.getChannels(user.userId);
  }

  @Post('channels')
  createChannel(
    @GetUser() user: AuthenticatedUser,
    @Body()
    body: {
      platform: SocialPlatform;
      name: string;
      handle: string;
      followersCount?: number;
      profileUrl?: string;
    },
  ) {
    return this.socialService.createChannel(user.userId, body);
  }

  @Delete('channels/:id')
  deleteChannel(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.socialService.deleteChannel(id, user.userId);
  }

  @Get('posts')
  getPosts(
    @GetUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('platform') platform?: string,
  ) {
    return this.socialService.getPosts(user.userId, { status, platform });
  }

  @Post('posts')
  createPost(
    @GetUser() user: AuthenticatedUser,
    @Body() body: CreateSocialPostDto,
  ) {
    return this.socialService.createPost(user.userId, body);
  }

  @Patch('posts/:id')
  updatePost(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: Partial<CreateSocialPostDto> & { status?: string },
  ) {
    return this.socialService.updatePost(id, user.userId, body);
  }

  @Delete('posts/:id')
  deletePost(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.socialService.deletePost(id, user.userId);
  }

  @Post('ai-generate')
  generateAi(
    @Body() body: { topic: string; platform: SocialPlatform },
  ) {
    return this.socialService.generateAiContent(body.topic, body.platform);
  }
}
