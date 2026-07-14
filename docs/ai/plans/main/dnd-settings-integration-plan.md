# 구현 계획 — 방해 금지 설정 통합 (1c안) RN 구현 + 환경설정 v2

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/main/dnd-settings-integration.md`
- 관련 목업: `src/components/ui/mypage/setting.html`, `src/components/ui/wishlist/wishlist-setting.html`
- 완료 목표: `SettingScreen`(실구현, DND 시트 인라인 포함), `WishlistSettingScreen`(DND 제거), `useNotificationSettings`(신규 훅), `ContactScreen`(신규), 라우팅 연결, `tsc`/`lint` 통과

## 2) 구현 전략

- 핵심 접근: 이미 검증된 HTML 목업(`setting.html`, `wishlist-setting.html`)의 마크업/인터랙션 순서를 1차 기준으로 삼고, 참고 `.native.jsx` 원본에서 데이터 구조(`state` prop, DND 필드 이름, 프리셋 키)만 그대로 가져온다. 스타일은 참고 파일의 인라인 style을 그대로 옮기지 않고, 이미 실구현된 `WishlistSettingScreen.tsx`의 패턴(`className` + `normalize()`/`normalizeFontSize()`만 고정 px에 사용)을 그대로 따른다. `DndTimeSheet`/`DndRepeatSheet`는 별도 파일이 아니라 `SettingScreen.tsx` 하단에 지역 함수 컴포넌트로 정의한다(기존 `WishlistSettingScreen.tsx`가 시트를 인라인 JSX로 두는 것과 같은 결, 다만 이번엔 로직이 있으니 파일 하단에 이름 있는 컴포넌트로 분리).
- 리스크:
  1. 참고 파일 스타일(인라인 객체) vs 프로젝트 컨벤션(NativeWind) 충돌 → 그대로 포팅하면 리뷰 체크리스트(`03-pr-review-checklist.md`)에서 바로 탈락.
  2. `DndTimeSheet`의 휠 피커는 RN에서 순수 `ScrollView` + `onMomentumScrollEnd`로 구현해야 하며 웹 HTML의 `scroll-snap`처럼 공짜로 되지 않음 — 관성/스냅 오차 리스크.
  3. `SettingScreen`을 처음 구현하는데 실제 화면 진입 경로(`MyPageScreen`)가 없어 실기기 수동 검증이 어려움.
  4. `SettingScreen.tsx` 한 파일에 화면 본체 + 방해 금지 섹션 + 휠 피커 시트 + 반복 시트가 모두 들어가 파일이 길어짐 — 가독성 리스크.
- 리스크 완화:
  1. 모든 Task에서 "className 우선, normalize()는 고정 px만" 규칙을 완료 조건에 명시.
  2. `DndTimeSheet`는 HTML 프로토타입에서 이미 검증한 로직(스냅 인덱스 계산, debounce)을 RN `ScrollView`의 `onMomentumScrollEnd` 이벤트로 1:1 이식 — Task 4에서 별도 시간 배분.
  3. Task 6 완료 조건에 "임시 검증 경로" 항목 포함 (MyPageScreen에 임시 버튼을 추가했다가 커밋 전 되돌리는 방식을 기본으로 채택하고, PR에는 포함하지 않음).
  4. 파일 내 섹션 구분을 주석(`/* ── 방해 금지 시간 시트 ── */` 등)으로 명확히 하고, 화면 본체 → DndSection → DndTimeSheet → DndRepeatSheet 순서로 배치해 탐색성 확보.

## 3) 작업 태스크 (작게 분할)

### Task 1 — `useNotificationSettings.ts` 훅 신규

- 대상 파일:
  - `src/hooks/useNotificationSettings.ts` (신규)
- 변경 내용:
  - `useState`로 `{ wishlist, golden, community, dnd: { enabled, start, end, repeatPreset, repeatDays } }` 관리
  - setter 함수들(`setWishlist`, `setGolden`, `setCommunity`, `setDndEnabled`, `setDndTime(start,end)`, `setDndRepeat(preset, days)`) 반환
  - 파일 상단에 `// TODO: 백엔드 DND 엔드포인트 스펙 확정 후 TanStack Query(useQuery/useMutation)로 교체` 코멘트
  - `src/api/`에 대응 함수를 만들지 않음 (Out of Scope)
- 완료 조건: 훅을 import해서 초기값을 렌더링하는 정도의 타입 체크가 통과한다.
- 검증 방법: `pnpm exec tsc --noEmit`.

### Task 2 — `WishlistSettingScreen.tsx`에서 방해 금지 시간 제거

- 대상 파일:
  - `src/screens/wishlist/WishlistSettingScreen.tsx`
- 변경 내용:
  - state 제거: `dndStart`, `dndEnd`, `timeSheetVisible`, `adjustTime` 헬퍼
  - JSX 제거: "방해 금지 시간" 행(알림 설정 카드 내 3번째 행), "Time Picker Sheet" `BottomSheet` 블록 전체
  - JSX 추가: 알림 설정 카드 아래에 안내 문구 (`wishlist-setting.html`의 `.notif-footnote`와 동일 문구: "방해 금지 시간은 설정 › 방해 금지에서 모든 알림에 공통 적용돼요") — "설정 › 방해 금지" 부분만 브랜드 핑크 강조. 탭 네비게이터 간 이동(위시리스트 스택 → 마이페이지 스택)은 기존 코드에 선례가 없으므로 이번 라운드에서는 텍스트만 두고 탭 동작은 `// TODO: 마이페이지 탭 > 설정 화면으로 이동` 코멘트로 남긴다(범위 확장 방지).
- 완료 조건: 화면에 방해 금지 관련 코드가 전혀 남아있지 않고, 안내 문구가 보인다. `isDirty`/`markDirty` 등 다른 로직에 영향 없음.
- 검증 방법: `grep -n "dnd\|Dnd\|방해 금지" src/screens/wishlist/WishlistSettingScreen.tsx` → 안내 문구 텍스트 한 줄만 매치되어야 함. `pnpm exec tsc --noEmit`.

### Task 3 — `SettingScreen.tsx` 화면 본체 (계정/알림/개인정보/FAQ/문의/기타)

- 대상 파일:
  - `src/screens/mypage/SettingScreen.tsx`
- 변경 내용:
  - 빈 stub(`return <View />`)을 실제 UI로 교체. 이 Task에서는 "방해 금지" 섹션을 제외한 나머지 섹션만 구현(방해 금지는 Task 4/5에서 이어서 같은 파일에 추가)
  - 계정 카드(프로필 편집/이메일 변경/비밀번호 변경/관심 테마/연결된 소셜 계정)
  - 알림 카드(위시리스트/골든아워/커뮤니티 알림 토글) — `useNotificationSettings`(Task 1) 사용
  - 개인정보 및 보안 카드(위치 권한/차단 목록)
  - FAQ: 헤더 카드 없이 "자주 묻는 질문" 섹션 라벨만 (v2 변경사항)
  - 문의: 카드 안 폼 제거, "1:1 문의" 한 줄 행 → `onPress`에서 `navigation.navigate('Contact')` (Task 6과 연동)
  - 기타 섹션: 버전 정보 + 로그아웃 + 회원 탈퇴 한 카드로 통합, 회원 탈퇴 행은 기존 `#ff453a` 사용(신규 토큰 없음)
  - 고객센터 아이콘: warm gray 톤(`#eef0f2` / `#615d59`) 통일
  - 전부 `className` + `normalize()`/`normalizeFontSize()`로 작성 (참고 파일 인라인 style 포팅 금지)
- 완료 조건: HTML 목업(`setting.html`)과 방해 금지 제외 섹션의 순서/문구가 일치한다.
- 검증 방법: `pnpm exec tsc --noEmit`, `pnpm lint`.

### Task 4 — `SettingScreen.tsx`에 `DndTimeSheet` 인라인 컴포넌트 추가 (v2 디자인)

- 대상 파일:
  - `src/screens/mypage/SettingScreen.tsx` (같은 파일 하단에 추가)
  - `src/components/common/BottomSheet.tsx` (딤 밝기 오버라이드용 prop 추가, 아래 참고)
- 변경 내용:
  - `@/components/common/BottomSheet`에 옵션 prop `dimOpacity?: number`(기본값 `0.4`, 기존 동작 유지)를 추가하고, dim `Pressable`의 `backgroundColor`를 `rgba(0,0,0,${dimOpacity})`로 계산해서 쓴다. 다른 시트 호출부는 prop을 넘기지 않으므로 동작 변화 없음.
  - 파일 하단에 지역 함수 컴포넌트 `function DndTimeSheet({ visible, onClose, initial, onConfirm })` 정의, `<BottomSheet dimOpacity={0.2} ...>`로 감싼다.
  - 헤더: 좌측 정렬 제목 "방해 금지 시간" + 우측 원형 X 버튼(배경 `#f5f5f7`, `IconX`) — 중앙 정렬 아님.
  - 본문: 카드 하나 안에 "시작" 행 + 구분선 + "종료" 행을 위아래로 배치. 각 행은 라벨(좌측) + 시(00~23)·분(5분 단위) 휠 2개(우측)로 구성.
  - 휠(`Wheel`): `ScrollView` + `snapToInterval`/`onMomentumScrollEnd`로 값 확정·스냅(HTML 프로토타입의 `buildWheel`과 동일 로직), 상/하단에 `expo-linear-gradient`(이미 설치됨) 기반 fade mask 추가.
  - 안내 문구: 자정 교차 시 강조 문구(브랜드 컬러, "자정을 넘어 다음 날 HH:MM까지") + **항상** 그 아래에 "총 N시간 M분 동안 알림이 꺼져요" 총 소요 시간 표시. `computeDuration`은 `d <= 0`이면 `+24h`(시작=종료 → 24시간으로 계산, 0분 아님).
  - CTA "저장" 버튼은 기존 계획과 동일.
  - "방해 금지" 섹션(카드 + "시간" 행)을 화면 본체에 추가하고 이 시트와 연결.
- 완료 조건: "시간" 행 탭 → 시트 오픈(딤 0.2) → 휠 스크롤로 값 변경 → 자정 교차/소요시간 문구 갱신 → 저장 → "시간" 행 라벨 갱신까지 동작. 다른 시트(스팟 변경 등)의 딤 밝기는 그대로(0.4).
- 검증 방법: `pnpm exec tsc --noEmit`. 시뮬레이터에서 스크롤 스냅, fade mask, 딤 밝기 차이, 시작=종료일 때 "24시간" 표기 확인 (Task 6의 임시 진입 경로 활용).

### Task 5 — `SettingScreen.tsx`에 `DndRepeatSheet` 인라인 컴포넌트 추가

- 대상 파일:
  - `src/screens/mypage/SettingScreen.tsx` (같은 파일 하단에 추가)
- 변경 내용:
  - 지역 함수 컴포넌트 `function DndRepeatSheet({ visible, onClose, initial, onConfirm })` 정의
  - 프리셋 4개 리스트(매일/평일(월~금)/주말(토·일)/사용자 지정) + 체크 아이콘, "사용자 지정" 선택 시 요일 그리드(일~토) 노출
  - 요일 0개 선택 시 저장 버튼 비활성화 + 경고 문구
  - `labelFromDays` 헬퍼로 라벨 계산("매일" / "화·목" 등)
  - "방해 금지" 섹션의 "반복" 행과 연결
- 완료 조건: "반복" 행 탭 → 시트 오픈 → 프리셋/요일 선택 → 저장 → 행 라벨 갱신까지 동작. 요일 0개면 저장 차단.
- 검증 방법: `pnpm exec tsc --noEmit`. 시뮬레이터에서 프리셋 전환, 요일 0개 경고, 저장 후 라벨 확인.

### Task 6 — `ContactScreen.tsx` 신규 + 라우팅 연결

- 대상 파일:
  - `src/screens/mypage/ContactScreen.tsx` (신규)
  - `src/navigation/stacks/MyPageStack.tsx`
- 변경 내용:
  - `ContactScreen`: 상단 nav(뒤로 + "1:1 문의"), 평균 응답시간 안내 배너, 문의 유형 선택 행(타입 선택 시트는 Out of Scope — `onOpenTypeSheet` prop 자리만 유지), 문의 내용(500자 카운터), 하단 CTA(유형+내용 모두 있어야 활성). `className` + `normalize()`로 작성.
  - `MyPageStackParamList`에 `Contact: undefined` 추가, `<Stack.Screen name="Contact" component={ContactScreen} />` 등록
  - `SettingScreen`의 `onPress('contact')` → `navigation.navigate('Contact')`
  - (검증 전용, 커밋 전 되돌림) `MyPageScreen.tsx`에 임시로 `onPress={() => navigation.navigate('Setting')}` 버튼을 하나 추가해 `SettingScreen`에 실기기로 도달 — PR에는 포함하지 않음
- 완료 조건: `Setting` → "1:1 문의" 탭 → `Contact` 화면까지 네비게이션 스택으로 정상 진입/뒤로가기 가능. `ContactScreen`은 유형+내용 모두 있어야 "문의 보내기" 활성화.
- 검증 방법: 시뮬레이터 수동 확인 + `pnpm exec tsc --noEmit` (타입 파라미터 리스트 일치 확인).

## 4) 검증 체크포인트

- [ ] Type check 통과 (`pnpm exec tsc --noEmit`)
- [ ] Lint 통과 (`pnpm lint`)
- [ ] 주요 사용자 시나리오 수동 검증 (스펙 4번 시나리오 A~D, 시뮬레이터)
- [ ] 회귀 영향 범위 점검: `WishlistSettingScreen`의 기존 스팟 변경/삭제/저장 플로우가 DND 제거 후에도 정상 동작하는지 확인
- [ ] `src/components/sheets/`, `src/constants/colors.ts` 같은 신규 디렉터리/토큰이 추가되지 않았는지 확인
- [ ] Task 6의 `MyPageScreen` 임시 버튼이 최종 커밋에 남아있지 않은지 확인

## 5) 롤백 계획

- 영향 파일: `src/hooks/useNotificationSettings.ts`(신규), `src/screens/mypage/SettingScreen.tsx`, `src/screens/mypage/ContactScreen.tsx`(신규), `src/screens/wishlist/WishlistSettingScreen.tsx`, `src/navigation/stacks/MyPageStack.tsx`, `src/components/common/BottomSheet.tsx`(옵션 prop 추가, 기존 호출부 영향 없음)
- 되돌림 방법: 신규 파일은 삭제, 수정 파일(`WishlistSettingScreen.tsx`, `MyPageStack.tsx`, `BottomSheet.tsx`)은 `git checkout` 또는 PR revert. `BottomSheet.tsx`는 옵션 prop 추가라 되돌려도 다른 화면에 영향 없음. 로컬 state만 사용하므로 서버/DB 영향 없음.
- 데이터 영향: 없음 (영속화된 데이터 없음, 앱 재시작 시 초기값으로 리셋)

## 6) PR 구성

- PR 제목(컨벤션): `feat: 방해 금지 설정 전역 통합 및 환경설정 화면 v2 구현`
- 변경 요약(3줄 이내):
  1. 위시리스트 스팟별 방해 금지 시간 설정을 마이페이지 환경설정의 전역 "방해 금지" 섹션으로 통합 (시간 휠 피커 + 반복 프리셋/요일 시트, `SettingScreen` 내 인라인 구현)
  2. `SettingScreen`을 처음 구현하고(v2 리뷰 반영: FAQ 위계 정리, 1:1 문의 화면 분리, 기타 카드 통합), `ContactScreen` 신규 추가 및 라우팅 연결
  3. `useNotificationSettings` 훅 신규 (로컬 state, API 연동은 후속 라운드)
- 리뷰 요청 포인트:
  - 방해 금지 상태가 로컬 state뿐이라 앱 재시작 시 초기화되는 게 이번 PR 범위에서 허용되는지
  - 휠 피커(`DndTimeSheet`)의 스냅/관성, fade mask가 실기기에서 웹 프로토타입만큼 매끄러운지
  - `BottomSheet.tsx`에 추가한 `dimOpacity` 옵션 prop이 다른 화면에 영향 없는지 (기본값 유지 확인)
  - `SettingScreen.tsx` 파일이 화면 본체 + 시트 2개까지 담아 길어졌는데, 분리 없이 이대로 유지할지

---

## 작성 시 참고 문서

- 스펙 템플릿: `docs/ai/01-feature-spec-template.md`
- 리뷰 기준: `docs/ai/03-pr-review-checklist.md`
- 브랜치/PR 규칙: `.github/CONVENTIONS.md`
- 자동화 동작/CI 대응: `docs/guide/ops/github-actions-guide.md`
