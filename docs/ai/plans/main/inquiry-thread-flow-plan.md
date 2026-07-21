# 구현 계획 — 1:1 문의 인앱 스레드형 (5a)

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/main/inquiry-thread-flow.md`
- 관련 참고: `useNotificationSettings.ts`(훅 작성 관례), `OptionSheet.tsx`(select-sheet 재사용), 이전 라운드 `dnd-settings-integration-plan.md`
- 완료 목표: `useInquiries` 훅 + `InquiryListScreen`/`InquiryDetailScreen`/`ComposeInquiryScreen` 3개 화면 + 라우팅 교체 + `ContactScreen` 삭제, `tsc`/`lint` 통과

## 2) 구현 전략

- 핵심 접근: 참고 `.native.jsx` 3개 파일의 데이터 구조/상태 규칙/인터랙션 순서를 그대로 가져오되, 스타일은 인라인 style 객체 대신 `className` + `normalize()`(고정 px만)로 변환한다. 문의 유형 선택은 새 컴포넌트를 만들지 않고 기존 `OptionSheet.tsx`를 그대로 재사용한다. `useInquiries.ts`는 `useNotificationSettings.ts`가 세운 관례(상단 TODO 헤더 + `useState` + named setter)를 그대로 따른다.
- 리스크:
  1. 참고 파일 스타일(인라인 객체) vs 프로젝트 컨벤션(NativeWind) 충돌 — 이전 라운드에서 이미 정리된 변환 규칙을 그대로 적용.
  2. `ContactScreen` 삭제 시 다른 파일에서의 잔여 참조(`import`, 라우트 타입) 누락 위험.
  3. `unread` 상태가 in-memory라 화면 전환/앱 재시작 시 리셋되는 것을 "정상"으로 간주해야 함 — 리뷰 시 오해 소지.
  4. `OptionSheet`의 `selected: string`(필수, `undefined` 불가) 타입과 `ComposeInquiryScreen`의 "아직 선택 안 함" 상태를 맞추는 부분 — 빈 문자열 `''`로 매핑해서 처리.
- 리스크 완화:
  1. Task마다 완료 조건에 "className 우선, normalize()는 고정 px만" 명시 (이전 라운드와 동일).
  2. Task 5에서 `grep -rn "ContactScreen\|'Contact'" src/`로 잔여 참조 확인을 완료 조건에 포함.
  3. 스펙 Out of Scope에 명시된 내용을 PR 설명에도 반복 — 리뷰 포인트로 남김.
  4. `ComposeInquiryScreen`에서 `selectedType` 로컬 state 초기값을 `''`로 두고 `OptionSheet`엔 `selected={selectedType}`, "선택 안 됨" 판정은 `!selectedType`으로 처리.

## 3) 작업 태스크 (작게 분할)

### Task 1 — `useInquiries.ts` 훅 신규

- 대상 파일:
  - `src/hooks/useInquiries.ts` (신규)
- 변경 내용:
  - `Inquiry` 타입 export (스펙 6번 섹션 그대로)
  - mock 초기 데이터 2~3건 (답변 완료 unread 1건 포함, 답변 대기 1건 포함 — 필터/뱃지/unread 케이스를 화면에서 바로 검증할 수 있도록)
  - `useState<Inquiry[]>`로 관리, 반환: `inquiries`, `unreadCount`, `addInquiry(category, message)`, `markRead(id)`, `getById(id)`
  - 파일 상단 `// TODO: 백엔드 문의 API 스펙 확정 후 TanStack Query로 교체` 코멘트
- 완료 조건: 훅을 import해서 초기 mock 배열/`unreadCount`를 렌더링하는 정도의 타입 체크 통과
- 검증 방법: `pnpm exec tsc --noEmit`

### Task 2 — `InquiryListScreen.tsx` 신규

- 대상 파일:
  - `src/screens/mypage/InquiryListScreen.tsx` (신규)
- 변경 내용:
  - nav(뒤로 + "1:1 문의" + 우측 "+"), 상태 필터 pill(전체/답변 완료/답변 대기 + 카운트), 카드 리스트(`InquiryCard`: 배지+시간+제목+요약+답변 미리보기, unread dot)
  - `state` prop(`normal`/`empty`/`loading`/`error`) 분기 유지, `useInquiries()`로 데이터 연결
  - 카드 탭 시 `markRead(id)` 호출 후 `navigation.navigate('InquiryDetail', { id })`
  - "+" 탭 시 `navigation.navigate('ComposeInquiry')`
  - `className` + `normalize()`/`normalizeFontSize()`로 작성
- 완료 조건: 필터 탭 시 카운트/목록이 정확히 바뀌고, empty/loading/error 셸이 분기별로 렌더링된다.
- 검증 방법: `pnpm exec tsc --noEmit`, `pnpm lint`

### Task 3 — `InquiryDetailScreen.tsx` 신규

- 대상 파일:
  - `src/screens/mypage/InquiryDetailScreen.tsx` (신규)
- 변경 내용:
  - nav(뒤로 + 카테고리명 중앙), 상태 배지 + 생성 시각, 내 메시지 말풍선(우측, `BRAND_SOFT` 배경, radius `16-16-4-16`), 운영팀 답변 말풍선(좌측, `CARD` 배경, radius `16-16-16-4`)
  - 답변 완료: 하단 "이 답변이 도움이 되셨나요?" 카드 + `해결됐어요`/`추가 문의` 버튼 → 각각 토스트만 띄우고 `// TODO: 백엔드 확정 후 실제 처리` 코멘트
  - 답변 대기: 하단 안내 문구만
  - `useInquiries().getById(route.params.id)`로 데이터 조회, `state` prop(`normal`/`loading`/`error`) 분기 유지
- 완료 조건: 말풍선 비대칭 radius가 정확히 적용되고, 답변 완료/대기 상태에 따라 하단 영역이 올바르게 갈린다.
- 검증 방법: `pnpm exec tsc --noEmit`, `pnpm lint`

### Task 4 — `ComposeInquiryScreen.tsx` 신규 (v2, `OptionSheet` 연동)

- 대상 파일:
  - `src/screens/mypage/ComposeInquiryScreen.tsx` (신규)
- 변경 내용:
  - 기존 `ContactScreen.tsx`의 레이아웃(nav, 안내 배너, 문의 유형 행, 문의 내용 TextInput+카운터, CTA)을 그대로 가져오되 안내 문구를 "답변은 리스트에서 확인할 수 있어요"로 변경 (v2 변경사항)
  - "문의 유형" 행 탭 → `OptionSheet` 오픈(`options` mock 배열, `selected`/`onSelect`로 로컬 state 연결)
  - 제출 시 `useInquiries().addInquiry(type, message)` 호출 후 `navigation.goBack()`
- 완료 조건: 유형+내용 모두 있어야 "문의 보내기" 활성화, 제출 시 리스트 최상단에 새 pending 항목이 보인다.
- 검증 방법: `pnpm exec tsc --noEmit`, `pnpm lint`. 시뮬레이터에서 작성→제출→리스트 반영 확인 (TODO로 표시)

### Task 5 — 라우팅 교체 + `ContactScreen` 삭제

- 대상 파일:
  - `src/navigation/stacks/MyPageStack.tsx`
  - `src/screens/mypage/ContactScreen.tsx` (삭제)
  - `src/screens/mypage/SettingScreen.tsx`
- 변경 내용:
  - `MyPageStackParamList`에서 `Contact: undefined` 제거, `Inquiry: undefined`, `InquiryDetail: { id: string }`, `ComposeInquiry: undefined` 추가
  - `<Stack.Screen>` 등록 교체 (`Contact` → `Inquiry`/`InquiryDetail`/`ComposeInquiry`)
  - `ContactScreen.tsx` 파일 삭제
  - `SettingScreen.tsx`: "1:1 문의" 행 `onPress`를 `navigation.navigate('Inquiry')`로 변경, `useInquiries().unreadCount`를 가져와 0보다 크면 행 우측에 배지 표시
- 완료 조건: `grep -rn "ContactScreen\|navigate('Contact')" src/`에 결과가 없다. `SettingScreen` → `Inquiry` → `InquiryDetail`/`ComposeInquiry` 네비게이션이 타입 에러 없이 연결된다.
- 검증 방법: `pnpm exec tsc --noEmit`, `pnpm lint`, 위 grep 확인

## 4) 검증 체크포인트

- [ ] Type check 통과 (`pnpm exec tsc --noEmit`)
- [ ] Lint 통과 (`pnpm lint`)
- [ ] 주요 사용자 시나리오 수동 검증 (스펙 4번 시나리오 A~D — `MyPageScreen`의 기존 [TEMP] 설정 진입 버튼을 통해 `Setting → Inquiry`까지 도달 가능한지 확인 후 진행)
- [ ] `ContactScreen`/`Contact` 라우트 잔여 참조 없음
- [ ] `AsyncStorage` 등 신규 의존성이 추가되지 않았는지 확인

## 5) 롤백 계획

- 영향 파일: `src/hooks/useInquiries.ts`(신규), `src/screens/mypage/InquiryListScreen.tsx`(신규), `src/screens/mypage/InquiryDetailScreen.tsx`(신규), `src/screens/mypage/ComposeInquiryScreen.tsx`(신규), `src/screens/mypage/ContactScreen.tsx`(삭제), `src/navigation/stacks/MyPageStack.tsx`(수정), `src/screens/mypage/SettingScreen.tsx`(수정)
- 되돌림 방법: 신규 파일 삭제, `ContactScreen.tsx`는 `git checkout`으로 복원, `MyPageStack.tsx`/`SettingScreen.tsx`는 `git checkout` 또는 PR revert. 로컬 state만 사용하므로 서버/DB 영향 없음.
- 데이터 영향: 없음 (in-memory, 영속화 안 함)

## 6) PR 구성

- PR 제목(컨벤션): `feat: 1:1 문의 인앱 스레드형(리스트/상세/작성) 구현`
- 변경 요약(3줄 이내):
  1. 단일 문의 작성 화면(`ContactScreen`)을 문의 내역 리스트 → 상세 스레드 → 작성(v2) 3단계 플로우로 교체
  2. 문의 유형 선택은 기존 `OptionSheet` 재사용, `useInquiries` 훅으로 로컬 state 관리(API는 다음 라운드)
  3. `SettingScreen`의 "1:1 문의" 행에 unread 개수 배지 추가
- 리뷰 요청 포인트:
  - unread가 in-memory라 앱 재시작 시 리셋되는 게 이번 PR 범위에서 허용되는지 (AsyncStorage 도입은 다음 라운드로 미룸)
  - 말풍선 비대칭 radius, 상태 배지 색상, 필터 pill 색상이 원본 스펙과 정확히 일치하는지
  - `해결됐어요`/`추가 문의` 버튼이 토스트만 띄우고 실제 처리는 TODO로 남아있는 게 맞는지

---

## 작성 시 참고 문서

- 스펙 템플릿: `docs/ai/01-feature-spec-template.md`
- 리뷰 기준: `docs/ai/03-pr-review-checklist.md`
- 브랜치/PR 규칙: `.github/CONVENTIONS.md`
- 이전 라운드 plan: `docs/ai/plans/main/dnd-settings-integration-plan.md`
