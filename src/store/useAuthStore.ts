import { create } from 'zustand';

type AuthState = {
  isLoggedIn: boolean;
  setLoggedIn: (val: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  setLoggedIn: (val) => set({ isLoggedIn: val }),
}));
