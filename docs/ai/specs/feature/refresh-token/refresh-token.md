# Refresh Token 자동 갱신

## 1) 기능 정보

- 기능명: Refresh Token 저장 및 Access Token 자동 갱신
- 담당자: 미정
- 관련 이슈: 없음
- 관련 도메인 (필수): `auth`, `admin`, `community`, `courses`, `equipment`, `inquiry`, `notification`, `spot`, `spotAlert`, `user`, `common`
- 대상 플랫폼: iOS / Android

## 2) 문제와 목표

- 해결하려는 문제: 현재 앱은 인증 API가 401을 반환하면 Access Token을 즉시 삭제해 사용자를 로그아웃시킨다. 백엔드에는 Refresh Token 발급·회전 API가 구현되어 있지만 프론트가 이를 저장하거나 사용하지 않는다.
- 사용자 가치: Access Token이 만료되어도 사용 흐름과 입력 중인 화면을 유지한 채 세션을 이어갈 수 있다.
- 완료 기준(한 줄): 만료된 Access Token 요청이 새 토큰 쌍 발급 후 한 번 자동 재시도되고, 갱신할 수 없는 경우에만 로그아웃된다.

## 3) 범위

- 포함(In Scope):
  - 로그인·회원가입·소셜 로그인 응답의 `refreshToken`, `refreshTokenExpiresIn` 처리
  - `POST /auth/token/refresh` 연동 및 Refresh Token rotation 반영
  - Access Token과 Refresh Token의 SecureStore 영속화
  - `ACCESS_TOKEN_EXPIRED` 응답에 한정한 자동 갱신과 원 요청 1회 재시도
  - 동시에 발생한 만료 응답이 하나의 갱신 Promise를 공유하는 single-flight 처리
  - 갱신 요청 자체의 재시도 제외 및 무한 루프 방지
  - 앱 재실행 시 저장된 토큰 복원과 만료 세션 갱신
  - 갱신 실패 시 인증 상태 정리 및 로그인 만료 안내
  - 실제 백엔드 계약에 맞춘 인증 가이드 문서 갱신
- 제외(Out of Scope):
  - STOMP/WebSocket 채팅 연결 및 재연결
  - 만료 시각 기반 선제 갱신
  - 모든 TanStack Query key에서 JWT 문자열을 제거하는 전면 리팩터링
  - 로그아웃·계정 전환 시 QueryClient 캐시 전체 초기화
  - 백엔드 Refresh Token 발급·회전 정책 변경

## 4) 사용자 시나리오

- 시나리오 A — 사용 중 Access Token 만료:
  - Given: 유효한 Refresh Token과 만료된 Access Token으로 로그인 상태이다.
  - When: 인증이 필요한 REST API가 `401 / ACCESS_TOKEN_EXPIRED`를 반환한다.
  - Then: 앱은 토큰을 한 번 갱신하고 새 Access Token으로 원 요청을 한 번 재시도하며 로그인 상태를 유지한다.
- 시나리오 B — 동시 요청 만료:
  - Given: 동일한 만료 Access Token으로 여러 REST 요청이 진행 중이다.
  - When: 여러 요청이 거의 동시에 `ACCESS_TOKEN_EXPIRED`를 반환한다.
  - Then: Refresh API는 한 번만 호출되고 모든 요청은 같은 갱신 결과를 사용한다.
- 시나리오 C — 갱신 불가:
  - Given: Refresh Token이 없거나 만료·폐기되어 있다.
  - When: Access Token 갱신이 필요하다.
  - Then: 인증 정보를 안전하게 제거하고 사용자에게 세션 만료를 한 번 안내한 뒤 로그인 화면으로 전환한다.
- 시나리오 D — 앱 재실행:
  - Given: 앱을 종료하기 전에 토큰 쌍이 SecureStore에 저장되어 있다.
  - When: 앱이 인증 상태를 복원한다.
  - Then: Access Token이 유효하면 사용자 정보를 복원하고, 만료됐으면 Refresh Token으로 갱신하며, 둘 다 불가능할 때만 조용히 로그아웃한다.

## 5) UI/UX 요구사항

- 참조 목업 파일: 없음
- 화면 전환 규칙: 갱신 성공 시 현재 화면을 유지한다. 갱신 실패로 `accessToken`이 제거될 때만 기존 `RootNavigator` 규칙에 따라 로그인 화면으로 전환한다.
- 빈 상태/에러 상태: Refresh Token이 없거나 갱신이 거절되면 기존 로그인 만료 Alert을 한 번만 표시한다. 앱 초기 복원 중 실패는 Alert 없이 처리한다.
- 로딩 상태: 백그라운드 갱신을 위한 별도 전역 로딩 UI를 표시하지 않는다. 원 요청의 기존 로딩 상태를 유지한다.

## 6) 데이터/API 요구사항

- 사용 API:
  - `src/api/auth.ts` `authApi.refreshToken` (신규): `POST /auth/token/refresh`
  - `src/api/auth.ts` 로그인·회원가입·소셜 로그인 함수: 확장된 `TokenResponse` 사용
  - `src/api/`의 인증 요청 래퍼: 갱신 후 원 요청 재시도
- 요청/응답 핵심 필드:
  - 요청: `{ refreshToken: string }`
  - 응답: `{ tokenType, accessToken, expiresIn, refreshToken, refreshTokenExpiresIn, user }`
  - 만료 판정: HTTP 401이면서 에러 응답의 `code`가 `ACCESS_TOKEN_EXPIRED`인 경우
- 실패 처리 방식:
  - `ACCESS_TOKEN_REQUIRED`, `ACCESS_TOKEN_INVALID` 등 다른 401은 자동 갱신하지 않는다.
  - Refresh API 실패, 응답 파싱 실패 또는 새 토큰 저장 실패 시 토큰을 정리하고 기존 `ApiError` 흐름을 유지한다.
  - 갱신 성공 후에도 원 요청이 실패하면 두 번째 갱신 없이 해당 응답을 그대로 에러로 변환한다.
- 캐싱/무효화 전략(TanStack Query): 기존 전략을 유지한다. 토큰 문자열 기반 query key 정리는 후속 작업으로 분리한다.

## 7) 상태 관리

- 서버 상태: Refresh API 응답은 캐시하지 않고 인증 세션 상태에 즉시 반영한다.
- 클라이언트 상태(Zustand): `accessToken`, `refreshToken`, `user`, `bio`를 관리하고 토큰 쌍을 원자적으로 교체하는 액션을 제공한다.
- 영속화 필요 여부: 필요. SecureStore의 키별 용량 제한을 고려해 Refresh Token은 Access Token이 담긴 기존 JSON 값과 분리된 키에 저장하고, 복원 시 하나의 인증 상태로 조합한다.

## 8) 기술 제약 체크

- [x] UI 변경 없음 (NativeWind 적용 대상 없음)
- [x] `StyleSheet.create()` 미사용
- [x] `@/` alias 사용
- [x] 타입 정의 명확
- [x] 디자인 변경 없음 (디자인 토큰 적용 대상 없음)

## 9) 수용 기준 (Acceptance Criteria)

- [ ] AC1: 모든 로그인 방식의 성공 응답에서 Access/Refresh Token이 저장되고 앱 재실행 후 복원된다.
- [ ] AC2: `ACCESS_TOKEN_EXPIRED`를 받은 인증 REST 요청은 토큰 갱신 성공 후 새 Access Token으로 정확히 한 번 재시도된다.
- [ ] AC3: 동시 만료 응답이 발생해도 이전 Refresh Token 소비 요청은 한 번만 전송된다.
- [ ] AC4: rotation 응답의 새 Refresh Token이 즉시 저장되어 소비된 이전 토큰을 다시 사용하지 않는다.
- [ ] AC5: Refresh 실패 또는 Refresh Token 부재 시에만 인증 상태가 제거되고 만료 안내가 중복 표시되지 않는다.
- [ ] AC6: 로그인 실패나 `ACCESS_TOKEN_REQUIRED`·`ACCESS_TOKEN_INVALID` 등 만료가 아닌 401은 Refresh API를 호출하지 않는다.
- [ ] AC7: 타입 검사와 lint가 통과하고 기존 로그인·회원가입 흐름이 유지된다.

## 10) 테스트 시나리오

- 정상 케이스: 이메일/카카오 로그인 후 토큰 쌍 저장, Access Token 만료 후 자동 갱신 및 원 요청 성공, 앱 재실행 후 세션 복원.
- 경계 케이스: 여러 인증 요청의 동시 만료, 갱신 직후 늦게 도착한 이전 토큰의 401, 204 응답 요청 재시도, 장시간 업로드 요청 재시도.
- 실패 케이스: Refresh Token 없음·만료·재사용, Refresh API 네트워크 오류, 새 토큰 저장 실패, 갱신 후 원 요청 재실패, 만료가 아닌 401.

## 11) 오픈 이슈 / 결정 필요

- 현재 프로젝트에 단위 테스트 러너가 없으므로 이번 작업은 타입 검사·lint와 개발 서버/기기 수동 시나리오로 검증한다. 인증 요청 테스트 인프라 도입은 별도 논의가 필요하다.
- SecureStore 쓰기 실패를 호출자가 감지할 수 있도록 저장 어댑터가 오류를 삼키지 않게 변경하며, 실패 시 불완전한 토큰 쌍을 남기지 않는 정책을 구현 계획에서 구체화한다.

