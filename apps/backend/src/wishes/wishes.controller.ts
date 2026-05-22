import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WishesService } from './wishes.service';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { ShareWishDto } from './dto/share-wish.dto';
import { RespondToWishDto } from './dto/respond-to-wish.dto';
import { CreatePlanFromWishDto } from './dto/create-plan-from-wish.dto';
import { CreateWishCommentDto } from './dto/create-wish-comment.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user';

@Controller('wishes')
@UseGuards(AuthGuard('jwt'))
export class WishesController {
  constructor(private readonly wishesService: WishesService) {}

  @Post()
  create(
    @GetUser() user: AuthenticatedUser,
    @Body() createWishDto: CreateWishDto,
  ) {
    return this.wishesService.create(createWishDto, user.userId);
  }

  @Get('mine')
  getMine(@GetUser() user: AuthenticatedUser) {
    return this.wishesService.getMine(user.userId);
  }

  @Get('feed')
  getFeed(@GetUser() user: AuthenticatedUser) {
    return this.wishesService.getFeed(user.userId);
  }

  @Patch(':id')
  update(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateWishDto: UpdateWishDto,
  ) {
    return this.wishesService.update(id, updateWishDto, user.userId);
  }

  @Delete(':id')
  remove(@GetUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.wishesService.remove(id, user.userId);
  }

  @Post(':id/share')
  share(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() shareWishDto: ShareWishDto,
  ) {
    return this.wishesService.share(id, shareWishDto, user.userId);
  }

  @Post(':id/respond')
  respond(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() respondToWishDto: RespondToWishDto,
  ) {
    return this.wishesService.respond(id, respondToWishDto, user.userId);
  }

  @Post(':id/comments')
  addComment(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() createWishCommentDto: CreateWishCommentDto,
  ) {
    return this.wishesService.addComment(id, createWishCommentDto, user.userId);
  }

  @Get(':id/responses')
  getResponses(@GetUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.wishesService.getResponses(id, user.userId);
  }

  @Post(':id/create-plan')
  createPlan(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() createPlanDto: CreatePlanFromWishDto,
  ) {
    return this.wishesService.createPlanFromWish(
      id,
      createPlanDto,
      user.userId,
    );
  }
}
