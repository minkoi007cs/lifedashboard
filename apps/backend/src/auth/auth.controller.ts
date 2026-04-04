import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { getRequiredEnv } from '../config/env.config';
import type { GoogleAuthUser } from './types/auth-user';

interface DevLoginBody {
  email?: string;
}

interface GoogleLoginResult {
  accessToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: Request & { user?: GoogleAuthUser },
    @Res() res: Response,
  ): Promise<void> {
    const result = (await this.authService.googleLogin(
      req,
    )) as GoogleLoginResult;
    const frontendUrl = getRequiredEnv('FRONTEND_URL');
    res.redirect(`${frontendUrl}/login/success?token=${result.accessToken}`);
  }

  @Post('dev-login')
  devLogin(@Body() body: DevLoginBody) {
    return this.authService.devLogin(body.email ?? '');
  }
}
