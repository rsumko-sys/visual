import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '../lib/api';

const TOKEN_KEY = 'osint_auth_token';

interface AuthContextType {
  token: string | null;
  login: (t: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const login = useCallback((t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsReady(true);
      return;
    }
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
      setIsReady(true);
      return;
    }
    // Beta: auto guest token (no password)
    fetch(`${getApiBaseUrl()}/auth/guest`)
      .then((r) => r.json())
      .then((data: { access_token?: string }) => {
        const t = data?.access_token;
        if (t) {
          localStorage.setItem(TOKEN_KEY, t);
          setToken(t);
        }
      })
      .catch(() => {})
      .finally(() => setIsReady(true));
  }, []);

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token, isReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
