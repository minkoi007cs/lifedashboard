import { Injectable, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    generateToken(user: User) {
        return this.jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
    }

    async googleLogin(req) {
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
            await this.usersService.update(user.id, {
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
        if (process.env.NODE_ENV === 'production') {
            throw new ForbiddenException('Dev login is not available in production');
        }

        const devEmail = email || 'dev@lifedashboard.local';

        let user = await this.usersService.findByEmail(devEmail);
        if (!user) {
            user = await this.usersService.create({
                email: devEmail,
                name: 'Dev User',
                role: 'admin', // Admin so you can see all widgets
            });
        }

        return { accessToken: this.generateToken(user), user };
    }
}
