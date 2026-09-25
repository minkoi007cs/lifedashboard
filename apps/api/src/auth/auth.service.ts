import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { GoogleAuthUser } from './types/auth-user';

interface GoogleAuthRequest {
  user?: GoogleAuthUser;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  generateToken(user: User) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async googleLogin(req: GoogleAuthRequest) {
    if (!req.user) {
      return 'No user from google';
    }

    let user = await this.usersService.findByEmail(req.user.email);

    if (!user) {
      user = await this.usersService.create({
        email: req.user.email,
        name: req.user.name,
        avatarUrl: req.user.picture,
        googleId: req.user.googleId,
        role: 'user',
      });
    } else {
      user = await this.usersService.update(user.id, {
        avatarUrl: req.user.picture,
        googleId: req.user.googleId,
      });
    }

    return {
      user,
      accessToken: this.generateToken(user),
    };
  }

  async devLogin(email: string) {
    // Explicit opt-in required — must set DEV_LOGIN_ENABLED=true in env.
    // Returns 404 (not 403) to avoid revealing the endpoint exists in production.
    if (process.env.DEV_LOGIN_ENABLED !== 'true') {
      throw new NotFoundException();
    }

    const devEmail = email || 'dev@lifedashboard.local';

    let user = await this.usersService.findByEmail(devEmail);
    if (!user) {
      user = await this.usersService.create({
        email: devEmail,
        name: 'Dev User',
        role: 'admin',
      });
    }

    return { accessToken: this.generateToken(user), user };
  }
}
