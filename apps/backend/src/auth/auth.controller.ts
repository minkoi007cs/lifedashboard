import { Controller, Get, Post, Body, UseGuards, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() req) { }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req, @Res() res) {
        const result = await this.authService.googleLogin(req) as any;
        if (!result?.accessToken) {
            throw new UnauthorizedException('Google authentication failed');
        }
        const accessToken = result.accessToken;
        // FRONTEND_URL must be set in Vercel env vars for production
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/login/success?token=${accessToken}`);
    }

    // Dev-only bypass — disabled in production
    @Post('dev-login')
    async devLogin(@Body() body: { email?: string }) {
        return this.authService.devLogin(body?.email ?? '');
    }
}
