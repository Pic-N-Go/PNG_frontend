# Refresh Token 프론트 연동

**상태**: 백엔드·프론트 연동 완료 (`feature/refresh-token`)

Access Token 만료 시 즉시 로그아웃하지 않고, 회전형 Refresh Token으로 토큰 쌍을 갱신한 뒤 원래 REST 요청을 한 번 재시도한다.

## 백엔드 계약

- 갱신 endpoint: `POST /auth/token/refresh`
- 요청: `{ "refreshToken": string }`
- 응답: `{ tokenType, accessToken, expiresIn, refreshToken, refreshTokenExpiresIn, user }`
- 갱신 가능한 오류: HTTP 401 + `code: "ACCESS_TOKEN_EXPIRED"`
- Refresh Token은 한 번 사용하면 소비되며 응답의 새 Refresh Token으로 반드시 교체한다.
- `ACCESS_TOKEN_REQUIRED`, `ACCESS_TOKEN_INVALID` 등 다른 401은 자동 갱신하지 않는다.

## 프론트 동작

### 앱 사용 중

1. API 모듈이 `fetchWithAuthRetry`로 요청한다.
2. 응답이 `ACCESS_TOKEN_EXPIRED`이면 `useAuthStore`에 등록된 갱신 핸들러를 호출한다.
3. 진행 중인 갱신이 있으면 같은 Promise를 공유한다(single-flight).
4. 갱신 성공 시 Access/Refresh Token을 함께 교체한다.
5. 새 Access Token으로 원 요청을 정확히 한 번 재시도한다.
6. Refresh Token이 없거나 갱신이 실패한 경우에만 인증 상태를 지우고 만료 안내를 표시한다.

갱신 요청 자체는 Authorization 헤더가 없는 저수준 `post`를 사용하므로 자동 재시도 대상이 아니다. 재시도된 원 요청이 또 실패해도 두 번째 갱신은 수행하지 않는다.

### 동시 요청과 늦은 응답

- 여러 요청이 동시에 만료되어도 Refresh API는 한 번만 호출된다.
- 다른 요청이 먼저 갱신했다면 현재 스토어의 새 Access Token으로만 원 요청을 재시도한다.
- 갱신 도중 로그아웃하거나 새로 로그인해 Refresh Token이 바뀌면 이전 갱신 결과는 현재 세션을 덮지 않는다.

### 앱 재실행

SecureStore 복원 후 `/users/me`를 호출한다. Access Token이 만료됐으면 동일한 자동 갱신 경로를 사용하고, 갱신할 수 없으면 Alert 없이 저장 세션을 정리한다.

## 저장 방식

SecureStore의 키별 용량 제한을 피하려고 다음처럼 분리한다.

| 키 | 내용 |
|---|---|
| `auth-storage` | Zustand 메타데이터와 `bio`, 토큰 revision |
| `auth-access-token` | Access Token과 revision |
| `auth-refresh-token` | Refresh Token과 revision |

세 키의 revision이 일치할 때만 토큰 쌍을 복원한다. 일부 쓰기만 성공하면 다음 실행에서 불완전한 세션을 복원하지 않는다. 기존 `auth-storage`의 Access Token 단독 데이터도 읽지만 Refresh Token이 없으므로 만료 시 정상적으로 로그아웃된다.

## 적용 파일

- 계약·에러·재시도: `src/api/auth.ts`
- 분리 저장: `src/store/authStorage.ts`
- 상태·single-flight 갱신: `src/store/useAuthStore.ts`
- REST 연결: `src/api/admin.ts`, `community.ts`, `courses.ts`, `equipment.ts`, `inquiry.ts`, `notification.ts`, `spot.ts`, `spotAlert.ts`, `user.ts`
- 토큰 쌍 최초 저장: `src/screens/auth/LoginScreen.tsx`, `SignupScreen.tsx`

## 후속 작업

- 토큰 만료 시각을 이용한 선제 갱신
- query key의 raw JWT를 사용자 ID 또는 세션 식별자로 교체
- 로그아웃·계정 전환 시 QueryClient 캐시 정리
- STOMP/WebSocket 연결에서 갱신된 Access Token으로 재연결
