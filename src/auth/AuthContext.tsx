import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/authApi';
import { attachAuth } from '../api/client';
import { AuthSession } from '../types';

type AuthContextValue = {
  session: AuthSession | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithToken: (accessToken: string, refreshToken: string, userId?: string, email?: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<AuthSession | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = 'fitmind.session';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          setSession(JSON.parse(raw) as AuthSession);
        } catch { }
      }
      setIsReady(true);
    })();
  }, []);

  useEffect(() => {
    if (session) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else AsyncStorage.removeItem(STORAGE_KEY);
  }, [session]);

  const value = useMemo<AuthContextValue>(() => {
    const refresh = async () => {
      if (!session) return null;
      const next = await authApi.refresh(session);
      setSession(next);
      return next;
    };

    const loginWithToken = async (accessToken: string, refreshToken: string, userId?: string, email?: string) => {
      const deviceId = 'mobile-' + Date.now();
      const finalUserId = userId || decodeUserId(accessToken);
      const finalEmail = email || '';
      setSession({
        accessToken,
        refreshToken,
        deviceId,
        userId: finalUserId,
        email: finalEmail,
      });
    };

    return {
      session,
      isReady,
      login: async (email, password) => setSession(await authApi.login(email, password)),
      register: async (email, password) => setSession(await authApi.register(email, password)),
      loginWithToken,
      logout: () => setSession(null),
      refresh,
    };
  }, [session, isReady]);

  useEffect(() => {
    attachAuth(() => session, value.refresh);
  }, [session, value.refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}