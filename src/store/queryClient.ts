import { AppState, type AppStateStatus } from 'react-native';
import { QueryClient, focusManager } from '@tanstack/react-query';

/**
 * 서버 상태 캐시. 모듈 스코프에 두는 이유는 로그아웃(`useAuthStore.clearAuth`)에서
 * 훅 밖에서 캐시를 비워야 하기 때문이다 — 계정이 바뀌었는데 이전 계정의 응답이
 * 남아 있으면 `['user','profile']`처럼 키에 계정 식별자가 없는 쿼리가 옛 프로필을 그대로 준다.
 */
export const queryClient = new QueryClient();

/**
 * refetchOnWindowFocus는 브라우저 focus 이벤트를 보므로 RN에서는 그냥 두면 영영 안 걸린다.
 * AppState를 focusManager에 이어줘야 앱이 포그라운드로 돌아올 때 낡은 쿼리가 갱신된다.
 *
 * 이게 없으면 탭 화면은 한 번 마운트된 뒤 언마운트되지 않아(바텀탭 기본 동작) 앱을 켜둔 채로는
 * 데이터가 무기한 낡은 채로 남는다 — 홈 알림 배지가 푸시를 받고도 안 바뀌던 이유다.
 */
AppState.addEventListener('change', (status: AppStateStatus) => {
  focusManager.setFocused(status === 'active');
});
