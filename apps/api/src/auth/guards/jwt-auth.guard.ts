import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import { getRequiredEnv } from '../../config/env.config';
import { UsersService } from '../../users/users.service';
import type { AuthenticatedUser } from '../types/auth-user';

// Web và API chạy chung một Vercel project nên dùng chung biến VITE_SUPABASE_*.
let supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  supabase ??= createClient(
    getRequiredEnv('VITE_SUPABASE_URL'),
    getRequiredEnv('VITE_SUPABASE_ANON_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return supabase;
}

/**
 * Xác thực access token do Supabase Auth cấp (Google OAuth), rồi map sang ld_users theo email.
 * Role lấy từ ld_users (server quyết định), không tin role trong token.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) throw new UnauthorizedException();

    // getClaims verify chữ ký qua JWKS (hoặc gọi Auth server nếu project dùng HS256) + hạn token.
    const { data, error } = await getSupabase().auth.getClaims(token);
    const claims = data?.claims;
    if (error || !claims?.email) throw new UnauthorizedException();

    const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
    // ponytail: 1 query ld_users mỗi request (email có unique index); thêm cache nếu thành nút cổ chai.
    const user = await this.usersService.findOrCreateByEmail({
      email: claims.email,
      name: (meta.full_name ?? meta.name) as string | undefined,
      avatarUrl: (meta.avatar_url ?? meta.picture) as string | undefined,
    });

    req.user = { userId: user.id, email: user.email, role: user.role };
    return true;
  }
}
