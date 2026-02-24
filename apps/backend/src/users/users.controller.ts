import { Controller, Get, UseGuards, Request } from '@nestjs/common';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// Will uncomment after Auth module is set up

@Controller('users')
export class UsersController {
    // @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }
}
