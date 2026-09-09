import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { requestJson } from '@/lib/api';
import {
  clearMobileSession,
  getAccessToken,
  logoutMobileSession,
  refreshAccessToken,
  saveMobileSession,
  type MobileTokenResponse,
  type MobileUser,
} from '@/lib/session';

type AuthContextValue = {
  user: MobileUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendCode: (identifier: string, type?: 'email' | 'sms') => Promise<string>;
  signIn: (identifier: string, code: string, type?: 'email' | 'sms') => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<MobileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const token = await getAccessToken();
      if (!token) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const currentUser = await requestJson<MobileUser>('/auth/user');
        if (mounted) setUser(currentUser);
      } catch {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
          try {
            const currentUser = await requestJson<MobileUser>('/auth/user');
            if (mounted) setUser(currentUser);
          } catch {
            // The refresh token is invalid or revoked; stay signed out.
          }
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    async sendCode(identifier, type = 'email') {
      const response = await requestJson<{ success: boolean; message: string }>('/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, type }),
      });
      return response.message;
    },
    async signIn(identifier, code, type = 'email') {
      const tokens = await requestJson<MobileTokenResponse>('/auth/mobile/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code, type }),
      });
      await saveMobileSession(tokens);
      setUser(tokens.user);
    },
    async signOut() {
      await logoutMobileSession();
      setUser(null);
      queryClient.removeQueries({ queryKey: ['mobile-notifications'] });
    },
  }), [isLoading, queryClient, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return context;
}