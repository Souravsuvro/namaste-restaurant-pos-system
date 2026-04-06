import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/auth';
import { authApi } from '@/api/auth-api';

interface AuthStore {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (pin: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setTokens: (token: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (pin: string) => {
        const response = await authApi.login(pin);
        localStorage.setItem('pos-token', response.token);
        localStorage.setItem('pos-refresh-token', response.refreshToken);
        set({
          user: response.user,
          token: response.token,
          refreshToken: response.refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        localStorage.removeItem('pos-token');
        localStorage.removeItem('pos-refresh-token');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setTokens: (token: string, refreshToken: string) => {
        localStorage.setItem('pos-token', token);
        localStorage.setItem('pos-refresh-token', refreshToken);
        set({ token, refreshToken });
      },
    }),
    {
      name: 'pos-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
