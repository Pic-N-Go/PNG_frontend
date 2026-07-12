# 구현 계획 — 스팟 상세 API 연동

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/feature/spot-detail-screen/spot-detail-api.md`
- 관련 목업: `src/components/ui/spot/spot-detail.html` (정보/리뷰 탭)
- 완료 목표: 정보 탭(상세·편의정보·체크리스트) + 리뷰 탭이 실 API로 동작, 로딩/에러 처리, `MOCK_*` 제거(포토제닉 제외)

## 2) 구현 전략

- 핵심 접근:
  - `api/spot.ts`는 `api/auth.ts` 패턴 재사용(`ApiError`/`toErrorMessage` import, `get/post/del` 헬퍼, 10s 타임아웃) → 원시 DTO 반환
  - DTO→뷰모델 변환은 `useSpot.ts`의 `useQuery` `select`에서 순수 매퍼로 처리(컴포넌트 prop 타입은 기존 유지 → UI 변경 최소화)
  - 컴포넌트는 내부 mock 제거 후 props/핸들러 주입식으로 전환
- 리스크:
  - 체크리스트 UI 모델 불일치(프리셋 칩 ↔ 자유텍스트) → UI 로직 재구성 필요
  - 기존 컴포넌트가 인라인 style 다수 → 신규만 규칙 준수, 리팩터 최소화
  - `localhost:8080`은 실기기 접근 불가 가능 → 연동 검증은 매퍼/타입 중심 + 가능 시 시뮬레이터
- 리스크 완화: 매퍼를 순수 함수로 분리해 단위 검증 용이하게, 각 Task 후 `tsc`/`lint`

## 3) 작업 태스크

### Task 1 — 타입/DTO + 매퍼

- 대상 파일:
  - `src/types/spot.ts`
- 변경 내용:
  - API 응답 DTO 타입 추가: `SpotDetailResponse`, `ConvenienceDTO`, `ReviewListResponse`, `ReviewDTO`, `ReviewSummaryDTO`, `ChecklistResponse`, `ChecklistItemDTO`
  - `ReviewTimeSlot = 'SUNRISE'|'DAY'|'SUNSET'|'NIGHT'`(DTO에서 `nullable`), `ReviewSortApi = 'LATEST'|'RATING_HIGH'|'RATING_LOW'`, `ChecklistItemDTO { id: number | null; content: string }`
  - 기존 뷰모델 타입(`SpotDetailInfo`,`ConvenienceInfo`,`ReviewSummaryData`,`Review`)은 유지, 필요한 필드만 보강(예: `Review.timeSlotLabel`)
- 완료 조건: DTO/뷰모델 타입 컴파일 통과
- 검증 방법: `pnpm exec tsc --noEmit`

### Task 2 — 매퍼 유틸

- 대상 파일:
  - `src/utils/spotMappers.ts` (신규)
- 변경 내용:
  - `mapSpotDetail(dto) → { info: SpotDetailInfo; convenience: ConvenienceInfo }` (badge 라벨, 주차장 셀, 값→variant)
  - `mapReviewList(dto) → { summary: ReviewSummaryData; reviews: Review[] }` (분포 카운트→percent, nickname→이니셜/색, timeSlot→라벨, **timeSlot null→배지 없음**)
  - `SORT_TO_API`, `TIMESLOT_LABEL` 매핑 상수
- 완료 조건: 순수 함수, 부작용 없음
- 검증 방법: `tsc`; `src/utils/spotMappers.test-demo` 대신 매퍼 하단 `if (__DEV__)` self-check 또는 간단 assert (프레임워크 없음)

### Task 3 — API 함수

- 대상 파일:
  - `src/api/spot.ts`
- 변경 내용:
  - `auth.ts`에서 `ApiError` 재사용, `get/post/del` 헬퍼(+`Authorization` 옵션)
  - `spotApi.getDetail(id)`, `getReviews(id, {sort,page,size})`, `getChecklist(id, token)`, `addChecklistItem(id, content, token)`, `deleteChecklistItem(id, itemId, token)`
- 완료 조건: 함수 시그니처가 DTO 타입 반환
- 검증 방법: `tsc`

### Task 4 — 훅 (TanStack Query)

- 대상 파일:
  - `src/hooks/useSpot.ts`
- 변경 내용:
  - `useSpotDetail(id)` — `select`로 `mapSpotDetail`
  - `useSpotReviews(id, sort)` — `select`로 `mapReviewList`, 쿼리키 `['spot', id, 'reviews', sort]`
  - `useChecklist(id)` — 토큰 필요(`useAuthStore`)
  - `useAddChecklistItem(id)`, `useDeleteChecklistItem(id)` — 성공 시 `['spot', id, 'checklist']` invalidate
- 완료 조건: 훅이 뷰모델 반환, enabled 가드(id 유효)
- 검증 방법: `tsc`

### Task 5 — 정보 탭 연동 (상세·편의정보)

- 대상 파일:
  - `src/screens/spot/SpotDetailScreen.tsx`
  - `src/components/spot/ConvenienceInfoSection.tsx` (mock export 제거, props 유지)
  - `src/components/spot/SpotInfoHeader.tsx` (필요 시)
- 변경 내용:
  - `route.params.spotId` 사용, `MOCK_SPOT`/`MOCK_CONVENIENCE_INFO` 제거
  - `useSpotDetail`로 헤더·편의정보 렌더, 로딩(스켈레톤)·에러(Toast) 처리
  - 편의정보 화장실→주차장 셀 교체
- 완료 조건: 상세 데이터로 정보 탭 상단부 렌더
- 검증 방법: `tsc`/`lint`; 시뮬레이터 가능 시 렌더 확인 (TODO: 백엔드 기동)

### Task 6 — 체크리스트 연동 (모델 재구성)

- 대상 파일:
  - `src/components/spot/ChecklistSection.tsx`
  - `src/screens/spot/SpotDetailScreen.tsx`
- 변경 내용:
  - **API 모델 기준 재구성(확정)**: `defaultItems`(id null) + `userItems`(숫자 id) 표시, 자유 텍스트 입력으로 추가(최대 10·20자), **`id !== null`인 항목만 삭제**, 체크 토글은 로컬 상태
  - `MOCK_CHECKLIST_OPTIONS`(프리셋 칩) 제거
  - `useChecklist`/`useAddChecklistItem`/`useDeleteChecklistItem` 연결, 미인증 시 안내
- 완료 조건: 추가/삭제가 서버 반영 + 재조회
- 검증 방법: `tsc`/`lint`

### Task 7 — 리뷰 탭 연동

- 대상 파일:
  - `src/components/spot/ReviewTab.tsx` (mock 제거, props화)
  - `src/screens/spot/SpotDetailScreen.tsx`
- 변경 내용:
  - `ReviewTab`에 `summary`·`reviews`·`sort`·`onSortChange`·`loading` props 추가, `MOCK_REVIEW_SUMMARY`/`MOCK_REVIEWS` 제거
  - `useSpotReviews(id, sort)` 연결, 시간대 배지 라벨(`timeSlot null`→배지 없음), 빈 상태 처리
  - 1페이지만 조회(load-more 후속 TODO)
- 완료 조건: 정렬 변경 시 재조회·갱신
- 검증 방법: `tsc`/`lint`

---

> **2차 확장 (포토제닉 언블록 후)** — API 팀이 `photogenic-score`에 date/time 파라미터 + 골든아워 카운트다운(`minutesUntilStart`/`startTime`)을 추가하며 연동 가능해짐.

### Task 8 — 포토제닉 타입/DTO + 매퍼

- 대상 파일:
  - `src/types/spot.ts`
  - `src/utils/spotMappers.ts`
- 변경 내용:
  - `PhotogenicFactorKey`에 `'ozone'` 추가, `PhotogenicScoreData`의 `goldenHourMinutesLeft`/`goldenHourTime`을 nullable로
  - DTO `PhotogenicScoreResponse`(5팩터 각 `{label,score}`, `goldenHour`에 `minutesUntilStart|null`·`startTime|null`)
  - `mapPhotogenicScore(dto) → PhotogenicScoreData`: `maxScore=80`, 팩터 5개 매핑(만점 상수 `weather30/fineDust20/ozone10/season15/goldenHour5`, `barPercent=score/max×100`, 색·아이콘 팩터키별 상수), 골든아워 콜아웃 문구 null 분기
- 완료 조건: 순수 매퍼, self-check에 골든아워 null 분기 케이스 추가
- 검증 방법: `tsc`

### Task 9 — 포토제닉 API + 훅

- 대상 파일:
  - `src/api/spot.ts`
  - `src/hooks/useSpot.ts`
- 변경 내용:
  - `spotApi.getPhotogenicScore(id, { date?, time? })` — 쿼리스트링 조립
  - `useSpotPhotogenicScore(id, date, time)` — 쿼리키 `['spot', id, 'photogenic', date, time]`, `select: mapPhotogenicScore`, `enabled: !!id`
- 완료 조건: 훅이 뷰모델 반환
- 검증 방법: `tsc`

### Task 10 — 포토제닉 카드 연동 + 날짜/시간 재조회

- 대상 파일:
  - `src/components/spot/PhotogenicScoreCard.tsx`
  - `src/screens/spot/SpotDetailScreen.tsx`
- 변경 내용:
  - 카드가 `spotId`를 받아 내부에서 날짜/시간 상태 관리 + `useSpotPhotogenicScore`로 조회(선택 변경 시 재조회), 로딩/에러 표시
  - `MOCK_PHOTOGENIC_SCORE` 제거(스크린), `maxScore` 표기 `/80`, ozone 아이콘(`IconAtom` 등) 추가
  - 날짜 옵션 오늘~+2일 동적 생성(`date`=yyyy-MM-dd, `time`=HH:mm), 골든아워 콜아웃 null 분기 렌더
- 완료 조건: 셀렉터 변경 시 재조회·갱신, 크래시 없음
- 검증 방법: `tsc`/`lint`

## 4) 검증 체크포인트

- [ ] `pnpm exec tsc --noEmit`
- [ ] `pnpm lint`
- [ ] 정보 탭·리뷰 탭·포토제닉 주요 시나리오 수동 검증 (TODO: 백엔드 기동 필요)
- [ ] `MOCK_*` 잔존 확인 (전 도메인)

## 5) 롤백 계획

- 영향 파일: `types/spot.ts`, `utils/spotMappers.ts`, `api/spot.ts`, `hooks/useSpot.ts`, `screens/spot/SpotDetailScreen.tsx`, `components/spot/{ConvenienceInfoSection,ChecklistSection,ReviewTab}.tsx`
- 되돌림: `git restore <파일>` (커밋 전) / 커밋 후 revert
- 데이터 영향: 없음(읽기 위주, 체크리스트 add/delete는 서버 상태 변경)

## 6) PR 구성

- PR 제목: `feat(spot): 스팟 상세 정보/리뷰/체크리스트 API 연동`
- 변경 요약: 상세·리뷰·체크리스트 실 API 연동, 편의정보 주차장 셀 교체, 정보/리뷰 탭 mock 제거
- 리뷰 요청 포인트: 체크리스트 UI 재구성 방향, DTO→뷰모델 매퍼, 쿼리 무효화
