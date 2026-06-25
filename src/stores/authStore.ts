import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserResponse } from '@/types/models';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;  // unix ms timestamp
  user: UserResponse | null;

  isAuthenticated: boolean;

  setTokens: (access: string, refresh: string, expiresInSeconds: number) => void;
  setUser: (user: UserResponse) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isAuthenticated: false,

      setTokens: (access, refresh, expiresInSeconds) =>
        set({
          accessToken: access,
          refreshToken: refresh,
          expiresAt: Date.now() + expiresInSeconds * 1000,
          isAuthenticated: true,
        }),

      setUser: (user) => set({ user }),

      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'hellum-consumer-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist token data, not derived state
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
