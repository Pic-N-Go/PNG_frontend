# 실시간 스팟 채팅 연동

## 1) 기능 정보

- 기능명: 스팟 상세 채팅 실시간 연동
- 담당자: 미정
- 관련 이슈: 없음
- 관련 도메인 (필수): `chat`, `auth`, `spot`
- 대상 플랫폼: iOS / Android

## 2) 문제와 목표

- 해결하려는 문제: 스팟 상세의 채팅 탭이 목 데이터와 로컬 append만 사용해 다른 사용자와 메시지를 주고받을 수 없다.
- 사용자 가치: 스팟별 최근 대화를 확인하고 실시간으로 참여자와 대화하며, Access Token이 만료돼도 화면을 유지한 채 채팅을 계속할 수 있다.
- 완료 기준(한 줄): 목업 UI를 유지하면서 REST 채팅 내역과 STOMP 실시간 메시지·참여자 수를 표시하고 인증 만료 시 자동 갱신 후 연결을 복구한다.

## 3) 범위

- 포함(In Scope):
  - 최근 메시지 50개와 현재 참여자 수 REST 조회
  - STOMP 연결, 메시지·참여자 수 구독, 입장·퇴장, 텍스트 메시지 전송
  - 메시지 ID 기반 REST/실시간 응답 병합 및 중복 제거
  - CONNECT와 모든 SEND에 최신 Access Token 적용
  - STOMP Access Token 만료 시 기존 회전형 Refresh Token single-flight 흐름 재사용
  - 갱신 성공 시 재연결·재구독·재입장과 명시적으로 실패한 메시지 1회 재전송
  - 앱 백그라운드/포그라운드 및 네트워크 단절에 따른 연결 상태 처리
  - 기존 `spot-detail.html` 채팅 UI 구조·색상·수치 유지
- 제외(Out of Scope):
  - 이미지 메시지 전송
  - 50개 이전 메시지 페이지네이션
  - 읽음 표시, 메시지 수정·삭제, 신고
  - 일반 네트워크 단절 시 전송 성공 여부가 불명확한 메시지 자동 재전송
  - 백엔드 STOMP 오류 응답 형식 변경

## 4) 사용자 시나리오

- 시나리오 A — 채팅방 진입:
  - Given: 로그인한 사용자가 스팟 상세를 보고 있다.
  - When: 채팅 탭을 연다.
  - Then: 최근 메시지와 참여자 수가 표시되고 STOMP 구독·입장이 완료된다.
- 시나리오 B — 메시지 전송:
  - Given: 채팅 연결이 완료되고 입력창에 유효한 텍스트가 있다.
  - When: 전송 버튼 또는 키보드 전송을 누른다.
  - Then: `/app/chats/{spotId}/messages`로 전송되고 서버가 브로드캐스트한 응답이 내 메시지 스타일로 한 번 표시된다.
- 시나리오 C — Access Token 만료:
  - Given: 유효한 Refresh Token과 만료된 Access Token으로 채팅방에 참여 중이다.
  - When: 메시지 전송이 토큰 만료로 거부된다.
  - Then: 토큰 쌍을 한 번 갱신하고 새 토큰으로 재연결한 뒤 실패한 메시지를 최대 한 번 다시 전송한다.
- 시나리오 D — 갱신 불가:
  - Given: Refresh Token이 없거나 사용할 수 없다.
  - When: 채팅 인증 갱신이 필요하다.
  - Then: 기존 인증 만료 정책에 따라 세션을 정리하고 로그인 화면으로 전환한다.

## 5) UI/UX 요구사항

- 참조 목업 파일: `src/components/ui/spot/spot-detail.html`
- 화면 전환 규칙: 채팅 탭 진입 시 연결하고 다른 탭 또는 화면으로 이동하면 퇴장·연결 해제한다.
- 빈 상태/에러 상태: 메시지가 없으면 안내 문구를 표시하고, 연결 실패 시 입력을 비활성화한 채 재연결 상태를 보여준다.
- 로딩 상태: 초기 내역을 가져오는 동안 중앙 로더를 표시하되 기존 헤더와 입력창 구조는 유지한다.
- 목업의 채팅 헤더, 말풍선, 아바타, 시간, 입력창 크기·색상·간격을 유지한다.
- 백엔드 미지원인 사진 버튼은 시각적 구조를 유지하되 비활성 상태로 제공한다.

## 6) 데이터/API 요구사항

- 사용 API:
  - `GET /chats/{spotId}/messages`
  - `GET /chats/{spotId}/participants/count`
  - WebSocket `/ws`
  - STOMP `/app/chats/{spotId}/enter|leave|messages`
  - STOMP `/topic/chats/{spotId}`, `/topic/chats/{spotId}/participants/count`
- 요청/응답 핵심 필드: 메시지 전송 `{ content }`, 응답 `{ id, senderId, senderNickname, type, content, createdAt }`.
- 실패 처리 방식: REST는 `fetchWithAuthRetry`, STOMP 만료는 인증 스토어의 동일한 single-flight 갱신을 사용한다. 일반 연결 오류는 메시지를 자동 재전송하지 않는다.
- 캐싱/무효화 전략(TanStack Query): REST로 조회한 최근 메시지와 참여자 수를 spotId별 query key로 캐시한다. STOMP 메시지와 참여자 수는 `useChat`의 로컬 상태에 저장하고, 렌더링 시 REST 조회 결과와 병합한다. STOMP 연결 완료 후 `['chat', spotId]` query prefix를 무효화해 서버 상태를 다시 동기화한다.

## 7) 상태 관리

- 서버 상태: REST로 조회한 메시지와 참여자 수를 TanStack Query에 저장한다.
- 실시간 상태: STOMP로 수신한 메시지·참여자 수와 연결 상태를 `useChat`의 로컬 state에서 관리하고 렌더링 시 서버 상태와 병합한다.
- 클라이언트 전역 상태(Zustand): 기존 인증 토큰과 세션 revision만 사용하며 채팅 전용 전역 store는 추가하지 않는다.
- 영속화 필요 여부: 없음. 메시지는 서버에서 다시 조회한다.

## 8) 기술 제약 체크

- [x] `StyleSheet.create()` 미사용
- [x] `@/` alias 사용
- [x] 타입 정의 명확
- [x] 디자인 토큰 준수 (`#E31B59`, 목업 수치 변환)
- [x] API 로직과 화면 로직 분리

## 9) 수용 기준 (Acceptance Criteria)

- [ ] AC1: 채팅 탭에서 해당 스팟의 최근 메시지와 실시간 참여자 수가 표시된다.
- [ ] AC2: CONNECT 및 모든 SEND에 최신 Access Token이 포함되고 다른 방·미입장 전송이 발생하지 않는다.
- [ ] AC3: 텍스트 메시지가 서버 저장·브로드캐스트 결과를 기준으로 중복 없이 표시된다.
- [ ] AC4: Access Token 만료 시 Refresh Token rotation 후 재연결되고 실패 메시지는 최대 한 번 재전송된다.
- [ ] AC5: 탭 이탈·화면 종료·앱 백그라운드 시 채팅방 참여 상태가 정리된다.
- [ ] AC6: 목업의 채팅 UI 구조와 디자인이 유지된다.
- [ ] AC7: `pnpm exec tsc --noEmit`과 `pnpm lint`가 통과한다.

## 10) 테스트 시나리오

- 정상 케이스: 초기 조회, 입장, 두 기기 실시간 송수신, 참여자 수 변경, 퇴장.
- 경계 케이스: 빈 메시지, 1,000자, 1,001자 입력 차단, REST와 실시간 응답 중복, 빠른 탭 전환.
- 실패 케이스: Access Token 만료, Refresh Token 만료, 서버 중단, 네트워크 단절, 재연결 중 전송.

## 11) 오픈 이슈 / 결정 필요

- STOMP 오류는 안정적인 `code` 대신 메시지 문자열을 사용하므로 현재 백엔드 문구를 만료 판별의 호환 경로로 사용한다. 향후 구조화된 오류 코드가 제공되면 교체한다.
- 서버는 텍스트 메시지만 지원하므로 사진 첨부는 후속 작업으로 유지한다.
