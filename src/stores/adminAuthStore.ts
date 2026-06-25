import { create } from 'zustand';

interface AdminAuthState {
  /**
   * Raw Google ID token used as `Authorization: Bearer <token>` for /admin/* routes.
   * Google ID tokens expire in ~1 hour. Not persisted — admins re-authenticate each session.
   */
  googleIdToken: string | null;
  email: string | null;
  displayName: string | null;
  isSuperAdmin: boolean;

  setAdminAuth: (params: {
    googleIdToken: string;
    email: string;
    displayName?: string | null;
    isSuperAdmin: boolean;
  }) => void;

  clearAdminAuth: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()((set) => ({
  googleIdToken: null,
  email: null,
  displayName: null,
  isSuperAdmin: false,

  setAdminAuth: ({ googleIdToken, email, displayName = null, isSuperAdmin }) =>
    set({ googleIdToken, email, displayName, isSuperAdmin }),

  clearAdminAuth: () =>
    set({
      googleIdToken: null,
      email: null,
      displayName: null,
      isSuperAdmin: false,
    }),
}));
