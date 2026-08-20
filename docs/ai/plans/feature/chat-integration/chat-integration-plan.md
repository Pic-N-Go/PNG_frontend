# 실시간 스팟 채팅 연동 구현 계획

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/feature/chat-integration/chat-integration.md`
- 관련 도메인 (필수): `chat`, `auth`, `spot`
- 관련 목업: `src/components/ui/spot/spot-detail.html`
- 완료 목표: 기존 채팅 목업을 유지하면서 백엔드 REST·STOMP 채팅과 Refresh Token 재연결을 연결한다.

## 2) 구현 전략

- 핵심 접근: REST 초기 상태는 TanStack Query, 실시간 수명주기는 전용 훅, 인증 갱신은 기존 auth store single-flight 로직을 재사용한다.
- 리스크: REST 조회와 실시간 이벤트 경쟁으로 중복·누락이 발생할 수 있고, 만료 STOMP 오류는 문자열 계약이다.
- 리스크 완화: 먼저 구독을 활성화하고 메시지 ID로 병합하며, 만료 문구에만 재전송을 허용하고 재시도 횟수를 1회로 제한한다.

## 3) 작업 태스크 (작게 분할)

### Task 1 - 타입/계약 및 의존성 정리

- 대상 파일: `package.json`, `pnpm-lock.yaml`, `src/types/chat.ts`
- 변경 내용: `@stomp/stompjs` 추가, 백엔드 DTO와 연결 상태 타입 정의.
- 완료 조건: STOMP 클라이언트와 채팅 타입을 `any` 없이 사용할 수 있다.
- 검증 방법: TypeScript 컴파일.

### Task 2 - REST API 연결

- 대상 파일: `src/api/chat.ts`, `src/hooks/useChat.ts`
- 변경 내용: 최근 메시지와 참여자 수를 기존 인증 재시도 래퍼로 조회하고 spotId별 query key로 캐시.
- 완료 조건: 초기 채팅 데이터가 인증 만료 자동 갱신을 포함해 조회된다.
- 검증 방법: 타입 검사 및 Android 개발 빌드 수동 조회.

### Task 3 - STOMP 및 인증 갱신 연결

- 대상 파일: `src/store/useAuthStore.ts`, `src/hooks/useChat.ts`
- 변경 내용: 기존 session revision·single-flight를 보존하는 공개 갱신 액션, 연결·구독·입장·전송·퇴장·만료 재연결 구현.
- 완료 조건: 최신 토큰이 CONNECT/SEND에 사용되고 만료 전송이 갱신 후 최대 한 번 재시도된다.
- 검증 방법: 짧은 Access Token 만료 설정으로 Redis rotation과 재전송 확인.

### Task 4 - 목업 UI 실데이터 전환

- 대상 파일: `src/components/spot/ChatTab.tsx`, `src/screens/spot/SpotDetailScreen.tsx`, `src/types/spot.ts`
- 변경 내용: 목 데이터 제거, 실제 메시지·참여자 수·연결 상태 적용, spotId/spotName 전달, 사진 버튼 비활성화.
- 완료 조건: 목업 구조를 유지하며 실제 채팅이 표시되고 입력 제한·빈/로딩/오류 상태가 동작한다.
- 검증 방법: 두 클라이언트 송수신과 360~430dp 화면 확인.

## 4) 검증 체크포인트

- [x] Type check 통과 (`node_modules/.bin/tsc.CMD --noEmit`)
- [x] Lint 통과 (`pnpm lint`)
- [ ] 주요 사용자 시나리오 수동 검증
- [ ] 회귀 영향 범위 점검

## 5) 롤백 계획

- 복원할 기존 파일:
  - `package.json`
  - `pnpm-lock.yaml`
  - `src/store/useAuthStore.ts`
  - `src/components/spot/ChatTab.tsx`
  - `src/screens/spot/SpotDetailScreen.tsx`
  - `src/types/spot.ts`
- 제거할 신규 파일:
  - `src/types/chat.ts`
  - `src/api/chat.ts`
  - `src/hooks/useChat.ts`
- 되돌림 방법: 신규 채팅 파일을 제거하고, 변경된 기존 파일을 채팅 연동 이전 상태로 복원한 뒤 의존성을 다시 설치한다.
- 데이터 영향: 없음. 서버 메시지 및 기존 인증 저장 형식은 변경하지 않는다.

## 6) PR 구성

- PR 제목(컨벤션): `feat: 스팟 실시간 채팅 연동`
- 변경 요약(3줄 이내): REST 최근 메시지와 STOMP 실시간 채팅 연결, Refresh Token 만료 복구, 목업 UI 실데이터 전환.
- 리뷰 요청 포인트: STOMP 수명주기 정리, 세션 revision 보호, REST/실시간 메시지 중복 제거, 목업 일치 여부.
