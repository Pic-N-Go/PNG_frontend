import { create } from 'zustand';
import type { UserResponse } from '@/api/auth';

type AuthState = {
  isLoggedIn: boolean;
  accessToken: string | null;
  user: UserResponse | null;
  setLoggedIn: (val: boolean) => void;
  setAuth: (token: string, user: UserResponse) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  accessToken: null,
  user: null,
  setLoggedIn: (val) => set({ isLoggedIn: val }),
  setAuth: (token, user) => set({ isLoggedIn: true, accessToken: token, user }),
  clearAuth: () => set({ isLoggedIn: false, accessToken: null, user: null }),
}));
