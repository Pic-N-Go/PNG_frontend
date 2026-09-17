# 기능 스펙 — 홈 화면

## 1) 기능 정보

- 기능명: 홈 화면 React Native 구현
- 담당자: @lucy
- 관련 이슈: 없음
- 관련 도메인: `spot`, `search`
- 대상 플랫폼: iOS / Android

## 2) 문제와 목표

- 해결하려는 문제: `HomeScreen.tsx`가 빈 컴포넌트 상태 — 앱 진입 후 아무것도 보이지 않음
- 사용자 가치: 포토스팟 탐색의 시작점 제공 (날씨 요약, 인기 스팟, 출사 캘린더)
- 완료 기준(한 줄): `home.html` 목업의 모든 섹션이 RN으로 구현되고, 검색/카테고리 인터랙션이 동작한다
  - 카테고리 필터는 이후 제거됨 → 아래 In Scope 주석 참고

## 3) 범위

- 포함(In Scope):
  - Hero 섹션 (골든아워 그라디언트 + 날씨 텍스트 + 상단 네비)
  - 검색 바 (탭 → SearchResultScreen 이동)
  - ~~카테고리 필터 (수평 스크롤, 단일 선택)~~ → **제거됨**. 선택값(`selectedCategory`)이 어떤 목록도
    거르지 않아 표시만 되던 UI였다. `components/home/CategoryFilter.tsx`도 함께 삭제 (2026-09-17 회의 3번)
  - 주변 스팟 지도 배너 (정적 UI, 탭 → MapScreen 이동)
  - 인기 스팟 가로 스크롤 (작성 시점 목업 데이터 + 북마크 토글 UI → 이후 `useSpots` 실 API와
    서버 북마크로 대체됨, 아래 Out of Scope 참고)
  - 출사 캘린더 2열 그리드 (목업 데이터)
  - 위시리스트 배너 (탭 액션 — 네비게이션 stub)
  - SearchResultScreen: 포커스 패널(최근/인기 검색어) + 결과 패널 (목업 데이터)
    - 이후 인기 검색어는 제거되고 그 자리에 추천 스팟이 들어옴 — 검색 로그 집계 API가 없어
      순위를 지어낼 수밖에 없었다. 최근 검색·추천 스팟은 `components/common/SearchPanel.tsx` 공용
  - 필터 바텀시트 (UI + 로컬 상태만, API 연동 없음)
- 제외(Out of Scope):
  - ~~실제 날씨 API 연동~~ → **연동 완료** (2026-09-17). `GET /weather/current`로 히어로 날씨 줄을
    실데이터로 교체. `api/weather.ts` + `hooks/useCurrentWeather.ts`
  - 지도(MapScreen) 구현 — 별도 이슈
  - 인기 스팟 / 캘린더 실제 API 연동
    - 인기 스팟은 이후 `docs/ai/specs/feature/home-popular-spots-api/home-popular-spots-api.md`에서 연동 완료
      (섹션 제목도 "이번 주 인기 스팟" → "인기 스팟"으로 정정 — 서버에 주간 집계가 없음)
  - 탭바 스타일링 — MainTab 네비게이터에서 처리
  - 위시리스트 화면 구현

## 4) 사용자 시나리오

- 시나리오 A — 홈 탐색:
  - Given: 로그인된 사용자가 홈 탭 진입
  - When: 화면 스크롤
  - Then: 히어로, 검색바, 지도 배너, 인기 스팟, 캘린더, 위시리스트 배너가 순서대로 보인다

- ~~시나리오 B — 카테고리 필터~~ → 카테고리 필터 제거로 폐기

- 시나리오 B' — 당겨서 새로고침:
  - Given: 홈 화면
  - When: 화면을 아래로 당김
  - Then: 스피너가 돌고 날씨·주변 스팟·인기 스팟 등 마운트된 쿼리가 갱신된다

- 시나리오 C — 검색:
  - Given: 홈 화면
  - When: 검색 바 탭
  - Then: SearchResultScreen으로 이동, 최근 검색 + 추천 스팟 포커스 패널 노출
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
- 로딩 상태: 작성 시점 API 미연동이라 불필요했음. 인기 스팟 연동 후 해당 섹션만 스켈레톤 3개 + 에러 재시도 + 빈 상태를 가진다

## 6) 데이터/API 요구사항

- 이번 구현은 목업 데이터(하드코딩 상수)만 사용
- 추후 연동 예정 API:
  - ~~`GET /spots/popular` — 인기 스팟~~ → 연동 완료. 전용 엔드포인트 대신
    `GET /spots?sort=popular`(`useSpots`)를 재사용한다 (백엔드가 동일한 `resolveSort()`를 탐).
    로딩 스켈레톤·에러 재시도·빈 상태 포함 → `home-popular-spots-api.md`
  - `GET /calendar/events` — 출사 캘린더
  - ~~`GET /weather/current` — 날씨 요약~~ → 연동 완료. `region · weatherStatus · fineDust.grade ·
    goldenHour`를 히어로 한 줄로 조립한다. 서버가 항목별 실패를 허용하므로 온 필드만 이어 붙인다
  - `GET /search?q=` — 스팟 검색

## 7) 상태 관리

- 서버 상태: 작성 시점 없음. 이후 인기 스팟만 TanStack Query(`useSpots`) 연동됨 — 나머지 섹션은 여전히 목업
- 클라이언트 상태(Zustand): 최근 검색어만 `useSearchStore`(persist)를 쓴다 — 홈·지도·커뮤니티가 공유한다.
  카테고리 선택 state는 필터 제거와 함께 삭제됨
- 영속화 필요 여부: 없음

## 8) 기술 제약 체크

- [ ] NativeWind `className`만 사용
- [ ] `StyleSheet.create()` 미사용
- [ ] `@/` alias 사용
- [ ] 타입 정의 명확
- [ ] 디자인 토큰 준수 (`#E31B59`, 52px 버튼, Pretendard 폰트 등)

## 9) 수용 기준 (Acceptance Criteria)

- [ ] AC1: `home.html`의 6개 섹션(히어로/검색/지도배너/인기스팟/캘린더/위시리스트 배너)이
      모두 렌더링된다 (카테고리 섹션은 제거됨)
- [ ] AC2: ~~카테고리 탭 단일 선택 동작~~ → 폐기. 대신 히어로 날씨 줄이 `GET /weather/current`
      실데이터로 렌더링되고, 당겨서 새로고침이 동작한다
- [ ] AC3: 검색바 탭 → SearchResultScreen 이동, 포커스 패널(최근 검색 + 추천 스팟) 노출
- [ ] AC4: 검색어 입력 후 제출 → 결과 패널 전환, 결과 없음 상태 처리
- [ ] AC5: 지도 배너 탭 → MapScreen 이동
- [ ] AC6: `tsc --noEmit` 통과, `pnpm lint` 통과

## 10) 테스트 시나리오

- 정상 케이스: 홈 진입 → 전 섹션 렌더링, 당겨서 새로고침, 검색 → 결과
- 경계 케이스: 검색어 없음 결과, 검색어 공백 제출 (무시)
- 실패 케이스 (`GET /weather/current`):
  - 요청 전체 실패 또는 좌표 없음(위치 권한 거부) → 히어로 날씨 줄을 **그리지 않고** 나머지 섹션은 정상 렌더링
  - 응답 필드 일부 null(`region`/`weatherStatus`/`fineDust`/`goldenHour`) → 받은 항목만 이어 붙여 표시
  - 당겨서 새로고침 재요청 실패 → 직전 응답을 그대로 유지 (줄이 사라지지 않음)

## 11) 오픈 이슈 / 결정 필요

- 알림 화면 네비게이션 경로 미확정 → TODO 처리
- 스팟 상세 이동 파라미터 미확정 → TODO 처리
- 위시리스트 탭 이동 경로 미확정 → TODO 처리
