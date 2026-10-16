import { api } from '@/lib/api';
import type { AuthResponse } from '@/types';

export const register = (email: string, password: string) =>
  api.post<AuthResponse>('/api/auth/register', { email, password }).then(r => r.data);

export const login = (email: string, password: string) =>
  api.post<AuthResponse>('/api/auth/login', { email, password }).then(r => r.data);