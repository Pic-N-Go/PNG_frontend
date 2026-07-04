# 기능 스펙 — 홈 화면

## 1) 기능 정보

- 기능명: 홈 화면 React Native 구현
- 담당자: @lucy
- 관련 이슈: 없음
- 대상 플랫폼: iOS / Android

## 2) 문제와 목표

- 해결하려는 문제: `HomeScreen.tsx`가 빈 컴포넌트 상태 — 앱 진입 후 아무것도 보이지 않음
- 사용자 가치: 포토스팟 탐색의 시작점 제공 (날씨 요약, 인기 스팟, 출사 캘린더)
- 완료 기준(한 줄): `home.html` 목업의 모든 섹션이 RN으로 구현되고, 검색/카테고리 인터랙션이 동작한다

## 3) 범위

- 포함(In Scope):
  - Hero 섹션 (골든아워 그라디언트 + 날씨 텍스트 + 상단 네비)
  - 검색 바 (탭 → SearchResultScreen 이동)
  - 카테고리 필터 (수평 스크롤, 단일 선택)
  - 주변 스팟 지도 배너 (정적 UI, 탭 → MapScreen 이동)
  - 인기 스팟 가로 스크롤 (목업 데이터, 북마크 토글 UI)
  - 출사 캘린더 2열 그리드 (목업 데이터)
  - 위시리스트 배너 (탭 액션 — 네비게이션 stub)
  - SearchResultScreen: 포커스 패널(최근/인기 검색어) + 결과 패널 (목업 데이터)
  - 필터 바텀시트 (UI + 로컬 상태만, API 연동 없음)
- 제외(Out of Scope):
  - 실제 날씨 API 연동
  - 지도(MapScreen) 구현 — 별도 이슈
  - 인기 스팟 / 캘린더 실제 API 연동
  - 탭바 스타일링 — MainTab 네비게이터에서 처리
  - 위시리스트 화면 구현

## 4) 사용자 시나리오

- 시나리오 A — 홈 탐색:
  - Given: 로그인된 사용자가 홈 탭 진입
  - When: 화면 스크롤
  - Then: 히어로, 검색바, 카테고리, 지도 배너, 인기 스팟, 캘린더, 위시리스트 배너가 순서대로 보인다

- 시나리오 B — 카테고리 필터:
  - Given: 홈 화면
  - When: 카테고리 필 탭
  - Then: 선택된 필 만 `#E31B59` 활성 상태로 변경

- 시나리오 C — 검색:
  - Given: 홈 화면
  - When: 검색 바 탭
  - Then: SearchResultScreen으로 이동, 최근/인기 검색어 포커스 패널 노출
  - When: 키워드 입력 후 검색
  - Then: 결과 패널으로 전환, 목업 결과 목록 노출

## 5) UI/UX 요구사항

- 참조 목업 파일: `src/components/ui/home/home.html`
- 화면 전환 규칙:
  - 검색바 탭 → `navigation.navigate('SearchResult', { query: '' })`
  - 지도 배너 탭 → `navigation.navigate('Map')`
  - 스팟 카드 탭 → `navigation.navigate('SpotStack', ...)` (stub — 아직 파라미터 미확정)
  - 알림 아이콘 탭 → stub (네비게이션 연결 없음, TODO 표시)
- 빈 상태: 검색 결과 없음 — "검색 결과가 없어요" 안내 UI
- 로딩 상태: API 미연동이므로 이번 이슈에서는 로딩 상태 불필요

## 6) 데이터/API 요구사항

- 이번 구현은 목업 데이터(하드코딩 상수)만 사용
- 추후 연동 예정 API:
  - `GET /spots/popular` — 인기 스팟
  - `GET /calendar/events` — 출사 캘린더
  - `GET /weather/current` — 날씨 요약
  - `GET /search?q=` — 스팟 검색

## 7) 상태 관리

- 서버 상태: 없음 (목업 데이터)
- 클라이언트 상태(Zustand): 없음 — 카테고리 선택, 검색어는 로컬 useState로 충분
- 영속화 필요 여부: 없음

## 8) 기술 제약 체크

- [ ] NativeWind `className`만 사용
- [ ] `StyleSheet.create()` 미사용
- [ ] `@/` alias 사용
- [ ] 타입 정의 명확
- [ ] 디자인 토큰 준수 (`#E31B59`, 52px 버튼, Pretendard 폰트 등)

## 9) 수용 기준 (Acceptance Criteria)

- [ ] AC1: `home.html`의 6개 섹션(히어로/검색/카테고리/지도배너/인기스팟/캘린더)이 모두 렌더링된다
- [ ] AC2: 카테고리 탭 단일 선택 동작, 활성 상태 `#E31B59` 강조
- [ ] AC3: 검색바 탭 → SearchResultScreen 이동, 포커스 패널(최근/인기 검색어) 노출
- [ ] AC4: 검색어 입력 후 제출 → 결과 패널 전환, 결과 없음 상태 처리
- [ ] AC5: 지도 배너 탭 → MapScreen 이동
- [ ] AC6: `tsc --noEmit` 통과, `pnpm lint` 통과

## 10) 테스트 시나리오

- 정상 케이스: 홈 진입 → 전 섹션 렌더링, 카테고리 선택, 검색 → 결과
- 경계 케이스: 검색어 없음 결과, 검색어 공백 제출 (무시)
- 실패 케이스: 없음 (API 미연동이므로)

## 11) 오픈 이슈 / 결정 필요

- 알림 화면 네비게이션 경로 미확정 → TODO 처리
- 스팟 상세 이동 파라미터 미확정 → TODO 처리
- 위시리스트 탭 이동 경로 미확정 → TODO 처리
