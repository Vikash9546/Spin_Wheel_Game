import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = create(
  persist(
    (set) => ({
      user:  null,
      token: null,
      role:  'user',

      login(user, token) {
        let role = 'user';
        try { role = jwtDecode(token)?.role || 'user'; } catch {
          // Ignore malformed tokens and keep the default role.
        }
        set({ user, token, role });
      },

      updateUser(patch) {
        set((s) => ({ user: { ...s.user, ...patch } }));
      },

      logout() {
        set({ user: null, token: null, role: 'user' });
      },

      isAuthenticated() {
        return !!this.token;
      },
    }),
    { name: 'eliminator-auth' }
  )
);
