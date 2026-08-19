import { Alert } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  authApi,
  setAccessTokenExpiredHandler,
  type TokenResponse,
  type UserResponse,
} from '@/api/auth';
import { authSecureStorage, waitForAuthStorageWrite } from '@/store/authStorage';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserResponse | null;
  bio: string | null;
  setAuth: (tokens: TokenResponse) => Promise<void>;
  setBio: (bio: string) => void;
  clearAuth: () => Promise<void>;
};

let sessionRevision = 0;
const tokenSessionRevisions = new Map<string, number>();

function beginSession(accessToken: string): number {
  sessionRevision += 1;
  tokenSessionRevisions.clear();
  tokenSessionRevisions.set(accessToken, sessionRevision);
  return sessionRevision;
}

function invalidateSession(): void {
  sessionRevision += 1;
  tokenSessionRevisions.clear();
}

function resolveTokenSessionRevision(accessToken: string): number | null {
  const revision = tokenSessionRevisions.get(accessToken);
  return revision === sessionRevision ? revision : null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      bio: null,
      setAuth: async (tokens) => {
        const newSessionRevision = beginSession(tokens.accessToken);
        try {
          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: tokens.user,
          });
          await waitForAuthStorageWrite();
        } catch (error) {
          // 저장에 실패한 토큰으로 로그인 상태를 유지하면 앱 재실행 후 세션이 달라진다.
          if (sessionRevision === newSessionRevision) {
            invalidateSession();
            set({ accessToken: null, refreshToken: null, user: null, bio: null });
            await waitForAuthStorageWrite().catch(() => undefined);
          }
          throw error;
        }
      },
      setBio: (bio) => {
        set({ bio });
        void waitForAuthStorageWrite().catch((error) => {
          if (__DEV__) console.error('[authStore] bio persist failed:', error);
        });
      },
      clearAuth: async () => {
        invalidateSession();
        set({ accessToken: null, refreshToken: null, user: null, bio: null });
        await waitForAuthStorageWrite();
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
        const rehydratedSessionRevision = beginSession(rehydratedToken);
        authApi.me(rehydratedToken)
          .then((user) => {
            const current = useAuthStore.getState();
            if (
              sessionRevision === rehydratedSessionRevision &&
              current.accessToken === rehydratedToken
            ) {
              useAuthStore.setState({ user });
            }
          })
          .catch(async () => {
            const current = useAuthStore.getState();
            if (
              sessionRevision === rehydratedSessionRevision &&
              current.accessToken === rehydratedToken
            ) {
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
type RefreshResult = { accessToken: string; sessionRevision: number };
type RefreshTask = { sessionRevision: number; promise: Promise<RefreshResult | null> };
let refreshTask: RefreshTask | null = null;

async function clearExpiredSession(expectedSessionRevision: number): Promise<void> {
  if (sessionRevision !== expectedSessionRevision) return;
  await useAuthStore.getState().clearAuth().catch((error) => {
    if (__DEV__) console.error('[authStore] expired session cleanup failed:', error);
  });
  if (!silentUnauthorized) {
    Alert.alert('로그인이 만료됐어요', '다시 로그인해 주세요.');
  }
}

setAccessTokenExpiredHandler(resolveTokenSessionRevision, async (requestToken, requestRevision) => {
  const current = useAuthStore.getState();
  if (!current.accessToken || sessionRevision !== requestRevision) return null;

  // 같은 세션의 다른 요청이 이미 갱신했다면 소비된 Refresh Token을 다시 쓰지 않는다.
  if (current.accessToken !== requestToken) {
    return { accessToken: current.accessToken, sessionRevision: requestRevision };
  }

  if (!current.refreshToken) {
    await clearExpiredSession(requestRevision);
    return null;
  }

  if (!refreshTask || refreshTask.sessionRevision !== requestRevision) {
    const refreshTokenForRequest = current.refreshToken;
    const promise = authApi.refreshToken(refreshTokenForRequest)
      .then(async (tokens) => {
        const latest = useAuthStore.getState();
        if (
          sessionRevision !== requestRevision ||
          latest.refreshToken !== refreshTokenForRequest
        ) {
          return null;
        }

        // Refresh Token rotation은 같은 로그인 세션이므로 revision을 유지한다.
        tokenSessionRevisions.set(tokens.accessToken, requestRevision);
        useAuthStore.setState({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: tokens.user,
        });
        try {
          await waitForAuthStorageWrite();
        } catch (error) {
          await clearExpiredSession(requestRevision);
          throw error;
        }

        if (
          sessionRevision !== requestRevision ||
          useAuthStore.getState().accessToken !== tokens.accessToken
        ) {
          return null;
        }
        return { accessToken: tokens.accessToken, sessionRevision: requestRevision };
      })
      .catch(async (error) => {
        const latest = useAuthStore.getState();
        if (
          sessionRevision !== requestRevision ||
          latest.refreshToken !== refreshTokenForRequest
        ) {
          return null;
        }
        await clearExpiredSession(requestRevision);
        throw error;
      });

    const task: RefreshTask = {
      sessionRevision: requestRevision,
      promise: promise.then(
        (result) => {
          if (refreshTask === task) refreshTask = null;
          return result;
        },
        (error) => {
          if (refreshTask === task) refreshTask = null;
          throw error;
        },
      ),
    };
    refreshTask = task;
  }

  return refreshTask.promise;
});
