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
  logout: () => void;
  refresh: () => Promise<AuthSession | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = 'fitmind.session';

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
    return {
      session,
      isReady,
      login: async (email, password) => setSession(await authApi.login(email, password)),
      register: async (email, password) => setSession(await authApi.register(email, password)),
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