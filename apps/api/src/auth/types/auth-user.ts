export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}
