import { Alert } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  authApi,
  setAccessTokenExpiredHandler,
  type TokenResponse,
  type UserResponse,
} from '@/api/auth';
import { authSecureStorage } from '@/store/authStorage';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserResponse | null;
  bio: string | null;
  setAuth: (tokens: TokenResponse) => Promise<void>;
  setBio: (bio: string) => void;
  clearAuth: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      bio: null,
      setAuth: async (tokens) => {
        try {
          await set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: tokens.user,
          });
        } catch (error) {
          // 저장에 실패한 토큰으로 로그인 상태를 유지하면 앱 재실행 후 세션이 달라진다.
          await Promise.resolve(
            set({ accessToken: null, refreshToken: null, user: null, bio: null }),
          ).catch(() => undefined);
          throw error;
        }
      },
      setBio: (bio) => {
        void Promise.resolve(set({ bio })).catch((error) => {
          if (__DEV__) console.error('[authStore] bio persist failed:', error);
        });
      },
      clearAuth: async () => {
        await set({ accessToken: null, refreshToken: null, user: null, bio: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => authSecureStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        bio: state.bio,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state?.accessToken) return;

        silentUnauthorized = true;
        const rehydratedToken = state.accessToken;
        authApi.me(rehydratedToken)
          .then((user) => {
            const current = useAuthStore.getState();
            if (current.accessToken === rehydratedToken) {
              useAuthStore.setState({ user });
            }
          })
          .catch(async () => {
            const current = useAuthStore.getState();
            if (current.accessToken === rehydratedToken) {
              await current.clearAuth().catch((error) => {
                if (__DEV__) console.error('[authStore] rehydration cleanup failed:', error);
              });
            }
          })
          .finally(() => {
            silentUnauthorized = false;
          });
      },
    },
  ),
);

let silentUnauthorized = false;
let refreshPromise: Promise<string | null> | null = null;

async function clearExpiredSession(): Promise<void> {
  await useAuthStore.getState().clearAuth().catch((error) => {
    if (__DEV__) console.error('[authStore] expired session cleanup failed:', error);
  });
  if (!silentUnauthorized) {
    Alert.alert('로그인이 만료됐어요', '다시 로그인해 주세요.');
  }
}

setAccessTokenExpiredHandler(async (requestToken) => {
  const current = useAuthStore.getState();
  if (!current.accessToken) return null;

  // 다른 요청이 이미 갱신했으면 소비된 Refresh Token을 다시 쓰지 않고 최신 토큰을 반환한다.
  if (current.accessToken !== requestToken) return current.accessToken;

  if (!current.refreshToken) {
    await clearExpiredSession();
    return null;
  }

  if (!refreshPromise) {
    const refreshTokenForRequest = current.refreshToken;
    refreshPromise = authApi.refreshToken(refreshTokenForRequest)
      .then(async (tokens) => {
        const latest = useAuthStore.getState();
        // 로그아웃 또는 새 로그인 뒤에 도착한 예전 갱신 결과는 현재 세션을 덮지 않는다.
        if (latest.refreshToken !== refreshTokenForRequest) {
          return latest.accessToken;
        }
        await latest.setAuth(tokens);
        return tokens.accessToken;
      })
      .catch(async (error) => {
        const latest = useAuthStore.getState();
        if (latest.refreshToken !== refreshTokenForRequest) {
          return latest.accessToken;
        }
        await clearExpiredSession();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
});
