import { api } from '@/lib/api';

export type UserProfile = {
  id: string;
  email: string;
  dingtalkWebhook: string | null;
};

export const getUserProfile = () =>
  api.get<UserProfile>('/api/user/me').then(r => r.data);

export const updateWebhook = (webhook: string) =>
  api.patch('/api/user/webhook', { webhook }).then(r => r.data);

export const testNotify = () =>
  api.post('/api/user/test-notify').then(r => r.data);