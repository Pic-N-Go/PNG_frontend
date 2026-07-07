# 구현 계획 — 스팟 상세 화면 UI 우선 구현

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/feature/spot-detail-ui/spot-detail-screen-ui.md`
- 관련 목업: `src/components/ui/spot/spot-detail.html`
- 완료 목표: 정보/사진/리뷰/채팅 4탭 + 바텀시트 4종을 로컬 mock 데이터로 목업과 동일하게 동작시키고, tsc/lint 통과 + 360~430dp 반응형 확인까지 완료

## 2) 구현 전략

- 핵심 접근: `src/components/home/`의 섹션 분할 컨벤션(`HeroSection`, `PopularSpotsSection`, `FilterBottomSheet` 등)을 그대로 따라 `src/components/spot/` 아래 섹션별 컴포넌트로 분리하고, `SpotDetailScreen`은 조립만 담당
- **목업 재현 원칙**: `spot-detail.html`은 근사 참고가 아닌 1:1 재현 대상. 색상 hex/rgba, 텍스트, 각 팩터의 수치(+18/+20/+15/92% 등)를 그대로 이식하고, spacing/font/radius만 `CLAUDE.md` 변환표(`className` vs `layout.ts` 상수 vs `normalize`/`normalizeFontSize`)를 적용
- **아이콘 전략**: 목업 아이콘은 전부 Tabler Icons → 이미 설치된 `@tabler/icons-react-native`(`TabBar.tsx`에서 이미 사용 중)에서 동일 아이콘을 매칭. Tabler에 없는 커스텀 SVG(포토제닉 링, 다이나믹 아일랜드, 브랜드 로고 등)만 `react-native-svg` 직접 구현 (`HeroSection.tsx`/`MapBanner.tsx` 패턴 참고)
- **공통 컴포넌트 우선 추출**: 이번 화면에서 2회 이상 쓰이는 UI 조각(`BottomSheet`, `Chip`, `StarRating`, `InitialAvatar`)은 스팟 전용 컴포넌트보다 먼저 `src/components/common/`에 구현하고, 이후 태스크에서 가져다 씀 (반대로 조립하면 나중에 역추출하며 각 사용처를 다시 고쳐야 함)
- 재사용 자산: 바텀시트 공통 컴포넌트는 `FilterBottomSheet.tsx`의 `Modal(transparent, animationType="slide") + Pressable 백드롭` 패턴을 그대로 컴포넌트화. 액션 피드백은 `src/components/auth/Toast.tsx` 그대로 재사용 (이동/수정 없음)
- 리스크: 콜랩싱 히어로 애니메이션(Reanimated) 구현 난이도, 사진 탭 무한 스크롤 mock 페이지네이션의 상태 관리 복잡도, 공통 컴포넌트의 props 설계가 4개 바텀시트/4개 칩 용도를 모두 커버해야 하는 부담
- 리스크 완화: `development-guide.md`에 제시된 정확한 Reanimated 코드 스니펫을 그대로 적용. 사진 페이지네이션은 목업 JS 로직(`photoPage`, `photosPerPage`, `photoTotal`)을 그대로 React state로 이식. 공통 컴포넌트는 이번 화면의 실제 4개 사용처 요구사항만 커버하도록 설계(추측성 옵션 추가 금지)

## 3) 작업 태스크

### Task 1 - 타입 정의 (`src/types/spot.ts` 확장)

- 대상 파일:
  - `src/types/spot.ts`
- 변경 내용: `PhotogenicFactor`, `PhotogenicScore`, `ConvenienceInfo`, `ChecklistOption`, `ReviewSummary`, `Review`, `ChatMessage`, `TravelPlanOption`, `NaviAppId`, `BookmarkCollection`, `SpotDetailInfo` 등 화면 표시용 타입 추가 (기존 `SpotItem` 등은 유지)
- 완료 조건: 이후 태스크에서 `any` 없이 모든 mock 데이터/props에 타입 적용 가능
- 검증 방법: `pnpm exec tsc --noEmit`

### Task 2 - 공통 컴포넌트 4종 (`src/components/common/`)

- 대상 파일:
  - `src/components/common/BottomSheet.tsx` (백드롭 + 슬라이드업 컨테이너 + 핸들 + 헤더/푸터 슬롯, `children` prop으로 본문 구성)
  - `src/components/common/Chip.tsx` (label, selected, onPress, 선택 도트 표시 여부(`showDot`) props)
  - `src/components/common/StarRating.tsx` (rating: number, size 옵션)
  - `src/components/common/InitialAvatar.tsx` (initials: string, backgroundColor: string, size 옵션)
- 변경 내용: `FilterBottomSheet.tsx`의 `Modal(transparent, animationType="slide") + Pressable` 백드롭 패턴을 `BottomSheet`로 컴포넌트화. 나머지 3개는 목업의 반복 UI 조각(체크리스트/사진필터/리뷰정렬/DAY 칩, 별점, 아바타)을 범용 props로 추출
- 완료 조건: 이후 Task 3~9에서 스팟 전용 컴포넌트를 만들 필요 없이 이 4개를 import해서 조립 가능

> **추가 (구현 중 발생)**: 계획에 없던 공통 컴포넌트 2개가 세션 중 추가로 필요해져 같은 원칙(2회 이상 실사용)으로 `src/components/common/`에 만듦.
> - `Skeleton.tsx` — 펄스 애니메이션 사각 블록. `ConvenienceInfoSection`의 교통카드/정보그리드 2곳에서 로딩 placeholder로 사용.
> - `OptionSheet.tsx` — 원래 `PhotogenicSelectorSheet`란 이름으로 스팟 전용 폴더에 만들었다가, 날짜/시간 선택 모두에 재사용되는 범용 컴포넌트임을 확인하고 `common/`으로 이동·개명함.
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`

### Task 3 - SpotHero + SpotInfoHeader + SpotTabBar

- 대상 파일:
  - `src/components/spot/SpotHero.tsx` (콜랩싱 애니메이션, 상태바 오버레이, 뒤로가기/공유/북마크 버튼 — `@tabler/icons-react-native`의 `IconArrowLeft`/`IconShare2`/`IconBookmark`, 카운터)
  - `src/components/spot/SpotInfoHeader.tsx` (배지·이름·위치·`StarRating`·태그)
  - `src/components/spot/SpotTabBar.tsx` (정보/사진/리뷰/채팅)
- 변경 내용: Reanimated `useAnimatedScrollHandler` + `interpolate(scrollY, [0,200], [0,-100], CLAMP)` 기반 `translateY` 콜랩싱 적용 (`development-guide.md` 스니펫 기준)
- 완료 조건: 스크롤 시 히어로가 jitter 없이 부드럽게 콜랩스, 탭 바는 `sticky`에 준하는 위치 고정(스크롤 리스트 상단 고정), 목업과 동일한 텍스트/색상/수치
- 검증 방법: iOS 시뮬레이터에서 스크롤 확인, `pnpm exec tsc --noEmit` / `pnpm lint`

### Task 4 - PhotogenicScoreCard

- 대상 파일:
  - `src/components/spot/PhotogenicScoreCard.tsx`
- 변경 내용: `react-native-svg`로 링 차트(그라디언트 스트로크, `stroke-dasharray: 372 55` 값 그대로) 구현, 우상단 뱃지, 추천 문구·골든아워 콜아웃 문구 그대로, 3열 팩터 그리드(날씨/골든아워/미세먼지 + 와이드 시즌 카드)를 `@tabler/icons-react-native`(`IconCloud`, `IconSun`, `IconWind`, `IconFlower` 등 목업 아이콘과 매칭)로 구현
- 완료 조건: 목업의 `pg-*` 구조·수치(+18/+20/+15/+20, 87점, 92%)와 동일
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`, 스크린샷 비교

### Task 5 - ConvenienceInfoSection + ChecklistSection + SpotWishlistBanner + 정보탭 Bottom CTA

- 대상 파일:
  - `src/components/spot/ConvenienceInfoSection.tsx`
  - `src/components/spot/ChecklistSection.tsx`
  - `src/components/spot/SpotWishlistBanner.tsx`
- 변경 내용:
  - `ConvenienceInfoSection`: 주차/교통 카드 + 6칸 정보 그리드 (문구·값 목업 그대로)
  - `ChecklistSection`: 공통 `Chip`(`showDot`)으로 8개 옵션 선택(빈 상태) ↔ 완료 카드(개별 체크 토글) 로컬 state 전환, 저장 버튼은 1개 이상 선택 시 활성화, "수정" 버튼으로 재진입
  - `SpotWishlistBanner`: 클릭 시 `WishlistScreen`으로 이동 (홈 도메인의 `WishlistBanner`와 텍스트/아이콘이 다르므로 별도 컴포넌트로 생성 — 기존 컴포넌트 재사용 불가 확인됨)
  - Bottom CTA(코스에 저장/바로 출발) 버튼은 `SpotDetailScreen`에서 시트 오픈 콜백과 함께 배치
- 완료 조건: 체크리스트 상태 전환이 목업과 동일, 위시리스트 배너 클릭 시 네비게이션 동작
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`, 수동 인터랙션 확인

### Task 6 - PhotoGridTab

- 대상 파일:
  - `src/components/spot/PhotoGridTab.tsx`
- 변경 내용: 필터 칩(전체/일출/야경/인물/풍경)을 공통 `Chip`으로 구현(클릭 시 active 스타일 전환 + 그리드 초기화 후 재로드). **계획 변경**: `FlatList`+`onEndReached` 대신 상위 `Animated.ScrollView`(Task 10) 안에 중첩 배치해야 해서 VirtualizedList 중첩 경고를 피하기 위해 일반 `View` flex-wrap 3열 그리드로 구현하고, 상위 스크롤 핸들러가 하단 근접을 감지해 `loadMoreSignal` prop을 올려주는 방식으로 mock 247장을 18장씩 로드. 로딩 중 하단 로더 dot 3개 표시(정적, `setTimeout` 600ms로 지연만 시뮬레이션)
- 완료 조건: AC5 충족 — 총 247장 로드 후 추가 로딩 없음
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`, 시뮬레이터에서 스크롤 끝까지 확인

### Task 7 - ReviewTab

- 대상 파일:
  - `src/components/spot/ReviewTab.tsx`
- 변경 내용: 평점 요약(공통 `StarRating` + 별점 분포 바 5단계, 72/18/7/2/1% 그대로) + 정렬 칩(공통 `Chip`, 스타일 토글만) + 리뷰 카드 리스트(공통 `InitialAvatar` + `StarRating`, mock 4개, 사진/장비 정보 포함) + 리뷰 작성하기 sticky CTA → `ReviewWriteScreen` 이동
- 완료 조건: AC6 충족 — 정렬 칩은 재정렬 없이 active 상태만 전환
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`

### Task 8 - ChatTab

- 대상 파일:
  - `src/components/spot/ChatTab.tsx`
- 변경 내용: 채팅 헤더(참여 인원), 날짜 구분선, 상대/내 메시지 버블(공통 `InitialAvatar` 재사용), 이미지 placeholder 메시지, 입력창 + 전송 버튼(로컬 `useState` 배열에 append, 공백 입력 무시, 전송 후 자동 스크롤)
- 완료 조건: AC7 충족
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`, 수동 전송 테스트

### Task 9 - 바텀시트 4종

- 대상 파일:
  - `src/components/spot/SaveToPlanSheet.tsx` (여행 선택 → DAY 선택 2단계, DAY 칩은 공통 `Chip` 재사용)
  - `src/components/spot/NaviSheet.tsx` (내비 앱 선택)
  - `src/components/spot/ShareSheet.tsx` (공유 앱 그리드 + 액션 목록)
  - `src/components/spot/BookmarkSheet.tsx` (컬렉션 선택 패널 ↔ 저장됨 패널)
- 변경 내용: 공통 `BottomSheet`로 4개 시트 조립. 각 시트의 확인 액션은 `Toast`(`src/components/auth/Toast.tsx`) 호출로 피드백. 내비 앱 실행은 `// TODO: Linking.openURL 딥링크 연동`으로 표시
- 완료 조건: AC8, AC9 충족
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`, 4개 시트 열림/닫힘 + 완료 플로우 수동 확인

### Task 10 - SpotDetailScreen 조립

- 대상 파일:
  - `src/screens/spot/SpotDetailScreen.tsx`
  - `src/navigation/stacks/SpotStack.tsx` (기존 라우트 확인만, 변경 불필요 시 그대로 유지)
- 변경 내용: **계획 변경**: `ScreenContainer` 컴포넌트가 실제 코드베이스에 존재하지 않아(`development-guide.md`에 문서화만 돼 있고 미구현), `HomeScreen.tsx` 선례를 따라 순수 `View` + `useSafeAreaInsets()` 직접 사용으로 최상위 래퍼 구성. 탭 상태(`activeTab`)와 4개 시트 visible 상태 관리, Task 3~9 컴포넌트 조립, Toast 상태 관리, 히어로 콜랩싱용 `scrollY` 공유 값 및 사진 탭 `loadMoreSignal` 관리
- 완료 조건: 화면 전체가 목업과 동일하게 렌더링되고 AC1~AC11(AC3-1 포함) 전체 충족
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`, iPhone SE(375dp)/iPhone 15 Plus(428dp) 시뮬레이터 확인

### Task 11 - 추가 작업 (구현 중 사용자 피드백으로 발생, 계획에 없었음)

- 대상 파일:
  - `src/components/spot/TimePickerSheet.tsx` (신규) — 포토제닉 시간대 선택용 네이티브 타임피커 시트
  - `src/components/spot/PhotogenicScoreCard.tsx` — 날짜(3일 리스트)/시간(네이티브 피커) 선택 연결
  - `src/components/spot/BookmarkSheet.tsx` — 새 컬렉션 만들기(이름+색상 5종, 최대 10개) 실제 기능 추가
  - `src/components/spot/ConvenienceInfoSection.tsx`, `src/components/common/Skeleton.tsx` — 스켈레톤 로딩
  - `src/components/spot/ChatTab.tsx` — 메시지 전송/탭 진입 시 자동 스크롤 (원래 AC7에 있었으나 최초 구현에서 누락, 코드리뷰로 발견 후 수정)
  - `src/navigation/index.tsx`, `src/screens/home/HomeScreen.tsx` — `SpotStack` 네비게이션 타입 안전성 수정 + 인기 스팟 카드 연동
  - `app.config.js`, `package.json` — `@react-native-community/datetimepicker` 의존성 추가 (iOS pod install 완료)
- 완료 조건: 코드리뷰(Critical 0 / Important 2 / Minor 3, 전부 반영) 통과, tsc/lint 통과
- 검증 방법: 시뮬레이터 수동 확인 (사용자 직접 테스트로 다수 회 반복 확인함)

## 4) 검증 체크포인트

- [ ] Type check 통과 (`pnpm exec tsc --noEmit`)
- [ ] Lint 통과 (`pnpm lint`)
- [ ] 주요 사용자 시나리오 수동 검증 (탭 전환/체크리스트/코스저장/사진 페이지네이션/채팅/시트 4종)
- [ ] 360dp~430dp 반응형 확인
- [ ] 회귀 영향 범위 점검 (기존 `SpotStack`, `Toast`, `FilterBottomSheet` 패턴에 영향 없는지)

## 5) 롤백 계획

- 영향 파일: `src/types/spot.ts`(추가만), `src/components/spot/*`(신규), `src/components/common/*`(신규), `src/screens/spot/SpotDetailScreen.tsx`(교체)
- 되돌림 방법: `git restore src/screens/spot/SpotDetailScreen.tsx src/types/spot.ts` + `git clean` 대상은 신규 생성된 `src/components/spot/*`, `src/components/common/*` 파일 목록 확인 후 개별 삭제 (단, `src/components/common/`은 다른 화면이 이미 import했다면 삭제 전 사용처 확인 필요)
- 데이터 영향: 없음 (로컬 mock, 영속 데이터 없음)

## 6) PR 구성

- PR 제목(컨벤션): `style(spot): 스팟 상세 화면 UI 구현 (API 연동 제외)` — 실제 커밋 시점에 `git-message-helper` 스킬로 재확정
- 변경 요약(3줄 이내):
  - 스팟 상세 화면(정보/사진/리뷰/채팅 탭 + 바텀시트 4종)을 목업 기준 UI로 구현
  - 모든 데이터는 로컬 mock, API 연동은 후속 이슈로 분리
  - 콜랩싱 히어로는 Reanimated 기반으로 구현
- 리뷰 요청 포인트: 콜랩싱 애니메이션 성능(jitter 여부), 바텀시트 4종의 상태 관리 방식이 과한 분리/중복 없이 적절한지, 신규 공통 컴포넌트(`BottomSheet`/`Chip`/`StarRating`/`InitialAvatar`) props 설계가 향후 다른 화면에서도 무리 없이 재사용 가능한지

---

## 작성 시 참고 문서

- 스펙 템플릿: `docs/ai/01-feature-spec-template.md`
- 리뷰 기준: `docs/ai/03-pr-review-checklist.md`
- 브랜치/PR 규칙: `.github/CONVENTIONS.md`
