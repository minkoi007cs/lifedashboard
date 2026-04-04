import { ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const jwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
  } as unknown as JwtService;

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  it('blocks dev login in production', async () => {
    process.env.NODE_ENV = 'production';
    const usersService = {} as UsersService;
    const service = new AuthService(usersService, jwtService);

    await expect(service.devLogin('dev@example.com')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('creates or updates oauth users and returns a token', async () => {
    const findByEmail = jest.fn().mockResolvedValue(null);
    const create = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'user',
    });
    const usersService = {
      findByEmail,
      create,
    } as unknown as UsersService;
    const service = new AuthService(usersService, jwtService);

    const result = await service.googleLogin({
      user: {
        email: 'user@example.com',
        name: 'Example User',
        googleId: 'google-1',
        picture: 'https://avatar.example.com',
      },
    });

    expect(findByEmail).toHaveBeenCalledWith('user@example.com');
    expect(create).toHaveBeenCalledWith({
      email: 'user@example.com',
      name: 'Example User',
      avatarUrl: 'https://avatar.example.com',
      googleId: 'google-1',
      role: 'user',
    });
    expect(result).toEqual({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        role: 'user',
      },
      accessToken: 'signed-token',
    });
  });
});
