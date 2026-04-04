import { PassportStrategy } from '@nestjs/passport';
import {
  Profile,
  Strategy,
  VerifyCallback,
  StrategyOptions,
} from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthUser } from '../types/auth-user';

function getRequiredConfigValue(
  configService: ConfigService,
  key: string,
): string {
  const value = configService.get<string>(key)?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: getRequiredConfigValue(configService, 'GOOGLE_CLIENT_ID'),
      clientSecret: getRequiredConfigValue(
        configService,
        'GOOGLE_CLIENT_SECRET',
      ),
      callbackURL: getRequiredConfigValue(configService, 'GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    } satisfies StrategyOptions);
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const primaryEmail = profile.emails?.[0]?.value;
    if (!primaryEmail) {
      return done(new Error('Google account email is missing'));
    }

    const user: GoogleAuthUser = {
      email: primaryEmail,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value,
      googleId: profile.id,
    };

    return done(null, user);
  }
}
