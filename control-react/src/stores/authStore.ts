import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { UserInfo } from '../types/auth';

interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: UserInfo | null) => void;
  setLoading: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    immer((set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
          state.isLoading = false;
        }),

      setLoading: (value) =>
        set((state) => {
          state.isLoading = value;
        }),

      logout: () =>
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
        }),
    })),
    { name: 'AuthStore', enabled: process.env.NODE_ENV === 'development' }
  )
);
