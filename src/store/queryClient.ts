import { QueryClient } from '@tanstack/react-query';

/**
 * 서버 상태 캐시. 모듈 스코프에 두는 이유는 로그아웃(`useAuthStore.clearAuth`)에서
 * 훅 밖에서 캐시를 비워야 하기 때문이다 — 계정이 바뀌었는데 이전 계정의 응답이
 * 남아 있으면 `['user','profile']`처럼 키에 계정 식별자가 없는 쿼리가 옛 프로필을 그대로 준다.
 */
export const queryClient = new QueryClient();
