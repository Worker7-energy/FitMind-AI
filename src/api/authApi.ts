import { authRequest } from './client';
import { AuthSession, User } from '../types';
import { getAuthBase } from './apiConfig';

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

  async sendVerification(email: string): Promise<void> {
    await authRequest('/send-verification', {
      method: 'POST',
      body: { email },
    });
  },

  async verifyEmail(email: string, code: string): Promise<void> {
    await authRequest('/verify-email', {
      method: 'POST',
      body: { email, code },
    });
  },


  getGoogleOAuthUrl(): string {
    const base = getAuthBase();
    return `${base}/google/login`;
  },

  getYandexOAuthUrl(): string {
    const base = getAuthBase();
    return `${base}/yandex/login`;
  },

  extractTokensFromUrl(url: string): { accessToken?: string; refreshToken?: string; userId?: string; email?: string; error?: string } {
    try {
      const urlObj = new URL(url);
      const accessToken = urlObj.searchParams.get('access_token');
      const refreshToken = urlObj.searchParams.get('refresh_token');
      const userId = urlObj.searchParams.get('user_id');
      const email = urlObj.searchParams.get('email');
      const error = urlObj.searchParams.get('error');
      if (error) return { error };
      if (accessToken && refreshToken) {
        return { accessToken, refreshToken, userId: userId || undefined, email: email || undefined };
      }
      return {};
    } catch {
      return {};
    }
  },
};