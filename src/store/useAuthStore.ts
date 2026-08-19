import { Alert } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { authApi, setUnauthorizedHandler, type UserResponse } from '@/api/auth';
import { queryClient } from './queryClient';

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
      // 쿼리 캐시까지 비워야 한다 — `['user','profile']`처럼 키에 계정 식별자가 없는 쿼리가 많아
      // 다른 계정으로 다시 로그인하면 staleTime 안쪽에서는 이전 계정의 캐시가 그대로 렌더된다.
      // 로그아웃·토큰 만료(401)·재수화 실패가 모두 이 함수를 지나가므로 여기 한 곳이면 된다.
      clearAuth: () => {
        queryClient.clear();
        set({ accessToken: null, user: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      // SecureStore는 키당 저장 용량 제한(Android 기준 약 2048바이트)이 있어
      // accessToken만 저장하고, user는 재수화 후 /users/me로 새로 받아온다.
      // 자기소개는 서버(users.bio)로 옮겼다 — 기기에만 두면 재설치·기기 변경에 날아갔다.
      partialize: (state) => ({ accessToken: state.accessToken }),
      onRehydrateStorage: () => (state) => {
        if (!state?.accessToken) return;
        // 이 검사의 401은 "쓰던 세션이 끊긴 것"이 아니라 "저장된 토큰이 이미 죽어 있던 것"이다.
        // 안내 Alert이 스플래시 위에 뜨면 로그인한 적 없는 사람에게 만료를 알리는 꼴이라 조용히 버린다.
        silentUnauthorized = true;
        // 검증 도중 사용자가 이미 새로 로그인했을 수 있다 — 그 사이 스토어의 토큰이 바뀌었으면
        // 이 비동기 검증 결과(성공이든 실패든)로 새 세션을 덮어쓰지 않는다.
        const rehydratedToken = state.accessToken;
        authApi.me(rehydratedToken)
          .then((user) => {
            if (useAuthStore.getState().accessToken === rehydratedToken) {
              state.setAuth(rehydratedToken as string, user);
            }
          })
          .catch(() => {
            if (useAuthStore.getState().accessToken === rehydratedToken) {
              state.clearAuth();
            }
          })
          .finally(() => { silentUnauthorized = false; });
      },
    },
  ),
);

// 어느 API에서 401이 나든 죽은 토큰을 버린다. 리프레시 토큰이 없어 재발급 수단이 없으므로
// 만료 = 로그아웃이다. RootNavigator가 accessToken으로 트리를 갈아끼우므로 곧 화면 이동이기도 하다.
// 설계 근거와 리프레시 토큰 도입 시 교체 방법 → `docs/guide/api/token-refresh-plan.md`
/** 앱 시작 시 저장된 토큰을 검사하는 동안에는 만료 안내를 띄우지 않는다. */
let silentUnauthorized = false;

setUnauthorizedHandler((requestToken) => {
  const current = useAuthStore.getState().accessToken;
  // 이미 비어 있으면 할 일이 없다(로그인 실패의 401도 여기서 걸러진다).
  if (!current) return;
  // 뒤늦게 도착한 옛 요청의 401이 새 세션을 끊지 않게 한다.
  if (requestToken && requestToken !== current) return;

  useAuthStore.getState().clearAuth();
  // query 401은 아무도 렌더하지 않아 안내 없이 튕긴다. 여기서 한 번만 알린다.
  if (!silentUnauthorized) Alert.alert('로그인이 만료됐어요', '다시 로그인해 주세요.');
});
