import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WishesService } from './wishes.service';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { ShareWishDto } from './dto/share-wish.dto';
import { RespondToWishDto } from './dto/respond-to-wish.dto';
import { CreatePlanFromWishDto } from './dto/create-plan-from-wish.dto';
import { CreateWishCommentDto } from './dto/create-wish-comment.dto';

@Controller('wishes')
@UseGuards(AuthGuard('jwt'))
export class WishesController {
    constructor(private readonly wishesService: WishesService) { }

    @Post()
    create(@Request() req, @Body() createWishDto: CreateWishDto) {
        return this.wishesService.create(createWishDto, req.user.userId);
    }

    @Get('mine')
    getMine(@Request() req) {
        return this.wishesService.getMine(req.user.userId);
    }

    @Get('feed')
    getFeed(@Request() req) {
        return this.wishesService.getFeed(req.user.userId);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() updateWishDto: UpdateWishDto) {
        return this.wishesService.update(id, updateWishDto, req.user.userId);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.wishesService.remove(id, req.user.userId);
    }

    @Post(':id/share')
    share(@Request() req, @Param('id') id: string, @Body() shareWishDto: ShareWishDto) {
        return this.wishesService.share(id, shareWishDto, req.user.userId);
    }

    @Post(':id/respond')
    respond(@Request() req, @Param('id') id: string, @Body() respondToWishDto: RespondToWishDto) {
        return this.wishesService.respond(id, respondToWishDto, req.user.userId);
    }

    @Post(':id/comments')
    addComment(@Request() req, @Param('id') id: string, @Body() createWishCommentDto: CreateWishCommentDto) {
        return this.wishesService.addComment(id, createWishCommentDto, req.user.userId);
    }

    @Get(':id/responses')
    getResponses(@Request() req, @Param('id') id: string) {
        return this.wishesService.getResponses(id, req.user.userId);
    }

    @Post(':id/create-plan')
    createPlan(@Request() req, @Param('id') id: string, @Body() createPlanDto: CreatePlanFromWishDto) {
        return this.wishesService.createPlanFromWish(id, createPlanDto, req.user.userId);
    }
}
