import { authRequest, useMocks } from './client'
import { createMockSession, readMockState, writeMockState } from './mockStore'
import type { AuthSession, User } from '../types'

function getDeviceId() {
  const existing = localStorage.getItem('fitmind.device_id')
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem('fitmind.device_id', id)
  return id
}

function decodeUserId(token: string) {
  const payload = token.split('.')[1]
  if (!payload) return ''
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(atob(normalized)) as Record<string, unknown>
    return String(json.user_id ?? json.sub ?? json.id ?? '')
  } catch {
    return ''
  }
}

export const authApi = {
  async register(email: string, password: string) {
    if (useMocks) return createMockSession(email)
    await authRequest<{ status: string }>('/register', {
      method: 'POST',
      body: { email, password },
    })
    return this.login(email, password)
  },

  async login(email: string, password: string): Promise<AuthSession> {
    if (useMocks) return createMockSession(email)
    const deviceId = getDeviceId()
    const data = await authRequest<{ access_token: string; refresh_token: string }>('/login', {
      method: 'POST',
      body: { email, password, device_id: deviceId },
    })
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      deviceId,
      userId: decodeUserId(data.access_token),
      email,
    }
  },

  async refresh(session: AuthSession): Promise<AuthSession> {
    if (useMocks) return { ...session, accessToken: `mock-access-${session.userId}-${Date.now()}` }
    const data = await authRequest<{ access?: string; refresh?: string; access_token?: string; refresh_token?: string }>(
      '/refresh',
      {
        method: 'POST',
        body: { refresh_token: session.refreshToken, device_id: session.deviceId },
      },
    )
    const accessToken = data.access_token ?? data.access ?? session.accessToken
    return {
      ...session,
      accessToken,
      refreshToken: data.refresh_token ?? data.refresh ?? session.refreshToken,
      userId: session.userId || decodeUserId(accessToken),
    }
  },

  async getUser(id: string): Promise<User> {
    if (useMocks) {
      const user = readMockState().users.find((item) => item.user_id === id)
      if (!user) throw new Error('Пользователь не найден')
      return user
    }
    return authRequest<User>(`/users/${id}`)
  },

  async updateUser(user: User): Promise<void> {
    if (useMocks) {
      const state = readMockState()
      state.users = state.users.map((item) => (item.user_id === user.user_id ? { ...item, ...user } : item))
      writeMockState(state)
      return
    }
    await authRequest<void>(`/users/${user.user_id}`, { method: 'PATCH', body: user })
  },

  startGoogleLogin() {
    window.location.href =
      `${import.meta.env.VITE_AUTH_API_URL}/auth/google/login`
  },

  startYandexLogin() {
    window.location.href =
      `${import.meta.env.VITE_AUTH_API_URL}/auth/yandex/login`
  },
}
