import { authRequest } from './client';
import { AuthSession, User } from '../types';

function decodeUserId(token: string): string {
  const payload = token.split('.')[1];
  if (!payload) return '';
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(normalized)) as Record<string, unknown>;
    return String(json.user_id ?? json.sub ?? json.id ?? '');
  } catch {
    return '';
  }
}

export const authApi = {
  async register(email: string, password: string) {
    await authRequest<{ status: string }>('/register', {
      method: 'POST',
      body: { email, password },
    });
    return this.login(email, password);
  },

  async login(email: string, password: string): Promise<AuthSession> {
    const deviceId = 'mobile-' + Date.now();
    const data = await authRequest<{ access_token: string; refresh_token: string }>('/login', {
      method: 'POST',
      body: { email, password, device_id: deviceId },
    });
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      deviceId,
      userId: decodeUserId(data.access_token),
      email,
    };
  },

  async refresh(session: AuthSession): Promise<AuthSession> {
    const data = await authRequest<{ access_token?: string; refresh_token?: string }>('/refresh', {
      method: 'POST',
      body: { refresh_token: session.refreshToken, device_id: session.deviceId },
    });
    const accessToken = data.access_token ?? session.accessToken;
    return {
      ...session,
      accessToken,
      refreshToken: data.refresh_token ?? session.refreshToken,
      userId: session.userId || decodeUserId(accessToken),
    };
  },

  async getUser(id: string): Promise<User> {
    return authRequest<User>(`/users/${id}`);
  },

  async updateUser(user: User): Promise<void> {
    await authRequest<void>(`/users/${user.user_id}`, { method: 'PATCH', body: user });
  },
};