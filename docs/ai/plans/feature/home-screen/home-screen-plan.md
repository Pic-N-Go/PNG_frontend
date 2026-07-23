# 구현 계획 — 홈 화면

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/feature/home-screen/home-screen.md`
- 관련 도메인: `spot`, `search`
- 관련 목업: `src/components/ui/home/home.html`
- 완료 목표: 홈 화면 전 섹션 RN 구현 + SearchResultScreen 완성, tsc/lint 통과

## 2) 구현 전략

- 핵심 접근: `LoginScreen.tsx` 패턴 그대로 적용 — NativeWind + layout constants + normalizeFontSize. 목업 데이터 상수로 선언 후 UI 완성, API 연동은 TODO 처리
- 리스크: 홈 화면 섹션이 많아 HomeScreen.tsx 파일이 길어질 수 있음
- 리스크 완화: 섹션별 서브컴포넌트(`src/components/home/`)로 분리해 가독성 확보

### 스타일 규칙 (모든 Task 공통 적용)

- **레이아웃 상수** — 모든 고정 수치는 `src/constants/layout.ts`에서 import해 사용
  - 패딩: `CONTENT_PADDING`(28px), `GRID_PADDING`(20px)
  - 카드: `CARD_RADIUS`(16px)
  - 탭바 여백: `TAB_BAR_HEIGHT`(80px) + `insets.bottom` — ScrollView `paddingBottom`에 반영
  - 스페이싱: `SPACING_XS/SM/MD/LG/XL`
  - 아이콘: `ICON_SM/MD/LG`
- **폰트 크기** — `normalizeFontSize(n)` from `src/utils/normalize.ts`, 또는 `FONT_XS/SM/MD/LG/XL/2XL` 상수
  - 목업 CSS 변수 → 상수 매핑: `--font-2xs` → `normalizeFontSize(10)`, `--font-xs` → `FONT_XS`, `--font-sm` → `FONT_SM`, `--font-base` → `FONT_MD`, `--font-lg` → `FONT_LG`, `--font-xl` → `FONT_XL`
- **레이아웃 크기** — `normalize(n)` from `src/utils/normalize.ts` (고정 px 수치에 사용)
- 참조 문서: `docs/guide/dev/device-support.md` (360~430dp 스케일링 기준)

### Android Safe Area

- `SafeAreaProvider`는 `App.tsx`에 이미 세팅됨
- `@react-navigation/bottom-tabs`가 Safe Area를 자동 처리하므로 탭바 자체는 별도 처리 불필요
- 단, HomeScreen의 ScrollView `contentContainerStyle`에 `paddingBottom: TAB_BAR_HEIGHT + insets.bottom`를 반영해 콘텐츠가 탭바와 홈 인디케이터에 가리지 않게 할 것 (`insets`는 `useSafeAreaInsets()`)
- Hero처럼 Safe Area 위로 올라가는 영역은 `useSafeAreaInsets()` 사용

## 3) 작업 태스크

### Task 1 — 공통 탭바 커스텀 (MainTab)

- 대상 파일:
  - `src/navigation/MainTab.tsx`
  - `src/components/common/TabBar.tsx` (신규)
- 변경 내용:
  - `TabBar.tsx`: `@react-navigation/bottom-tabs`의 `tabBar` prop에 주입할 커스텀 컴포넌트
    - 탭 아이템: 홈(house), 지도(map), 출사(route), 커뮤니티(message-circle), MY(user) — Feather 아이콘
    - 활성 탭: 아이콘 + 레이블 `#E31B59`, 비활성: `rgba(0,0,0,0.35)`
    - 높이: `TAB_BAR_HEIGHT`(80px) + `insets.bottom` (Android/iPhone 하단 Safe Area 자동 반영)
    - 상단 border: `0.5px solid rgba(0,0,0,0.08)`, 배경 `#fff`
    - 레이블 폰트: `normalizeFontSize(10)`, Pretendard-Medium
  - `MainTab.tsx`: `tabBar` prop에 `TabBar` 컴포넌트 주입, `tabBarStyle` 등 기존 기본 스타일 제거
  - 다른 화면에서 탭바를 직접 렌더링하지 않고 `MainTab`의 네비게이터가 자동 표시하므로 팀원이 별도 import 없이 사용 가능
- 완료 조건: 5개 탭 아이콘/레이블 렌더링, 활성 탭 색상 변경, iOS/Android Safe Area 여백 정상
- 검증 방법: tsc + lint, TODO: iOS 시뮬레이터 + Android 에뮬레이터에서 하단 여백 육안 확인

### Task 2 — 타입 정의

- 대상 파일:
  - `src/types/spot.ts`
- 변경 내용:
  - `SpotItem` 타입 추가 (id, name, location, category, rating, photoScore, badge?, isBookmarked)
  - `CalendarEvent` 타입 추가 (id, dateRange, eventName, place, tip, photoScore, tag, headerColor)
  - `CategoryItem` 타입 추가 (id, label)
- 완료 조건: 타입 export, tsc 통과
- 검증 방법: `pnpm exec tsc --noEmit`

### Task 3 — Hero 섹션 + 검색바 + 카테고리 필터

- 대상 파일:
  - `src/screens/home/HomeScreen.tsx`
  - `src/components/home/HeroSection.tsx` (신규)
  - `src/components/home/SearchBar.tsx` (신규)
  - `src/components/home/CategoryFilter.tsx` (신규)
- 변경 내용:
  - HeroSection: LinearGradient(로그인 화면 동일 색상), 별/태양/지형 레이어, 상단 네비(로고 + 알림), 제목/날씨 텍스트 (목업 하드코딩)
  - SearchBar: `#F5F5F7` 배경 pill, 검색 아이콘, 필터 버튼 → 탭 시 FilterBottomSheet 열기
  - CategoryFilter: `ScrollView horizontal`, 선택 상태 `#E31B59` pill
  - HomeScreen: ScrollView 래퍼, 세 컴포넌트 조합
- 완료 조건: 히어로 그라디언트 렌더링, 카테고리 단일 선택 동작
- 검증 방법: tsc + lint, TODO: iOS/Android 시뮬레이터 육안 확인

### Task 4 — 지도 배너 + 인기 스팟 섹션

- 대상 파일:
  - `src/components/home/MapBanner.tsx` (신규)
  - `src/components/home/SpotCard.tsx` (신규)
  - `src/components/home/PopularSpotsSection.tsx` (신규)
  - `src/screens/home/HomeScreen.tsx`
- 변경 내용:
  - MapBanner: `#E8E8ED` 배경, SVG 격자/도로선, 핀(분홍), 현위치 점, 배너 탭 → `navigation.navigate('Map')`
  - SpotCard: 220px 너비, 사진 영역(그라디언트 배경), badge(HOT/NEW), 북마크 토글 UI, 이름/위치/별점/포토제닉 지수
  - PopularSpotsSection: FlatList horizontal, 목업 스팟 3개
  - HomeScreen: 두 섹션 추가
- 완료 조건: 지도 배너 탭 네비게이션 동작, 스팟 카드 북마크 토글 UI 동작
- 검증 방법: tsc + lint, TODO: 스팟 카드 탭 → 스팟 상세 네비게이션 (경로 미확정, TODO 처리)

### Task 5 — 캘린더 섹션 + 위시리스트 배너

- 대상 파일:
  - `src/components/home/CalendarSection.tsx` (신규)
  - `src/components/home/WishlistBanner.tsx` (신규)
  - `src/screens/home/HomeScreen.tsx`
- 변경 내용:
  - CalendarSection: 2열 grid(`flexDirection: row`, `flexWrap: wrap`), CalCard (헤더 색상 props), 섹션 타이틀/부제
  - WishlistBanner: `#F5F5F7` 배경, 아이콘 + 텍스트 + 화살표, 탭 → TODO 처리
  - HomeScreen: 두 컴포넌트 추가, bottom padding
- 완료 조건: 캘린더 카드 2열 렌더링, 위시리스트 배너 레이아웃
- 검증 방법: tsc + lint

### Task 6 — 필터 바텀시트

- 대상 파일:
  - `src/components/home/FilterBottomSheet.tsx` (신규)
  - `src/screens/home/HomeScreen.tsx`
- 변경 내용:
  - Modal 기반 바텀시트 (LoginScreen의 비밀번호 찾기 패턴 재사용)
  - 필터 그룹: 거리(단일선택), 시간대(복수선택), 날씨(복수선택), 포토제닉스코어(단일선택)
  - 초기화 / 적용 버튼
  - 적용 시 활성 필터 수를 SearchBar의 배지에 전달
- 완료 조건: 필터 바텀시트 열기/닫기, 선택/초기화/적용 동작
- 검증 방법: tsc + lint, TODO: 실제 필터링은 API 연동 시 구현

### Task 7 — SearchResultScreen

- 대상 파일:
  - `src/screens/search/SearchResultScreen.tsx`
- 변경 내용:
  - `query` 파라미터 없거나 빈 문자열 → 포커스 패널 (최근 검색어 + 인기 검색어 목업)
  - `query` 있음 → 결과 패널 (결과 목록 목업, 결과 없음 빈 상태)
  - 검색 입력창, 취소 버튼, 뒤로가기
  - 최근 검색어: 로컬 `useState` 배열, 항목 삭제/전체 삭제
- 완료 조건: 포커스→결과 전환, 빈 상태 UI, 취소 시 HomeScreen 복귀
- 검증 방법: tsc + lint, TODO: 실제 검색 API 연동

## 4) 검증 체크포인트

- [ ] `pnpm exec tsc --noEmit` 통과
- [ ] `pnpm lint` 통과
- [ ] 탭바 5개 탭 아이콘/레이블 정상 렌더링, 활성 탭 `#E31B59` 색상 (수동)
- [ ] iOS/Android 하단 Safe Area 여백 정상 (탭바가 시스템 바에 가리지 않음) (수동)
- [ ] 카테고리 단일 선택 동작 (수동)
- [ ] 검색 포커스 패널 → 결과 패널 전환 (수동)
- [ ] 지도 배너 탭 → MapScreen 이동 (수동)
- [ ] 필터 바텀시트 열기/닫기/초기화 (수동)

## 5) 롤백 계획

- 영향 파일: `src/navigation/MainTab.tsx`, `src/screens/home/HomeScreen.tsx`, `src/screens/search/SearchResultScreen.tsx`, `src/types/spot.ts`, `src/components/common/TabBar.tsx` (신규), `src/components/home/` (신규 파일들)
- 되돌림 방법: `git restore src/navigation/MainTab.tsx src/screens/home/HomeScreen.tsx src/screens/search/SearchResultScreen.tsx src/types/spot.ts` + `git clean -fd src/components/home/ src/components/common/`
- 데이터 영향: 없음 (목업 데이터만)

## 6) PR 구성

- PR 제목(컨벤션): `feat: 홈 화면 React Native 구현`
- 변경 요약: 공통 탭바 커스텀 컴포넌트 구현, 홈 화면 전 섹션(히어로/검색/카테고리/지도배너/인기스팟/캘린더) RN 구현, SearchResultScreen 포커스+결과 패널, 필터 바텀시트 UI 완성 (목업 데이터 기반)
- 리뷰 요청 포인트:
  - TabBar Safe Area 처리 방식 (iOS/Android 모두 확인 필요)
  - MapBanner SVG 렌더링 방식 (RN SVG vs View 조합)
  - 필터 상태 관리 위치 (로컬 useState vs Zustand)
