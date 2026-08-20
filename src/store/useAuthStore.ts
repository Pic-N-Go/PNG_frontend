import { Alert } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  ApiError,
  authApi,
  setAccessTokenExpiredHandler,
  type TokenResponse,
  type UserResponse,
} from '@/api/auth';
import { authSecureStorage, waitForAuthStorageWrite } from '@/store/authStorage';
import { queryClient } from './queryClient';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserResponse | null;
  setAuth: (tokens: TokenResponse) => Promise<void>;
  /**
   * 토큰은 그대로 두고 user만 갱신한다. 프로필 수정 후 화면들이 `authUser`를 폴백으로 읽어서
   * 여기까지 맞춰줘야 한다 — setAuth를 부르면 세션을 새로 시작해 refresh 흐름이 끊긴다.
   * user는 persist 대상이 아니라 저장 완료를 기다릴 필요가 없다.
   */
  setUser: (user: UserResponse) => void;
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
            set({ accessToken: null, refreshToken: null, user: null });
            await waitForAuthStorageWrite().catch(() => undefined);
          }
          throw error;
        }
      },
      setUser: (user) => set({ user }),
      // 쿼리 캐시까지 비워야 한다 — `['user','profile']`처럼 키에 계정 식별자가 없는 쿼리가 많아
      // 다른 계정으로 다시 로그인하면 staleTime 안쪽에서는 이전 계정의 캐시가 그대로 렌더된다.
      // 로그아웃·토큰 만료·재수화 실패가 모두 이 함수를 지나가므로 여기 한 곳이면 된다.
      clearAuth: async () => {
        invalidateSession();
        queryClient.clear();
        set({ accessToken: null, refreshToken: null, user: null });
        await waitForAuthStorageWrite();
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => authSecureStorage),
      // SecureStore는 키당 저장 용량 제한(Android 기준 약 2048바이트)이 있어 토큰만 저장하고,
      // user는 재수화 후 /users/me로 새로 받아온다.
      // 자기소개는 서버(users.bio)로 옮겼다 — 기기에만 두면 재설치·기기 변경에 날아갔다.
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
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
          .catch(async (error) => {
            const current = useAuthStore.getState();
            const shouldClearAuth =
              error instanceof ApiError &&
              error.status === 401 &&
              error.code !== 'ACCESS_TOKEN_EXPIRED';
            if (
              shouldClearAuth &&
              sessionRevision === rehydratedSessionRevision &&
              current.accessToken === rehydratedToken
            ) {
              await current.clearAuth().catch((cleanupError) => {
                if (__DEV__) {
                  console.error('[authStore] rehydration cleanup failed:', cleanupError);
                }
              });
            } else if (__DEV__ && !shouldClearAuth) {
              console.warn('[authStore] session validation deferred:', error);
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

async function refreshAccessTokenForSession(
  requestToken: string,
  requestRevision: number,
): Promise<RefreshResult | null> {
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
}

/** REST가 아닌 STOMP 연결도 동일한 rotation·single-flight·세션 검증을 재사용한다. */
export async function refreshAccessTokenForWebSocket(
  requestToken: string,
): Promise<string | null> {
  const requestRevision = resolveTokenSessionRevision(requestToken);
  if (requestRevision === null) return null;

  const refreshed = await refreshAccessTokenForSession(requestToken, requestRevision);
  return refreshed?.sessionRevision === requestRevision ? refreshed.accessToken : null;
}

setAccessTokenExpiredHandler(resolveTokenSessionRevision, refreshAccessTokenForSession);
