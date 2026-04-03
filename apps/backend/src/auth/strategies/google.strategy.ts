import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private configService: ConfigService) {
        // Build callback URL: prefer explicit GOOGLE_CALLBACK_URL,
        // otherwise derive from BACKEND_URL (works on Vercel automatically)
        const explicitCallback = configService.get<string>('GOOGLE_CALLBACK_URL');
        const backendUrl = configService.get<string>('BACKEND_URL') || 'http://localhost:3000';
        const callbackURL = explicitCallback || `${backendUrl}/api/v1/auth/google/callback`;

        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
            callbackURL,
            scope: ['email', 'profile'],
        } as any);
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { name, emails, photos, id } = profile;
        const user = {
            email: emails[0].value,
            name: `${name.givenName} ${name.familyName}`,
            picture: photos[0].value,
            googleId: id,
            accessToken,
        };
        done(null, user);
    }
}
