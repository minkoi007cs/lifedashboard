import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import type { GoogleAuthUser } from './types/auth-user';

describe('AuthController', () => {
  it('redirects google callback back to the frontend with the access token', async () => {
    const googleLogin = jest
      .fn()
      .mockResolvedValue({ accessToken: 'token-123' });
    const authService = {
      googleLogin,
    } as unknown as AuthService;
    const controller = new AuthController(authService);
    const redirect = jest.fn();
    const req = {
      user: { email: 'user@example.com' },
    } as unknown as Request & { user?: GoogleAuthUser };
    const res = { redirect } as unknown as Response;

    process.env.FRONTEND_URL = 'https://frontend.example.com';

    await controller.googleAuthRedirect(req, res);

    expect(googleLogin).toHaveBeenCalledWith(req);
    expect(redirect).toHaveBeenCalledWith(
      'https://frontend.example.com/login/success?token=token-123',
    );
  });
});
