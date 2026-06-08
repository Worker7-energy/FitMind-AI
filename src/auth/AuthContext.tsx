import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api/authApi'
import { attachAuth } from '../api/client'
import type { AuthSession } from '../types'

type AuthContextValue = {
  session: AuthSession | null
  isReady: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => void
  loginWithYandex: () => void
  logout: () => void
  refresh: () => Promise<AuthSession | null>
  sendVerification: (email: string) => Promise<unknown>
  verifyEmail: (email: string, code: string) => Promise<unknown>
}

const storageKey = 'fitmind.session'
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    if (accessToken && refreshToken) {
      const userId = params.get('user_id') ?? ''
      const email = params.get('email') ?? ''
      const deviceId = localStorage.getItem('fitmind.device_id') ?? crypto.randomUUID()
      localStorage.setItem('fitmind.device_id', deviceId)
      const oauthSession: AuthSession = { accessToken, refreshToken, deviceId, userId, email }
      setSession(oauthSession)
      window.history.replaceState({}, '', '/')
      setIsReady(true)
      return
    }
    
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      try {
        setSession(JSON.parse(raw) as AuthSession)
      } catch {
        localStorage.removeItem(storageKey)
      }
    }
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (session) localStorage.setItem(storageKey, JSON.stringify(session))
    else localStorage.removeItem(storageKey)
  }, [session])

  const value = useMemo<AuthContextValue>(() => {
    const refresh = async () => {
      if (!session) return null
      const next = await authApi.refresh(session)
      setSession(next)
      return next
    }

    return {
      session,
      isReady,
      login: async (email: string, password: string) => setSession(await authApi.login(email, password)),
      register: async (email: string, password: string) => setSession(await authApi.registerWithPassword(email, password)),
      loginWithGoogle: () => authApi.startGoogleLogin(),
      loginWithYandex: () => authApi.startYandexLogin(),
      logout: () => setSession(null),
      refresh,
      sendVerification: async (email: string) => authApi.sendVerification(email),
      verifyEmail: async (email: string, code: string) => authApi.verifyEmail(email, code),
    }
  }, [isReady, session])

  useEffect(() => {
    attachAuth(() => session, value.refresh)
  }, [session, value.refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
