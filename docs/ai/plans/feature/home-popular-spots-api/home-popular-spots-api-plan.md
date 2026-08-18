# 홈 인기 스팟 실 API 연동 — 구현 계획

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/feature/home-popular-spots-api/home-popular-spots-api.md`
- 관련 도메인: `spot`
- 관련 목업: `src/components/ui/home/home.html` (L1119 인기 스팟 섹션)
- 완료 목표: 홈 인기 스팟 섹션이 서버 데이터로 렌더되고 제목이 "인기 스팟"으로 바뀐다. 로딩/에러/빈 상태 포함.

## 2) 구현 전략

- 핵심 접근:
  - **신규 API 함수·훅·쿼리 키를 만들지 않는다.** `spotApi.getSpots` / `useSpots`가 이미 `sort: 'popular'`를
    지원하고, 백엔드에서 `/spots?sort=popular`와 `/spots/popular`는 `SpotService.resolveSort()`의 동일
    정렬 로직을 탄다. 섹션에서 `useSpots({ sort: 'popular', size: 10 })` 한 줄이면 끝.
  - 매핑은 `src/utils/spotMappers.ts`에 `mapPopularSpot` 하나만 추가하고, 지역 라벨은 이미 있는
    `regionLabelFrom`을 export해서 재사용한다 (시·도 축약 로직 중복 작성 금지).
  - 서버가 못 주는 필드(`HOT`/`NEW` 배지, `isBookmarked`)는 **만들어내지 않고 표시에서 뺀다.**
- 리스크:
  1. `SpotItem`은 홈 목업 전용 타입이라 `gradientColors`·`badge`가 필수 → 서버 데이터로 못 채운다.
  2. `SpotCard`가 이미지 렌더 경로 없이 그라디언트만 그린다 → 실제 사진이 안 나온다.
  3. 제목만 바꾸고 끝내면 "왜 순위가 안 바뀌지?" 질문이 반복된다 (누적 집계라는 사실이 코드에 안 남음).
- 리스크 완화:
  1. `SpotItem`의 `gradientColors`·`badge`를 optional로 낮추고 `imageUrl`을 추가 (호출부 3곳뿐, 컴파일러가 잡아줌).
  2. `SpotCard`에 `Image` 한 겹만 올리고 URL 없을 때 기존 그라디언트로 폴백.
  3. 섹션 코드에 `ponytail:` 주석으로 "서버는 누적 인기순, 주간 집계 없음 + 백엔드 티켓" 명시.

## 3) 작업 태스크

### Task 1 — 타입/매퍼 정리 (약 45분)

- 대상 파일:
  - `src/types/spot.ts`
  - `src/utils/spotMappers.ts`
- 변경 내용:
  - `SpotItem`: `gradientColors`·`badge`를 optional로 변경, `imageUrl?: string | null` 추가
  - `regionLabelFrom`을 `export`로 전환 (현재 module-private, `spotMappers.ts:175`)
  - `mapPopularSpot(dto: SpotResponse): SpotItem` 추가
    - `id: String(dto.id)`
    - `location`: `[regionLabelFrom(dto.address), dto.categories.slice(0, 2).join('/')]`를 `' · '`로 join (빈 조각 제거)
    - `rating: dto.reviewAverage ?? 0`, `reviewCount: dto.reviewCount ?? 0`
      (`photoScore`는 매핑하지 않음 — 스펙 AC3의 포토제닉 지수 미표시 결정)
    - `imageUrl: dto.thumbnailUrl ?? dto.imageUrl`
    - `isBookmarked: false` (서버 미제공)
    - `badge`·`gradientColors` 미설정
  - 기존 `regionLabelFrom` 옆의 `__DEV__` self-check 블록에 `mapPopularSpot` 케이스 3줄 추가
    (주소 정상 / 주소 빈 문자열 / `reviewAverage` null)
- 완료 조건: `mapPopularSpot`이 `SpotResponse`를 받아 `SpotItem`을 반환하고, `any` 없이 컴파일된다
- 검증 방법: `pnpm exec tsc --noEmit` + 앱 dev 실행 시 콘솔에 `console.assert` 실패 로그가 없음

### Task 2 — 섹션 서버 연동 + 상태 처리 (약 75분)

- 대상 파일:
  - `src/components/home/PopularSpotsSection.tsx`
- 변경 내용:
  - `MOCK_SPOTS` 상수와 `// TODO: API 연동 시...` 주석 삭제
  - `useSpots({ sort: 'popular', size: 10 })` 호출, `data?.content`를 `mapPopularSpot`으로 매핑 (`useMemo`)
  - 제목 텍스트 `이번 주 인기 스팟` → `인기 스팟` (L66)
  - 상태 분기 추가
    - `isLoading`: `Skeleton` 3개 (`width: normalize(220)`, `height: normalize(300)`, `borderRadius: CARD_RADIUS`)를
      기존 `contentContainerStyle`과 같은 패딩/gap의 가로 `View`로 배치
    - `isError`: 안내 문구 + `refetch()` 텍스트 버튼 (`#E31B59`)
    - 빈 배열: 안내 문구 1줄, `FlatList` 미렌더
  - `ponytail:` 주석으로 "서버 정렬 = 누적 bookmarkCount/reviewCount, 주간 집계 없음" 근거 기록
- 완료 조건: 목업 상수가 코드에서 사라지고, 3가지 상태가 모두 렌더 경로를 가진다
- 검증 방법:
  - 실기기/시뮬레이터에서 홈 진입 → 실제 스팟 카드 노출
  - 기기 네트워크 차단 후 재진입 → 에러 문구·재시도 동작
  - `size: 10`을 임시로 `0`으로 바꿔 빈 상태 확인 후 되돌리기

### Task 3 — 카드 이미지 렌더 + optional 필드 대응 (약 45분)

- 대상 파일:
  - `src/components/home/SpotCard.tsx`
- 변경 내용:
  - 사진 영역: `item.imageUrl`이 있으면 `Image`(`resizeMode: 'cover'`, `position: absolute, inset: 0`),
    없으면 기존 `LinearGradient`. 그라디언트 폴백 색상은 `item.gradientColors ?? DEFAULT_GRADIENT` 상수로 처리
  - `item.rating` 미정의 방어 (`toFixed` 호출부 null 경계). `reviewCount`는 0건일 때
    "(0)"이 리뷰가 있는 카드처럼 읽혀 아예 그리지 않는다
  - 배지 블록은 `item.badge &&` 가드가 이미 있어 코드 변경 없음 — 유지
- 완료 조건: `imageUrl` 유/무 두 경우 모두 카드 레이아웃이 깨지지 않는다
- 검증 방법: 응답에 `thumbnailUrl`이 null인 스팟과 있는 스팟이 섞인 상태로 홈 확인 (없으면 임시로 매퍼에서 null 강제)

### Task 4 — 목업/문서 동기화 (약 30분)

- 대상 파일:
  - `src/components/ui/home/home.html` (L1119)
  - `src/components/ui/spot/spot-list.html` (`<title>`, `.nav__title`)
  - `docs/ai/specs/feature/home-screen/home-screen.md` (인기 스팟 API 연동 항목 상태)
- 변경 내용: "이번 주 인기 스팟" → "인기 스팟" 문구 통일, 기존 홈 스펙의 Out of Scope 항목에 이번 연동 완료 반영
- 완료 조건: 레포에서 `grep -rn "이번 주 인기 스팟" src docs` 결과가 0건 (과거 plan/spec 기록 제외)
- 검증 방법: `grep -rn "이번 주 인기 스팟" src/` 로 잔여 문구 확인, 목업을 390px 뷰포트로 열어 레이아웃 확인

### Task 5 — 카드 즐겨찾기 서버 연동 (약 60분)

> 백엔드 `SpotResponse.isBookmarked` 추가(`PNG_backend` `feature/spot-response-is-bookmarked`)로
> 차단 요소가 풀려 범위에 추가된 태스크.

- 대상 파일:
  - `src/types/spot.ts`, `src/utils/spotMappers.ts`
  - `src/components/home/SpotCard.tsx`
  - `src/components/home/PopularSpotsSection.tsx`
- 변경 내용:
  - `SpotResponse`에 `isBookmarked?: boolean` 추가(구버전 서버 호환을 위해 optional), `mapPopularSpot`이 그대로 반영
  - `SpotCard`의 로컬 `useState` 토글 제거 — 저장 여부는 서버 값만 신뢰. 컬렉션 선택을 거쳐야 저장이
    끝나므로 낙관적 토글은 거짓 표시가 된다. `onBookmarkPress`를 안 넘기면 아이콘 미렌더(비로그인)
  - `PopularSpotsSection`에 `BookmarkSheet`를 **하나만** 마운트하고 대상 `spotId`만 교체(카드마다 두면 10개 마운트)
  - 저장 후 `['spots', 'list']` 무효화 — 아이콘 채워짐이 목록 응답에서 오므로 재조회가 필요
- 완료 조건: 홈 카드와 스팟 상세의 즐겨찾기 상태가 일치하고, 비로그인은 아이콘이 없다
- 검증 방법:
  - 로그인 후 홈 카드 저장 → 상세 진입 시 채워짐 유지, 상세에서 해제 → 홈 복귀 시 반영
  - 로그아웃 상태로 홈 진입 → 아이콘 미표시
  - `__DEV__` self-check: `isBookmarked` 반영·누락 폴백

## 4) 검증 체크포인트

- [ ] Type check 통과 (`pnpm exec tsc --noEmit`)
- [ ] Lint 통과 (`pnpm lint`)
- [ ] `__DEV__` self-check 콘솔 assert 무실패
- [ ] 수동 시나리오: 정상 / 에러+재시도 / 빈 상태 / 카드 탭 → 상세 진입
- [ ] 회귀 영향 범위: `SpotItem`을 쓰는 다른 화면(`SpotCard` 호출부)이 optional 전환 후에도 정상 렌더

## 5) 롤백 계획

- 영향 파일: `src/types/spot.ts`, `src/utils/spotMappers.ts`, `src/components/home/PopularSpotsSection.tsx`, `src/components/home/SpotCard.tsx`, 목업 HTML 2건
- 되돌림 방법: 단일 PR revert. 서버 상태만 읽는 변경이라 부분 롤백 불필요
- 데이터 영향: 없음 (GET only, 캐시 키 신규 생성 없음)

## 6) PR 구성

- PR 제목: `feat: 홈 인기 스팟 섹션 실 API 연동 및 섹션 제목 정정`
- 변경 요약(3줄)
  - 홈 인기 스팟 섹션의 목업 데이터를 제거하고 `useSpots({ sort: 'popular' })` 서버 응답으로 교체
  - 서버가 주간 집계를 제공하지 않아 섹션 제목을 "인기 스팟"으로 정정 (RN + HTML 목업)
  - 로딩 스켈레톤 · 에러 재시도 · 빈 상태 추가, 카드에 실제 스팟 사진 렌더
  - 카드 즐겨찾기를 스팟 상세와 같은 `BookmarkSheet`에 연결 (백엔드 `isBookmarked` 필드 필요)
- 리뷰 요청 포인트
  - `/spots/popular` 전용 함수를 만들지 않고 기존 `useSpots`를 재사용한 판단 (동일 정렬 로직, 신규 코드 0)
  - `SpotItem`의 `gradientColors`·`badge` optional 전환이 다른 호출부에 미치는 영향
  - `HOT`/`NEW` 배지 제거에 대한 기획 동의 여부

## 7) Plan File Path

`docs/ai/plans/feature/home-popular-spots-api/home-popular-spots-api-plan.md`

---

## 후속 (이번 PR 밖)

- **백엔드**: 최근 7일 `bookmark`/`review` `createdAt` 기준 집계 엔드포인트. 제공되면 제목을 "이번 주 인기 스팟"으로 되돌리고 `HOT` 배지 규칙 정의
- **백엔드 문서**: `PNG_backend/docs/api-specification.md`의 `/spots/popular` 상태가 `미시작` → 실제 구현 완료, 갱신 요청
- "모두 보기" 목록 화면 (`spot-list.html`) RN 구현
