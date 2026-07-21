# 기능 스펙 — 1:1 문의 인앱 스레드형 (5a)

## 1) 기능 정보

- 기능명: 1:1 문의 인앱 스레드형 (5a) — 문의 내역 리스트 / 상세 스레드 / 문의 작성(v2)
- 담당자: 미정
- 관련 이슈: 없음
- 대상 플랫폼: iOS / Android

## 2) 문제와 목표

- 해결하려는 문제: 현재 `ContactScreen`은 문의 작성 폼 하나만 있고 제출 후 그냥 뒤로 가기만 한다 (내역 확인 불가). 이걸 "내역 리스트 → 상세 스레드 → 새로 작성" 3단계 플로우로 바꿔서, 문의 상태(답변 대기/완료)와 답변 내용을 앱 안에서 계속 확인할 수 있게 한다.
- 사용자 가치: 문의를 보낸 뒤에도 답변 여부/내용을 이메일이 아니라 앱에서 바로 확인. 여러 건의 문의 이력을 한 화면에서 관리.
- 완료 기준(한 줄): 환경설정 › "1:1 문의"로 들어가면 문의 내역 리스트가 뜨고, 카드를 탭하면 스레드 상세로, "+"를 탭하면 새 문의 작성 화면으로 이동하며, 작성 후 리스트 최상단에 반영된다.

## 3) 범위

- 포함(In Scope):
  - `src/screens/mypage/InquiryListScreen.tsx` 신규 — `문의 내역.native.jsx` 반영 (상태 필터, 카드 리스트, unread dot, empty/loading/error 상태)
  - `src/screens/mypage/InquiryDetailScreen.tsx` 신규 — `문의 상세.native.jsx` 반영 (스레드 말풍선, 상태 배지, 답변완료/대기 하단 영역)
  - `src/screens/mypage/ComposeInquiryScreen.tsx` 신규 — `문의하기.native.jsx (v2)` 반영 (진입 경로/안내 문구 변경, 제출 후 리스트로 복귀)
  - `src/screens/mypage/ContactScreen.tsx` **삭제** — 3개 화면으로 완전히 대체됨 (더 이상 쓰이지 않는 스텁)
  - `src/hooks/useInquiries.ts` 신규 — 로컬 `useState` 기반, `useNotificationSettings.ts`와 동일한 작성 관례(상단 TODO 코멘트, `initial?` 병합, named setter들)
  - `src/navigation/stacks/MyPageStack.tsx` — `Contact` 라우트 제거, `Inquiry` / `InquiryDetail` / `ComposeInquiry` 라우트 추가
  - `src/screens/mypage/SettingScreen.tsx` — "1:1 문의" 행 `onPress`를 `navigate('Contact')` → `navigate('Inquiry')`로 변경, unread 개수 배지 추가
  - 문의 유형 선택은 기존 `src/components/common/OptionSheet.tsx`(범용 select-sheet, 이미 존재) 재사용. 유형 mock 목록: `기능 문의 · 결제/환불 · 앱 오류 신고 · 계정 · 기타`
  - 모든 신규 컴포넌트는 NativeWind `className` + `normalize()`/`normalizeFontSize()` 조합으로 작성 (참고 `.native.jsx`의 인라인 style 그대로 포팅 금지 — 이전 라운드와 동일한 결정)
- 제외(Out of Scope):
  - **API 연동**: `useInquiries.ts`는 로컬 `useState`만 사용. 목록/상세/전송 모두 실제 네트워크 호출 없음.
  - **AsyncStorage 도입**: 스펙 원문은 "서버 unread 필드가 없으면 로컬 저장(AsyncStorage)에서 관리"라고 되어 있지만, 이 레포에는 `AsyncStorage`가 설치돼 있지 않다. 이번 라운드는 애초에 API/영속화 자체가 범위 밖이므로, unread 상태는 `useInquiries` 훅의 **런타임 in-memory state**로만 관리한다 (앱을 껐다 켜면 초기 mock 상태로 리셋됨). API 연동 라운드에서 서버가 `unread` 필드를 내려주면 이 훅 로직을 그대로 교체하면 되고, 그래도 클라이언트 로컬 영속화가 필요하면 그때 `AsyncStorage`(또는 이미 쓰는 다른 저장소)를 추가 의존성으로 도입한다.
  - **문의 유형 시트 세부 스펙**: 유형 목록은 기획팀 확정 전 mock. `OptionSheet`를 그대로 재사용하고 목록만 mock 배열로 둔다.
  - **답변 알림(푸시) 연동**
  - **첨부 파일(이미지) 업로드**
  - **"해결됐어요"/"추가 문의" 버튼의 실제 동작**: 백엔드 미확정 — 토스트만 띄우고 `// TODO` 코멘트로 남긴다.

## 4) 사용자 시나리오

- 시나리오 A — 문의 내역 진입 및 필터:
  - Given: 사용자가 환경설정 › "1:1 문의"를 탭한다.
  - When: `InquiryListScreen`이 뜬다.
  - Then: 상태 필터(전체/답변 완료/답변 대기) pill과 카운트, 카드 리스트(배지+시간+제목+요약, 답변완료면 답변 미리보기까지)가 보인다. "답변 완료" 필터를 탭하면 해당 항목만 보인다.
- 시나리오 B — 상세 진입 및 unread 해제:
  - Given: unread 표시가 있는 "답변 완료" 카드가 있다.
  - When: 카드를 탭해 `InquiryDetail`로 이동한다.
  - Then: 스레드(내 메시지 우측 말풍선 + 운영팀 답변 좌측 말풍선)와 "이 답변이 도움이 되셨나요?" 카드가 보이고, 리스트로 돌아오면 해당 카드의 unread dot이 사라져 있다.
- 시나리오 C — 새 문의 작성:
  - Given: 리스트 화면에서 "+"를 탭했다.
  - When: `ComposeInquiryScreen`에서 유형 선택(OptionSheet) + 내용 작성 후 "문의 보내기"를 탭한다.
  - Then: 리스트로 돌아가고, 방금 작성한 문의가 최상단에 "답변 대기" 상태로 보인다.
- 시나리오 D — 빈 상태:
  - Given: 문의 내역이 하나도 없다.
  - When: `InquiryListScreen`에 진입한다.
  - Then: 중앙 안내 문구 + "새 문의 작성하기" CTA가 보인다.

## 5) UI/UX 요구사항

- 참조 목업 파일 (인라인 style, 데이터 구조만 참고하고 그대로 포팅 금지): `/Users/yeeun/Downloads/위시리스트 방해금지 설정 통합/문의 내역.native.jsx`, `문의 상세.native.jsx`, `문의하기.native.jsx`
- 화면 전환 규칙 (사용자 제공 라우팅 다이어그램 그대로):
  ```
  Settings
    └─ Inquiry (신규)                ← 문의 내역.native.jsx
        ├─ InquiryDetail (신규)      ← 문의 상세.native.jsx
        └─ ComposeInquiry (v2)       ← 문의하기.native.jsx
  ```
  - `SettingScreen`: "1:1 문의" `onPress` → `navigation.navigate('Inquiry')`
  - `InquiryListScreen`: `onCompose` → `navigation.navigate('ComposeInquiry')`, `onOpen(id)` → `navigation.navigate('InquiryDetail', { id })`
  - `ComposeInquiryScreen`: `onSubmit` 성공 → `navigation.goBack()` (리스트 최상단에 새 `pending` 항목 반영)
- 상태 규칙 (state prop, 화면마다 공통 인터페이스로 받되 로컬 구현이라 실제로는 `normal`만 발생 — 셸은 분기 유지):
  - `InquiryListScreen`: `normal` / `empty` / `loading` / `error`
  - `InquiryDetailScreen`: `normal` / `loading` / `error`
  - `ComposeInquiryScreen`: 상태 분기 없음 (원본과 동일)
- 디자인 디테일 유지 (임의 수정 금지):
  - 말풍선 border-radius 비대칭: 내 메시지 `16-16-4-16`(우측 하단 각짐 = 꼬리), 상대 답변 `16-16-16-4`(좌측 하단 각짐)
  - unread dot: 브랜드 컬러 8×8 원, 카드 우상단
  - 상태 배지: 답변 완료 = 초록(`bg #e0f0dc`, `text #5a9855`), 답변 대기 = 회색(`bg/#f5f5f7`, `text #8a8a8e`)
  - 필터 pill 활성 상태 = 브랜드 컬러 배경 + 흰 글자
- 문의 유형 선택: `ComposeInquiryScreen`의 "문의 유형" 행 탭 → 기존 `OptionSheet` 컴포넌트(`src/components/common/OptionSheet.tsx`) 오픈. `options`는 mock 배열 `['기능 문의', '결제/환불', '앱 오류 신고', '계정', '기타']`.

## 6) 데이터/API 요구사항

- 사용 API: 없음 (Out of Scope)
- 타입 (호환 목적, 사용자 제공 스키마 그대로):
  ```ts
  interface Inquiry {
    id: string;
    category: string;
    title: string;
    preview: string;
    answerPreview?: string;
    status: 'pending' | 'answered';
    unread?: boolean;
    timeText: string;
    createdAt: string;
    my: { text: string; timeText: string };
    replies: Array<{ text: string; timeText: string; staffName?: string }>;
  }
  ```
- 실패 처리 방식: N/A (로컬 상태만, 항상 성공)
- 캐싱/무효화 전략: N/A

## 7) 상태 관리

- 서버 상태: 없음 (이번 라운드 범위 밖)
- 클라이언트 상태: `src/hooks/useInquiries.ts`에서 `useState<Inquiry[]>`로 관리. 노출 API:
  - `inquiries: Inquiry[]`
  - `unreadCount: number` (파생값, `answered && unread` 개수)
  - `addInquiry(category, message)` — 새 `pending` 항목을 배열 맨 앞에 추가
  - `markRead(id)` — 해당 항목 `unread: false`
  - `getById(id)` — 상세 화면용 조회
  - 파일 상단에 `// TODO: 백엔드 문의 API 스펙 확정 후 TanStack Query(useQuery/useMutation)로 교체` 코멘트
- 영속화 필요 여부: 없음 (in-memory, 앱 재시작 시 mock 초기값으로 리셋 — Out of Scope의 AsyncStorage 결정 참고)

## 8) 기술 제약 체크

- [x] NativeWind `className`만 사용 (참고 파일 인라인 style은 데이터 구조만 참고)
- [x] `StyleSheet.create()` 미사용
- [x] `@/` alias 사용
- [x] 타입 정의 명확 (`Inquiry`, 훅 반환 타입 등 `any` 없이)
- [x] 디자인 토큰 준수 (`#E31B59`, 카드 radius 등). 말풍선 비대칭 radius는 의도된 예외로 유지

## 9) 수용 기준 (Acceptance Criteria)

- [ ] AC1: `SettingScreen`의 "1:1 문의" 탭 → `InquiryListScreen`으로 이동한다 (`Contact` 라우트는 더 이상 존재하지 않음).
- [ ] AC2: 리스트 화면에서 상태 필터(전체/답변 완료/답변 대기) 탭 시 카운트와 필터링이 정확하다.
- [ ] AC3: 카드 탭 → `InquiryDetail`로 `id` 파라미터와 함께 이동하고, 스레드(내 메시지/답변)와 말풍선 비대칭 radius가 정확히 렌더링된다.
- [ ] AC4: unread 카드는 상세 진입 시 `markRead`가 호출되어, 리스트로 복귀하면 dot이 사라진다.
- [ ] AC5: "+"(작성) 탭 → `ComposeInquiryScreen` → 유형 선택(`OptionSheet`) + 내용 작성 후 "문의 보내기" → 리스트로 복귀 → 새 항목이 최상단에 `pending`으로 보인다.
- [ ] AC6: 유형 또는 내용 중 하나라도 비어 있으면 "문의 보내기"가 비활성화된다.
- [ ] AC7: `SettingScreen`의 "1:1 문의" 행에 unread 개수 배지가 노출된다 (0이면 배지 숨김).
- [ ] AC8: `src/screens/mypage/ContactScreen.tsx`가 삭제되어 있고, 어디서도 import되지 않는다.
- [ ] AC9: `pnpm exec tsc --noEmit`, `pnpm lint` 통과.

## 10) 테스트 시나리오

- 정상 케이스: 시나리오 A~D 모두 정상 동작
- 경계 케이스: 문의 내역 0건(empty 상태), 답변 대기만 있는 경우(필터 카운트 0 처리)
- 실패 케이스: 유형/내용 미입력 시 제출 버튼 비활성 (전송 자체가 항상 성공하므로 실패 케이스는 해당 없음)

## 11) 오픈 이슈 / 결정 필요

모두 확정됨 (기본안 채택, 재확인 불필요한 수준의 구현 세부사항):

1. **AsyncStorage 미도입** → 확정: 신규 의존성 추가 없이 `useInquiries` 훅의 in-memory `useState`로만 unread 처리. 실제 영속화는 API 연동 라운드에서.
2. **파일 위치** → 확정: `src/screens/mypage/` 평평한 구조 그대로 (하위 폴더 신설 없음), 기존 관례와 동일.
3. **문의 유형 시트** → 확정: 신규 컴포넌트 만들지 않고 기존 `OptionSheet` 재사용.

---

## 작성 시 참고 문서

- 화면 구조/네비게이션: `docs/guide/dev/ui-publishing.md`
- 구현 규칙/디자인 제약: `CLAUDE.md`
- 프론트 구현 기준: `docs/guide/dev/development-guide.md`
- 이전 라운드 관례: `docs/ai/specs/main/dnd-settings-integration.md`
