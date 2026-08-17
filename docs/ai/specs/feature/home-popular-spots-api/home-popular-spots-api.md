# 홈 인기 스팟 실 API 연동

## 1) 기능 정보

- 기능명: 홈 화면 인기 스팟 섹션 실 API 연동 + 섹션 제목 정정
- 담당자: `@yeni`
- 관련 이슈: `없음`
- 관련 도메인: `spot`
- 대상 플랫폼: iOS / Android

## 2) 문제와 목표

- 해결하려는 문제:
  - `PopularSpotsSection.tsx`가 `MOCK_SPOTS` 하드코딩 상태라 실제 스팟이 노출되지 않는다.
  - 섹션 제목이 "이번 주 인기 스팟"이지만 **백엔드에 주간 집계 개념이 없다.**
    `SpotService.resolveSort()`는 `bookmarkCount DESC, reviewCount DESC` 누적값 정렬만 하고,
    `Spot.bookmarkCount`는 리셋 경로가 없는 누적 컬럼이며 재집계 스케줄러도 없다.
    즉 화면 문구가 서버 동작과 다른 것을 약속하고 있다.
- 사용자 가치: 홈 첫 화면에서 실제로 북마크·리뷰가 많은 스팟을 보고 상세로 진입할 수 있다.
- 완료 기준(한 줄): 홈 인기 스팟 섹션이 서버 데이터로 렌더되고, 제목이 "인기 스팟"으로 바뀌며, 로딩/에러/빈 상태가 처리된다.

## 3) 범위

- 포함(In Scope):
  - 섹션 제목 `이번 주 인기 스팟` → `인기 스팟` (RN 화면 + HTML 목업 동기화)
  - 인기 스팟 목록 서버 조회 (`sort=popular`, `size=10`)
  - `SpotResponse` → 카드 표시 모델 매핑 (`location` / `rating` / `photoScore` / 이미지)
  - 로딩(스켈레톤) · 에러(재시도) · 빈 상태 처리
  - 기존 `onSpotPress` 상세 진입 경로 유지 (서버 `id` 기준)
  - **카드 북마크(즐겨찾기) 서버 연동** — 스팟 상세와 동일한 `BookmarkSheet` 재사용
    (백엔드 `SpotResponse.isBookmarked` 추가로 차단 요소가 해소돼 범위에 포함.
     백엔드 브랜치: `PNG_backend` `feature/spot-response-is-bookmarked`)
- 제외(Out of Scope):
  - **주간(최근 7일) 집계** — 백엔드에 집계 쿼리가 없어 프론트에서 불가. 별도 백엔드 티켓.
  - `HOT` / `NEW` 배지 — 서버 `badge`는 관광공사 인증 여부(boolean)라 의미가 다르다. 이번엔 배지 미표시.
  - 비로그인 사용자의 북마크 유도(로그인 모달·토스트) — 아이콘 자체를 숨기는 것으로 대체
  - "모두 보기"(`onViewAll`) 목록 화면 — `spot-list.html` 목업만 있고 RN 화면 없음.
  - 홈 카테고리 필터와 인기 스팟 섹션의 연동 (API는 `category`를 받지만 이번엔 미연결)

## 4) 사용자 시나리오

- 시나리오 A — 정상 조회
  - Given: 홈 화면에 진입한다 (로그인 여부 무관)
  - When: 인기 스팟 섹션이 마운트된다
  - Then: 서버가 내려준 최대 10개 스팟이 가로 스크롤 카드로 보이고, 제목은 "인기 스팟"이다
- 시나리오 B — 조회 실패
  - Given: 네트워크 오류 또는 서버 5xx
  - When: 인기 스팟 조회가 실패한다
  - Then: 섹션 자리에 안내 문구와 "다시 시도"가 보이고, 탭하면 재조회한다
- 시나리오 C — 결과 없음
  - Given: 승인된 활성 스팟이 0건
  - When: 조회가 성공하고 빈 배열이 온다
  - Then: "아직 인기 스팟이 없어요" 한 줄이 보이고 빈 캐러셀은 렌더되지 않는다
- 시나리오 D — 상세 진입
  - Given: 카드 목록이 보인다
  - When: 카드를 탭한다
  - Then: 서버 `id`로 `SpotStack > SpotDetail`이 열린다 (기존 동작 유지)

## 5) UI/UX 요구사항

- 참조 목업 파일:
  - `src/components/ui/home/home.html` (인기 스팟 섹션, L1119)
- 화면 전환 규칙: 카드 탭 → `SpotDetail` (기존 `HomeScreen`의 `onSpotPress` 그대로)
- 빈 상태: 섹션 헤더는 유지하고 본문에 안내 1줄 (`rgba(0,0,0,0.4)`, `FONT_MD`)
- 에러 상태: 안내 1줄 + "다시 시도" 텍스트 버튼 (`#E31B59`)
- 로딩 상태: 기존 `src/components/common/Skeleton.tsx`로 카드 자리 3개 표시 (가로 스크롤 위치 유지)
- 카드 이미지: `thumbnailUrl ?? imageUrl`이 있으면 사진, 없으면 기존 그라디언트 폴백
- 배지: 이번 스코프에서는 표시하지 않음 (SpotCard의 `badge`는 optional이라 미전달로 충분)

## 6) 데이터/API 요구사항

- 사용 API:
  - `src/api/spot.ts` 함수명: `spotApi.getSpots({ sort: 'popular', size: 10 })`
  - 훅: `src/hooks/useSpot.ts`의 기존 `useSpots`
  - **엔드포인트 선택 근거**: 백엔드에 `GET /spots/popular`가 있지만, `GET /spots?sort=popular`가
    `SpotService.resolveSort()`의 **동일한 정렬 로직**을 타고 같은 결과를 준다. 이미 있는
    `spotApi.getSpots`/`useSpots`를 그대로 써서 신규 API 함수·훅·타입을 0개로 유지한다.
    (전용 래퍼는 백엔드가 `/spots/popular`에 별도 로직을 넣는 시점에 추가)
- 요청/응답 핵심 필드:
  - 요청: `sort=popular`, `size=10`, `page=0`
  - 응답: `PageSpotResponse` (`content: SpotResponse[]`) — 타입은 `src/types/spot.ts:419`에 이미 정의됨
  - 사용 필드: `id` `name` `address` `categories` `reviewAverage` `reviewCount` `thumbnailUrl` `imageUrl`
    `isBookmarked`(토큰 동봉 요청에서만 채워짐 — 비로그인·구버전 서버는 `undefined` → `false` 폴백)
- 실패 처리 방식: `useQuery`의 `isError`로 섹션 내 인라인 에러 + `refetch()`. 토스트/모달 없음.
- 캐싱/무효화 전략: `useSpots`의 기존 `staleTime: 60s` 사용. 추가로 즐겨찾기 저장 성공 시
  `useSyncSpotBookmarks.onSuccess`가 `['spots','list']`를 무효화한다 — 카드의 채워짐 상태가 목록 응답의
  `isBookmarked`에서 오므로, 홈·상세 어느 쪽에서 바꾸든 목록 재조회가 있어야 반영된다.
  무효화를 화면이 아니라 mutation에 둔 이유: 홈은 상세 진입 중에도 마운트를 유지해 자체 refetch 트리거가 없다.

## 7) 상태 관리

- 서버 상태: TanStack Query (`useSpots`) — 신규 쿼리 키 없음, 기존 `['spots','list',...]` 재사용
- 클라이언트 상태(Zustand): 없음
- 영속화 필요 여부: 없음

## 8) 기술 제약 체크

- [ ] NativeWind `className`만 사용 — *현행 `PopularSpotsSection`/`SpotCard`는 인라인 style 기반. 이번 변경분은 기존 파일 컨벤션을 따르고 전면 리팩터링은 하지 않는다.*
- [ ] `StyleSheet.create()` 미사용
- [ ] `@/` alias 사용
- [ ] 타입 정의 명확 (`any` 금지)
- [ ] 디자인 토큰 준수 (`#E31B59`, `FONT_*`, `GRID_PADDING`)

## 9) 수용 기준 (Acceptance Criteria)

- [ ] AC1: 섹션 제목이 "인기 스팟"이고, RN·HTML 목업 양쪽에서 "이번 주"가 제거됐다
- [ ] AC2: `MOCK_SPOTS` 상수가 코드에서 삭제되고 서버 응답으로 카드가 렌더된다
- [ ] AC3: 카드의 지역·평점·포토제닉 지수가 각각 `address` · `reviewAverage` · `photogenicScore`에서 온다
- [ ] AC4: 로딩·에러·빈 상태 3가지가 모두 화면에 구현돼 있다
- [ ] AC5: 카드 탭 시 서버 `id`로 스팟 상세가 열린다
- [ ] AC6: `pnpm exec tsc --noEmit`, `pnpm lint` 통과
- [ ] AC7: 로그인 상태에서 카드 북마크 아이콘 탭 → 스팟 상세와 같은 `BookmarkSheet`가 열리고, 저장하면
      아이콘 채워짐이 유지된다(화면 재진입·상세 화면과 상태 일치)
- [ ] AC8: 비로그인 상태에서는 카드에 북마크 아이콘이 표시되지 않는다

## 10) 테스트 시나리오

- 정상 케이스: 서버 10건 응답 → 카드 10개, 가로 스크롤 동작
- 경계 케이스:
  - `reviewAverage`가 0 또는 null → 별 0개 + `0.0` 표기, 크래시 없음
  - `address`가 빈 문자열 → 지역 라벨 없이 카테고리만 표시
  - `thumbnailUrl`·`imageUrl` 모두 null → 그라디언트 폴백
  - 응답 1건 → 캐러셀 좌우 패딩 유지
- 실패 케이스: 네트워크 차단 상태로 홈 진입 → 인라인 에러, "다시 시도" 후 복구

## 11) 오픈 이슈 / 결정 필요

- **주간 인기 집계는 백엔드 신규 작업**: `bookmark`/`review` 테이블의 `createdAt` 기준 최근 7일 count 쿼리가 필요.
  스팟 테이블의 누적 컬럼만으로는 불가능. 서버가 제공되면 제목을 다시 "이번 주 인기 스팟"으로 되돌리고
  `HOT` 배지(주간 급상승) 규칙도 함께 정의한다.
- 백엔드 `docs/api-specification.md`의 `/spots/popular` 상태가 `미시작`으로 남아 있음 → 실제로는 구현 완료. 백엔드 문서 갱신 요청 필요.
- 홈 카테고리 필터를 인기 스팟에도 적용할지 (API는 `category` 지원) — 기획 확인 후 별도 티켓.
