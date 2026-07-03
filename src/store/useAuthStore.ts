import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { authApi, type UserResponse } from '@/api/auth';

const secureStorage: StateStorage = {
  getItem: async (key) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      if (__DEV__) console.error('[authStore] SecureStore getItem failed:', e);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      if (__DEV__) console.error('[authStore] SecureStore setItem failed:', e);
    }
  },
  removeItem: async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      if (__DEV__) console.error('[authStore] SecureStore removeItem failed:', e);
    }
  },
};

type AuthState = {
  accessToken: string | null;
  user: UserResponse | null;
  setAuth: (token: string, user: UserResponse) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: (token, user) => set({ accessToken: token, user }),
      clearAuth: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      // SecureStore는 키당 저장 용량 제한(Android 기준 약 2048바이트)이 있어
      // accessToken만 저장하고, user는 재수화 후 /users/me로 새로 받아온다.
      partialize: (state) => ({ accessToken: state.accessToken }),
      onRehydrateStorage: () => (state) => {
        if (!state?.accessToken) return;
        authApi.me(state.accessToken)
          .then((user) => state.setAuth(state.accessToken as string, user))
          .catch(() => state.clearAuth());
      },
    },
  ),
);
