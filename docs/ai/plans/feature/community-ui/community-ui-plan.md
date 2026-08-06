# 구현 계획 — 커뮤니티 화면 UI 구현

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/feature/community-ui/community-ui.md`
- 관련 도메인: `community`
- 관련 목업: `src/components/ui/community/{community-feed,community-post,community-write,contest-result,user-profile}.html`
- 완료 목표: 6개 목업의 모든 상태·모달·시트를 로컬 mock으로 목업과 1:1 동일하게 동작시키고, tsc/lint 통과 + 360~430dp 반응형 확인까지 완료

## 2) 구현 전략

- 핵심 접근: `src/components/spot/`(spot-detail-ui) 선례를 그대로 따라 `src/components/community/` 아래 섹션/화면별 컴포넌트로 분리하고, 각 Screen은 조립 + 로컬 state 관리만 담당
- **목업 재현 원칙**: 6개 목업은 근사 참고가 아닌 1:1 재현 대상 — 색상 hex/rgba, 텍스트, 수치를 그대로 이식하고 spacing/font/radius만 `CLAUDE.md` 변환표(`className` / `layout.ts` 상수 / `normalize`·`normalizeFontSize`)로 치환
- **레퍼런스 패키지 활용 범위**: `~/Desktop/png-community-ui/phase1~4`는 상태 분기·아이콘 매핑·컴포넌트 경계(예: `PostActionSheet`가 `isMyPost` prop 하나로 내글/남글 분기) 참고용으로만 사용. 그 패키지의 인라인 `style` 객체는 그대로 가져오지 않고 전부 NativeWind `className`으로 재작성 (`StyleSheet.create()` 유사 패턴 금지, `CLAUDE.md` 최상위 규칙)
- **아이콘 전략**: `lucide-react-native`(이미 설치, `^1.24.0`)로 통일. 레퍼런스 README의 아이콘 매핑표(Heart/Archive/MessageSquare/Share/MapPin/ThumbsUp/Trophy/Search/Plus/ChevronLeft/MoreHorizontal/Camera/Aperture/Maximize/Trash2/Send/CheckCircle 등) 그대로 적용. 날씨 Meteocons는 원격 URI `Image` 유지(아이콘 라이브러리 미보유)
- **공통 컴포넌트 우선 확인**: `src/components/common/`에 이미 있는 `BottomSheet`/`Chip`/`StarRating`/`InitialAvatar`/`Skeleton`/`OptionSheet`를 먼저 재사용하고, 부족한 것(예: 액션시트형 바텀시트, 토스트)만 동일 원칙(2회 이상 실사용)으로 추가. 토스트는 `src/components/auth/Toast.tsx` 재사용 여부 먼저 확인
- **네비게이션 원칙**: 목업 구조를 그대로 따름(`CLAUDE.md` — 임의 네비게이션 변경 금지). 콘테스트는 `community-feed.html` 내부 세그먼트이므로 별도 push 화면이 아님 → 기존 `ContestScreen`/`Contest` 라우트는 `ContestResultScreen`(= `contest-result.html`의 실제 push 목적지)으로 재정의 (스펙 오픈 이슈 기본안)
- 리스크: (1) 라이트박스(layer1) + EXIF(layer2) 중첩 오픈/클로즈 상태 관리, (2) 콘테스트 진행중 서브탭의 투표 확인/취소 모달 + undo 스낵바 조합 로직, (3) 5개 화면 분량이 커서 컴포넌트 경계를 잘못 잡으면 후반 태스크에서 재작업 발생
- 리스크 완화: (1) `PostDetailScreen`에 `lightboxOpen`/`exifOpen` 2개의 독립 bool state로 관리(EXIF는 라이트박스 열려있을 때만 열림, 라이트박스 close가 EXIF도 함께 close), (2) 목업 JS 로직(투표 확인 모달 → 반영 → 스낵바 → 기간 내 undo는 모달 없이 즉시 되돌림, 남은 표 0에서 재투표 시 취소 모달만) 그대로 이식, (3) Task 1~2(타입/공통컴포넌트)를 먼저 끝내고 이후 화면 태스크에서 역추출 없이 바로 조립

## 3) 작업 태스크

> 각 태스크는 30~90분 내 완료 가능 크기 기준. 화면 분량이 커서 화면당 1~2개 태스크로 묶음.

### Task 1 - 타입 정의 (`src/types/community.ts`)

- 대상 파일:
  - `src/types/community.ts`
- 변경 내용: 5개 목업 기준으로 `Post`, `PostDetail`, `Comment`, `ReportReason`, `ContestEntry`, `ContestPhoto`, `ContestSubmission`, `UserProfileSummary`, `FollowState` 등 화면 표시용 타입 정의
- 완료 조건: 이후 태스크에서 `any` 없이 모든 mock 데이터/props에 타입 적용 가능
- 검증 방법: `pnpm exec tsc --noEmit`

### Task 2 - 공통 컴포넌트 점검 및 부족분 추가

- 대상 파일:
  - `src/components/common/` (기존 `BottomSheet`/`Chip`/`StarRating`/`InitialAvatar`/`Skeleton`/`OptionSheet` 재사용 확인)
  - `src/components/auth/Toast.tsx` (재사용 확인, 커뮤니티 전용 위치/스타일 요구 시에만 수정)
- 변경 내용: 5개 목업을 훑어 반복되는 UI 조각(예: 액션시트 리스트형 바텀시트, 스낵바)이 기존 공통 컴포넌트로 커버 안 되면 신규 추가. 신규 컴포넌트는 실제 2회 이상 사용처가 확인된 것만
- 완료 조건: Task 3 이후 화면 태스크에서 스타일 중복 없이 공통 컴포넌트만으로 조립 가능
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`

### Task 3 - CommunityFeedScreen: 게시글/갤러리 세그먼트 + 검색

- 대상 파일:
  - `src/screens/community/CommunityFeedScreen.tsx`
  - `src/components/community/PostCard.tsx`, `SearchOverlay.tsx` (필요 시)
- 변경 내용: 세그먼트 3종 전환(게시글/갤러리/콘테스트), 게시글 피드 카드 리스트(mock), 검색 인라인 확장 오버레이. 갤러리 세그먼트는 착수 시 목업 마크업 유무 재확인(스펙 오픈 이슈) 후 있으면 구현, 없으면 스킵하고 플랜에서 제거
- 완료 조건: AC1 충족, 작성 버튼 → `CommunityWriteScreen`, 유저명 → `UserProfileScreen` 네비게이션 연결
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`, 수동 세그먼트 전환 확인

### Task 4 - 콘테스트 세그먼트: 진행중 서브탭

- 대상 파일:
  - `src/components/community/ContestActiveTab.tsx`
  - `src/components/community/VoteConfirmModal.tsx`, `VoteUndoSnackbar.tsx`, `ContestPhotoLightbox.tsx`
- 변경 내용: 히어로 배너(186px) + 포디움 + 리스트, 투표 확인/취소 모달(`mode` prop 분기), undo 스낵바, 사진 라이트박스(`myVote` prop). 남은 투표 횟수는 `CommunityFeedScreen` 또는 상위 콘테스트 컨테이너에서 로컬 state로 관리해 하위로 props 전달
- 완료 조건: AC2 중 진행중 서브탭 관련 항목 충족(투표 확인→반영→스낵바→undo, 표 소진 시 취소 모달만 노출)
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`, 투표/undo/소진 3가지 케이스 수동 확인

### Task 5 - 콘테스트 세그먼트: 내 출품 서브탭

- 대상 파일:
  - `src/components/community/ContestMyEntryTab.tsx` (`hasEntry` prop으로 빈 상태 분기)
  - `src/components/community/CaptionEditSheet.tsx`, `WithdrawEntryModal.tsx`, `SubmitEntrySheet.tsx`
- 변경 내용: 컴팩트 배너(120px), 캡션 수정 시트, 출품 취소 모달, 출품하기 시트(`photo` null이면 빈 상태). 빈 상태 ↔ 출품 완료 상태 로컬 토글
- 완료 조건: AC2 중 내 출품 서브탭 관련 항목 충족(시나리오 D)
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`, 빈 상태→출품→캡션수정→취소 플로우 수동 확인

### Task 6 - 콘테스트 세그먼트: 지난 서브탭 + ContestResultScreen

- 대상 파일:
  - `src/components/community/ContestPastTab.tsx` (2열 그리드)
  - `src/screens/community/ContestResultScreen.tsx`
  - `src/navigation/stacks/CommunityStack.tsx` (`Contest` 라우트 제거, `ContestResult` 라우트 추가)
- 변경 내용: 지난 콘테스트 카드 그리드 → 카드 탭 시 `ContestResultScreen` push(풀스크린, 시트 아님). 기존 `ContestScreen.tsx` 파일은 `ContestResultScreen.tsx`로 대체(내용 전면 재작성이므로 새 파일로 만들고 기존 스텁 삭제)
- 완료 조건: AC2 중 지난 서브탭 + AC5(결과 화면) 충족
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`, 그리드→결과 push 확인

### Task 7 - PostDetailScreen 기본 구조 + 액션시트/삭제/신고/토스트

- 대상 파일:
  - `src/screens/community/PostDetailScreen.tsx`
  - `src/components/community/PostActionSheet.tsx`(`isMyPost` prop), `PostDeleteConfirmModal.tsx`, `PostReportSheet.tsx`, `PostToast.tsx`(`message` prop)
  - `src/navigation/stacks/CommunityStack.tsx` (`PostDetail` 라우트 추가)
- 변경 내용: 상세 헤더 + 본문(사진/캡션/좋아요/댓글) + `⋯` 액션시트(내 글/남 글 분기) → 삭제 확인 모달 / 신고 사유 시트 → 완료 토스트 2종
- 완료 조건: AC3 중 액션시트~토스트 관련 항목 충족(시나리오 B)
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`, 내 글/남 글 각각 액션시트 분기 확인

### Task 8 - PostDetailScreen 라이트박스 + EXIF 중첩

- 대상 파일:
  - `src/components/community/PhotoLightbox.tsx`, `PhotoInfoExif.tsx`
  - `src/screens/community/PostDetailScreen.tsx` (상태 연결)
- 변경 내용: 히어로 확대 → 라이트박스(layer1) → `(i)` → EXIF(layer2, 라이트박스 위 중첩). `lightboxOpen`/`exifOpen` 2개 독립 state로 EXIF만 닫기 / 둘 다 닫기 분기
- 완료 조건: AC3 중 라이트박스+EXIF 항목 충족(시나리오 A)
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`, EXIF만 닫기 / 라이트박스 닫아 전체 닫기 2가지 케이스 확인

### Task 9 - CommunityWriteScreen 기본 폼 + 사진 첨부

- 대상 파일:
  - `src/screens/community/CommunityWriteScreen.tsx`
  - `src/components/community/PhotoGalleryPicker.tsx` (필요 시)
- 변경 내용: 캡션 입력, 사진 첨부(`expo-image-picker`로 로컬 URI 선택), 첨부 사진 프리뷰 그리드
- 완료 조건: AC4 중 사진 첨부 항목 충족
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`, 시뮬레이터에서 사진 선택 확인

### Task 10 - CommunityWriteScreen 위치/카메라·렌즈 시트

- 대상 파일:
  - `src/components/community/LocationSheet.tsx`, `GearSheet.tsx` (`kind='camera'|'lens'`)
- 변경 내용: 위치 선택 시트(스팟 검색/선택), 카메라·렌즈 선택 시트(공통 `GearSheet`를 kind로 분기)
- 완료 조건: AC4 나머지 항목 충족
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`, 시트 오픈/선택/닫힘 확인

### Task 11 - UserProfileScreen

- 대상 파일:
  - `src/screens/community/UserProfileScreen.tsx`
  - `src/components/community/ProfileTabs.tsx` (게시글/콘테스트/방문한 스팟, `activeTab` prop 하나로 통합)
  - `src/navigation/stacks/CommunityStack.tsx` (`UserProfile` 라우트 추가)
- 변경 내용: 헤더(아바타/닉네임/통계) + 팔로우 토글(로컬 state) + 메시지 버튼(BETA 뱃지, `disabled` + `rgba(...,.35)` 스타일) + 탭 3종 콘텐츠(mock 데이터 props 주입)
- 완료 조건: AC6 충족(시나리오 E)
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`, 탭 전환 + 팔로우 토글 확인

### Task 12 - 네비게이션 최종 정리

- 대상 파일:
  - `src/navigation/stacks/CommunityStack.tsx`
- 변경 내용: `CommunityFeed`(탭 루트) / `CommunityWrite` / `PostDetail` / `ContestResult` / `UserProfile` 라우트로 정리, 각 화면에서의 진입 네비게이션(피드→상세/작성/프로필/결과) 전부 연결 확인. 기존 `Contest` 라우트/`ContestScreen.tsx` 완전 제거
- 완료 조건: 6개 목업의 모든 화면 전환 진입점이 실제로 연결됨(더미 버튼 없음)
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`, 앱 내 전체 플로우 수동 탐색

### Task 13 - 반응형/최종 검증

- 대상 파일: 없음 (검증 전용)
- 변경 내용: 없음
- 완료 조건: AC7, AC8 충족
- 검증 방법: `pnpm exec tsc --noEmit`, `pnpm lint`, iPhone SE(375dp)/iPhone 15 Pro Max(430dp) 시뮬레이터에서 6개 화면 전체 시나리오(A~E) 수동 재확인 (Task 14 포함)

### Task 14 - 콘테스트 진행중 탭 시안 반영 + 전체 출품작 목록 화면 (2026-08-06 추가)

- 대상 파일:
  - `src/components/community/ContestActiveTab.tsx`
  - `src/screens/community/ContestAllEntriesScreen.tsx` (신규)
  - `src/components/community/ContestSegment.tsx`
  - `src/navigation/stacks/CommunityStack.tsx`
- 변경 내용:
  - 히어로 372px → 280px(하단 정렬·스크림), 2·3위 개별 카드와 4~7위 그리드를 목록 화면과 같은
    통일 카드(1:1 사진 + 아래 정보 영역 + 28px 원형 투표 버튼)로 병합, 좋아요 수 pill 제거
  - 하단 CTA 바 높이 고정(72px) 제거 → 패딩 기반 + `insets.bottom` 반영
    (`CommunityFeedScreen`의 `SafeAreaView edges`에 bottom이 없어 홈 인디케이터에 물림)
  - `ContestAllEntriesScreen` 신규 — 정렬 3종(최신순 기본·득표순·랜덤), 무한스크롤,
    로딩 스켈레톤/빈/에러 상태, 투표 토스트. 핸드오프 `ContestAllEntriesScreen.native.jsx` 참고
    (**주의**: 인라인 style 방식이라 NativeWind `className`으로 재작성 필요)
  - `ContestActiveTab`의 `onSeeAll`이 빈 함수라 "모두 보기" 버튼이 죽어 있음 → push 연결
- 완료 조건: 목업 `contest-all-entries.html` / `community-feed.html` 콘테스트 탭과 1:1 동일, 죽은 버튼 없음
- 검증 방법: `pnpm exec tsc --noEmit` / `pnpm lint`, 시뮬레이터에서 진행중 탭 → 모두 보기 → 투표 플로우

## 4) 검증 체크포인트

- [ ] Type check 통과 (`pnpm exec tsc --noEmit`)
- [ ] Lint 통과 (`pnpm lint`)
- [ ] 주요 사용자 시나리오(A~E) 수동 검증
- [ ] 회귀 영향 범위 점검 (`CommunityStack`/`MainTab` 변경으로 다른 탭 네비게이션 영향 없는지)

## 5) 롤백 계획

- 영향 파일: `src/screens/community/*`, `src/components/community/*`(신규), `src/navigation/stacks/CommunityStack.tsx`, `src/types/community.ts`, `src/components/common/*`(추가분)
- 되돌림 방법: 브랜치 `feature/community-ui` 단위로 리버트(신규 파일뿐이라 기존 화면에 대한 영향 없음, `ContestScreen.tsx` 삭제 이력만 git revert로 복원 가능)
- 데이터 영향: 없음 (로컬 mock, API 미연동)

## 6) PR 구성

- PR 제목(컨벤션): `feat(community): 커뮤니티 화면 UI 구현 (피드/게시글/작성/콘테스트/프로필)`
- 변경 요약(3줄 이내):
  - `community-feed`/`community-post`/`community-write`/`contest-all-entries`/`contest-result`/`user-profile` 6개 목업을 로컬 mock 기반 RN 화면으로 구현
  - 콘테스트를 독립 라우트에서 피드 내부 세그먼트로 재구성, `ContestResultScreen` 신설
  - 공통 컴포넌트(`BottomSheet`/`Chip`/`StarRating`/`InitialAvatar` 등) 재사용, 신규 필요분만 추가
- 리뷰 요청 포인트:
  - 콘테스트 라우트 재구성(기존 `Contest` → `ContestResult`) 방향 동의 여부
  - 라이트박스+EXIF 중첩 open/close 상태 관리 방식
  - 갤러리 세그먼트 포함 여부(목업 마크업 유무에 따른 스코프 조정)

## Plan File Path

`docs/ai/plans/feature/community-ui/community-ui-plan.md`

---

## 추가 (구현 완료 후 사용자 피드백으로 발생, 계획에 없었음)

### 갤러리 세그먼트 — "인기" 사진 동적 2x2 배치

- **배경**: 원래 `GALLERY_CELLS`는 목업의 `gallery-grid__cell--wide` 패턴을 그대로 재현해 5번째·15번째 칸을 좋아요 수와 무관하게 고정 2x2로 표시했음. 사용자 피드백: 실제 `likeCount` 기준 상위 N개가 동적으로 2x2가 되도록 변경.
- **brainstorming 스킬로 논의**: (1) 위치 완전 다이나믹 vs 고정 슬롯+동적 콘텐츠 → 완전 다이나믹 선택, (2) 인기 판정은 절대 임계값이 아닌 "상위 N개"(기본 N=2) 선택.
- **구현**:
  - `src/utils/galleryGrid.ts` — `layoutGalleryGrid(items, isPopular)` 순수 함수 신규 추가. 3열 커서를 좌→우/위→아래로 순회하며 인기 항목을 2x2로 배치(CSS `grid-auto-flow: dense`의 축소판). 인기 항목이 마지막 열(인덱스 2)에 걸리면 2x2가 안 들어가므로 다음 행 시작으로 밀고, 그때 비는 칸 1개는 뒤따르는 일반 항목을 한 칸 당겨와 채움 — 그 외엔 원래 순서 100% 유지.
  - `src/screens/community/CommunityFeedScreen.tsx` — `GALLERY_CELLS`에 `id`+`likeCount`(전체 18개 모두) 부여, `pickPopularIds()`로 좋아요 상위 2개 선정, `layoutGalleryGrid` 결과를 `position: absolute` 그리드로 렌더(기존 `flex-wrap` 방식은 2x2가 다음 줄까지 침범하는 걸 표현할 수 없어 교체).
- **검증**: 순수 함수라 자동 테스트 인프라 없이도 스크래치 스크립트로 인기 항목이 0/1/2번 열 각 위치에 걸리는 경우 + 인기 2개 동시 케이스에 대해 겹침 없이 배치되는지 확인(겹침 검증 통과). `pnpm exec tsc --noEmit` / `pnpm lint` 통과.

### 네비게이션 구조 변경 — PostDetail/CommunityWrite/ContestResult/UserProfile을 RootStack으로 이동

- **배경**: 시뮬레이터로 직접 확인하던 중, 이 4개 push 화면(스펙상 "탭바 미포함")에 하단 탭바가 계속 떠 있는 버그 발견. 원인: `CommunityStack`이 `MainTab`의 `Tab.Navigator` 안쪽에 있어서, 그 안에 등록된 화면은 전부 탭바 위에 그려짐.
- **수정**: `src/components/spot/`의 `SpotStack` 선례와 동일하게 `src/navigation/stacks/CommunityDetailStack.tsx`를 신설해 `PostDetail`/`CommunityWrite`/`ContestResult`/`UserProfile` 4개를 RootStack의 형제 스크린으로 분리. `CommunityStack`은 `CommunityFeed` 하나만 남김. `CommunityFeedScreen`의 진입 네비게이션은 `navigation.navigate('CommunityDetailStack', { screen, params })` 형태로 상위 네비게이터에 자동 전파(bubbling)되도록 변경(`src/screens/home/HomeScreen.tsx`가 `SpotStack` 진입 시 쓰는 것과 동일한 패턴).
- **검증**: `pnpm exec tsc --noEmit` / `pnpm lint` 통과.

### 레이아웃 버그 — `width:'%'` + `aspectRatio`를 같은 노드에 쓰면 flexWrap 그리드에서 높이가 안 잡힘

- **배경**: 콘테스트 진행중 탭의 "전체 출품작" 그리드가 정사각형 카드가 아니라 얇은 띠처럼 찌그러져 렌더링됨. 처음엔 mock 데이터 부족(4위 항목 1개만 있음)이 원인이라 판단해 그것만 고쳤으나, 실제로는 별개의 레이아웃 버그가 함께 있었음 — `width:'48.5%'`처럼 100% 미만의 퍼센트 너비와 `aspectRatio`를 **같은 노드**에 동시에 주면 `flexDirection:'row', flexWrap:'wrap'` 컨테이너 안에서 높이가 제대로 계산되지 않는 RN(Yoga) 이슈.
- **수정**: 갤러리 그리드(`layoutGalleryGrid`)에서 이미 쓰던 방식대로, `useWindowDimensions()`로 실제 화면 너비를 읽어 카드 한 변의 픽셀 크기를 직접 계산(`(windowWidth - 좌우패딩 - gap) / 열수`)해서 `width`/`height`에 각각 명시적으로 지정하고 `aspectRatio`는 제거. 동일 패턴이 있던 `ContestActiveTab.tsx`(2열), `src/screens/community/ContestResultScreen.tsx`(2열), `ProfilePostsTab.tsx`(3열) 3곳 모두 수정. `ContestPastTab.tsx`는 퍼센트 너비가 부모(`Pressable`)에, `aspectRatio`는 스트레치되는 자식(`View`)에 나뉘어 있어 같은 패턴이 아니라 이번엔 손대지 않음(추후 문제 확인되면 동일하게 수정).
- **검증**: `pnpm exec tsc --noEmit` / `pnpm lint` 통과. 실기기 재확인은 사용자가 진행 예정.

### 코드 리뷰 반영 — `superpowers:requesting-code-review` 서브에이전트 실행 결과

- Critical 이슈 없음. Important 4건 중 2건(피드 빈 상태 없음, 네비게이션 구조 변경 미문서화) 반영 — 피드에서 "팔로잉"/"내 글" 필터 결과가 0개일 때 안내 문구 추가, 네비게이션 변경은 위 섹션으로 문서화.
- 나머지 2건은 의도적 유지로 판단: (1) 정렬 드롭다운을 갤러리에선 숨긴 것 — 갤러리 mock 데이터엔 작성자/팔로잉 정보가 없어 4개 옵션 중 2개가 의미 없어지므로, 목업의 "게시글·갤러리 공용" 문구보다 실제 동작 가능 여부를 우선함(사용자에게 이미 고지·승인됨). (2) `sortPosts`의 "최신" 분기가 실제로 재정렬하지 않는 것 — `Post`에 정렬 가능한 타임스탬프 필드가 없고 mock 데이터가 이미 최신순으로 배열돼 있어 이번 스코프에서는 pass-through로 유지, 실제 정렬은 API 연동(생성일시 필드 포함) 이후 과제로 남김.

### 콘테스트 "진행중" 탭 — 핸드오프 "시안 1b" 반영 (`~/Desktop/handoff/`)

- **배경**: 디자인 쪽에서 콘테스트 진행중 탭을 별도 핸드오프(`golden-hour-contest.html` + `ContestTab.native.jsx` + `README.md`)로 다시 전달함 — 기존 `community-feed.html` 기반 구현(포디움 가로스크롤 + 확인/취소/한도초과 모달 + undo 스낵바)을 대체하는 새 시안.
- **주요 변경**:
  - 레이아웃: 히어로(목표 참여자 수 대비 진행률 바 추가) → 1위 단독 카드(238px) → 2·3위 나란히(150px) → "전체 출품작" 그리드(4위~, 196px) → "모두 보기" 버튼 → 하단 고정 CTA 바(72px, 출품 여부에 따라 "출품하기"/"교체하기")
  - 투표 방식이 확인 모달 있는 방식 → **낙관적 업데이트(즉시 반영, 확인 모달 없음)**로 변경 — README에 명시된 설계 의도. 그에 맞춰 투표 확인/취소/한도초과 `ConfirmModal` 3개와 undo 스낵바를 이 탭에서는 제거, 표 소진 시엔 pill이 `opacity 0.5` + `disabled`로만 표시
  - 사진 위 대비는 고정 스크림(`expo-linear-gradient`, 그라디언트 stop 값 README 그대로) + `textShadow`로 확보(핸드오프의 "흰 하늘/설경에서도 대비 유지" 요구사항)
  - 신규 타입 `ContestGoalInfo`/`ContestVoteEntry`(`src/types/community.ts`) — 기존 `ContestPhotoEntry`(라이트박스 전용)와는 별도. `ContestActiveInfo`는 더 이상 안 쓰여 삭제
  - 라이트박스는 기존 `ContestPhotoLightbox` 재사용(어댑터로 타입 변환), 투표도 동일하게 확인 없이 즉시 반영하도록 연결
  - 카드 사진은 실제 업로드본이 없어 원본의 `<Image>`를 프로젝트 관례대로 `LinearGradient` 플레이스홀더로 대체, gradient 색상 값은 핸드오프의 mock 데이터(`@haneul`/`@jin_00`/`@seoyeon`/`@dawnlee` 등)를 그대로 이식
- **검증**: `pnpm exec tsc --noEmit` / `pnpm lint` 통과.
