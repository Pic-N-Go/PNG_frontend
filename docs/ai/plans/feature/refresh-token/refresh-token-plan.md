# Refresh Token 자동 갱신 구현 계획

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/feature/refresh-token/refresh-token.md`
- 관련 도메인 (필수): `auth`, `admin`, `community`, `courses`, `equipment`, `inquiry`, `notification`, `spot`, `spotAlert`, `user`, `common`
- 관련 목업: 없음
- 완료 목표: 백엔드의 회전형 Refresh Token 계약을 프론트 인증 상태와 모든 REST API 요청 경로에 연결해 Access Token 만료가 즉시 로그아웃으로 이어지지 않게 한다.

## 2) 구현 전략

- 핵심 접근:
  - `TokenResponse`와 `ApiError`에 백엔드 응답 필드를 반영하고 Refresh 전용 API는 자동 재시도 경로 밖에 둔다.
  - 인증 요청을 실행하는 공통 유틸리티에 `ACCESS_TOKEN_EXPIRED` 판정, single-flight 갱신, Authorization 헤더 교체, 최대 1회 재시도를 구현한다.
  - API 모듈별 timeout·multipart·응답 처리 차이는 유지하되, 공통 인증 재시도 유틸리티를 사용하도록 기존 fetch 래퍼를 단계적으로 연결한다.
  - Zustand는 Access/Refresh Token을 한 번에 교체하고, rotation 중에는 동일한 갱신 Promise를 공유한다.
  - SecureStore 키별 크기 제한을 피하도록 Refresh Token을 기존 인증 JSON과 별도 키로 저장·복원한다.
- 리스크:
  - 회전형 Refresh Token을 여러 요청이 동시에 소비하면 한 요청을 제외한 나머지가 실패해 강제 로그아웃될 수 있다.
  - Refresh 요청이 일반 401 처리에 들어가면 무한 재시도가 발생할 수 있다.
  - 늦게 끝난 이전 세션 요청이 새 세션을 덮거나 로그아웃시킬 수 있다.
  - 요청 body가 재사용 불가능한 형태이면 업로드 재시도가 실패할 수 있다.
  - SecureStore 일부 쓰기 실패 시 Access/Refresh Token 쌍이 불일치할 수 있다.
- 리스크 완화:
  - 모듈 범위의 단일 Refresh Promise와 요청 당시 토큰 비교를 함께 사용한다.
  - Refresh API는 저수준 fetch를 직접 사용하고 재시도 플래그를 전달하지 않는다.
  - 갱신 결과 적용 전 현재 Refresh Token 및 요청 Access Token이 여전히 같은 세션인지 확인한다.
  - 재시도는 기존 `RequestInit`을 복제 가능한 현재 요청 형태에 한정하고 FormData를 그대로 재사용할 수 있는지 수동 검증한다.
  - 저장 실패를 노출하고 불완전한 인증 상태를 정리한다.

## 3) 작업 태스크 (작게 분할)

### Task 1 - 백엔드 계약 및 에러 타입 반영

- 대상 파일:
  - `src/api/auth.ts`
- 변경 내용:
  - `TokenResponse`에 `refreshToken`, `refreshTokenExpiresIn`을 추가한다.
  - `ApiError`에 백엔드 에러 `code`를 보존하고 `toHttpError`가 본문을 한 번만 안전하게 파싱하도록 정리한다.
  - 자동 재시도를 거치지 않는 `authApi.refreshToken(refreshToken)`을 추가한다.
- 완료 조건: 실제 `POST /auth/token/refresh` 요청·응답과 `ACCESS_TOKEN_EXPIRED` 판정이 타입으로 표현된다.
- 검증 방법: TypeScript 타입 검사 및 백엔드 DTO/에러 응답과 필드 대조.

### Task 2 - 토큰 상태 및 SecureStore 영속화 확장

- 대상 파일:
  - `src/store/useAuthStore.ts`
  - 필요 시 `src/store/authStorage.ts` (신규)
- 변경 내용:
  - `refreshToken` 상태와 토큰 쌍 설정 액션을 추가하고 로그인 화면 호출부가 전체 `TokenResponse`를 저장하도록 변경할 수 있는 인터페이스를 제공한다.
  - Refresh Token을 별도 SecureStore 키에 저장하고 기존 `auth-storage` 상태와 함께 복원한다.
  - clear 동작에서 모든 토큰 키를 제거하고 SecureStore 실패를 감지한다.
  - 재수화 시 Access Token 검증 실패가 `ACCESS_TOKEN_EXPIRED`이면 Refresh를 시도하고, 성공한 새 토큰 쌍과 사용자를 반영한다.
- 완료 조건: 로그인·재수화·로그아웃에서 Access/Refresh Token이 함께 일관된 상태를 유지한다.
- 검증 방법: 앱 재실행, 정상 복원, 만료 Access Token 복원, Refresh Token 없는 기존 저장 데이터 시나리오 수동 확인.

### Task 3 - single-flight 갱신 및 요청 1회 재시도

- 대상 파일:
  - `src/api/auth.ts`
  - 필요 시 `src/api/client.ts` (신규)
  - `src/store/useAuthStore.ts`
- 변경 내용:
  - API 계층과 Zustand 사이 순환 참조를 만들지 않는 콜백 등록 방식으로 토큰 갱신 함수를 연결한다.
  - 동시에 들어온 만료 응답이 하나의 Refresh Promise를 공유하게 한다.
  - 요청 당시 Access Token과 현재 토큰을 비교해 이미 갱신된 경우 최신 토큰을 사용하고, 다른 로그인 세션의 결과는 무시한다.
  - 갱신 성공 시 Authorization 헤더를 바꿔 원 요청을 정확히 한 번 재시도한다.
  - 갱신 실패 시 인증 상태와 저장 토큰을 정리하고 초기 복원 중이 아닐 때만 Alert을 한 번 표시한다.
- 완료 조건: 동시 만료, 늦은 401, Refresh 실패에서 중복 소비·무한 루프·새 세션 로그아웃이 발생하지 않는다.
- 검증 방법: 네트워크 로그로 Refresh 호출 횟수, 재시도 횟수, 사용 토큰을 확인한다.

### Task 4 - 모든 REST API 요청 경로 연결

- 대상 파일:
  - `src/api/admin.ts`
  - `src/api/community.ts`
  - `src/api/courses.ts`
  - `src/api/equipment.ts`
  - `src/api/inquiry.ts`
  - `src/api/notification.ts`
  - `src/api/spot.ts`
  - `src/api/spotAlert.ts`
  - `src/api/user.ts`
- 변경 내용:
  - 각 모듈의 인증 fetch 래퍼를 공통 갱신/재시도 흐름에 연결한다.
  - 비인증 요청은 기존과 동일하게 동작하게 하고 도메인별 timeout, 204, JSON, multipart 처리 방식을 유지한다.
  - 더 이상 단순 401만으로 즉시 로그아웃시키는 부수효과에 의존하지 않게 한다.
- 완료 조건: 현재 `fetch`를 직접 사용하는 모든 API 모듈에서 동일한 만료 처리 규칙이 적용된다.
- 검증 방법: `rg`로 직접 fetch 및 `toHttpError` 호출부를 재점검하고 대표 GET·POST·PATCH·DELETE·multipart 요청을 수동 검증한다.

### Task 5 - 로그인 진입점 및 문서 동기화

- 대상 파일:
  - `src/screens/auth/LoginScreen.tsx`
  - `src/screens/auth/SignupScreen.tsx`
  - `docs/guide/api/token-refresh-plan.md`
  - `docs/guide/api/auth-api.md`
  - `docs/guide/api/auth-integration.md`
- 변경 내용:
  - 이메일 로그인·카카오 로그인·회원가입 성공 시 전체 토큰 쌍을 저장한다.
  - 문서의 "백엔드 미구현", Access Token 단독 응답, 즉시 로그아웃 설명을 현재 구현으로 갱신한다.
  - 실제 endpoint, rotation, 만료 코드별 동작과 Out of Scope 항목을 기록한다.
- 완료 조건: 세 로그인 진입점이 Refresh Token을 누락하지 않고 문서와 코드 계약이 일치한다.
- 검증 방법: 각 로그인 흐름의 상태 확인 및 문서의 endpoint/필드 검색.

### Task 6 - 정적 검증 및 수동 회귀 테스트

- 대상 파일:
  - 변경 파일 전체
- 변경 내용:
  - 타입 오류, lint 오류, 누락된 직접 fetch 경로를 정리한다.
  - 정상·동시 만료·앱 재실행·갱신 실패·로그인 실패·업로드 재시도 시나리오를 실행한다.
- 완료 조건: 수용 기준이 충족되고 기존 인증 및 대표 API 흐름에 회귀가 없다.
- 검증 방법:
  - `pnpm exec tsc --noEmit`
  - `pnpm lint`
  - 실제 기기 또는 에뮬레이터 네트워크 로그를 이용한 수동 검증

## 4) 검증 체크포인트

- [x] Type check 통과 (`pnpm exec tsc --noEmit`)
- [x] Lint 통과 (`pnpm lint`)
- [ ] 주요 사용자 시나리오 수동 검증
- [ ] 회귀 영향 범위 점검
- [ ] 동시 만료 시 Refresh API가 한 번만 호출되는지 확인
- [ ] rotation 이후 이전 Refresh Token이 다시 저장·사용되지 않는지 확인
- [ ] 갱신 요청과 원 요청 재실패가 무한 루프를 만들지 않는지 확인

## 5) 롤백 계획

- 영향 파일: 인증 API·스토어·로그인 화면, 직접 fetch를 사용하는 9개 API 모듈, 인증 가이드 문서.
- 되돌림 방법: Refresh Token 관련 커밋을 역순으로 revert해 기존 `401 → clearAuth()` 처리로 복구한다. 사용자 소유의 기존 변경과 APK 로그는 건드리지 않는다.
- 데이터 영향: 별도 SecureStore Refresh Token 키는 롤백 버전에서 읽지 않으므로 기능상 영향은 없지만, 필요하면 이후 정상 로그아웃 또는 앱 데이터 초기화 시 제거한다. 서버 데이터 변경은 없다.

## 6) PR 구성

- PR 제목(컨벤션): `feat: Refresh Token 자동 갱신 연동`
- 변경 요약(3줄 이내):
  - 로그인 응답의 Refresh Token을 SecureStore에 저장하고 rotation 응답으로 교체한다.
  - Access Token 만료 시 single-flight 갱신 후 REST 요청을 한 번 자동 재시도한다.
  - 인증 가이드와 실제 백엔드 endpoint·응답 계약을 동기화한다.
- 리뷰 요청 포인트:
  - 동시 401에서 Refresh Token이 한 번만 소비되는지
  - 늦은 이전 요청 응답이 새 로그인 세션을 변경하지 않는지
  - 모든 직접 fetch 모듈이 재시도 흐름에 포함되고 Refresh 요청은 제외됐는지
  - SecureStore 키 분리와 쓰기 실패 처리에 불완전한 토큰 쌍이 남지 않는지
