export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'user' | 'admin';
}

export interface GoogleAuthUser {
  email: string;
  name: string;
  picture?: string;
  googleId: string;
}
