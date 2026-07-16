# 기능 스펙 — 스팟 상세 API 연동

## 1) 기능 정보

- 기능명: spot-detail-api (스팟 상세 화면 API 연동)
- 담당자: 박예은 (정보 탭 · `api/spot.ts`·`useSpot.ts` 공동)
- 관련 이슈: 없음
- 대상 플랫폼: iOS / Android

## 2) 문제와 목표

- 해결하려는 문제: `SpotDetailScreen` UI는 완료됐으나 모든 데이터가 하드코딩(`MOCK_*`)이고 `api/spot.ts`·`useSpot.ts`는 빈 스텁 상태.
- 사용자 가치: 실제 스팟 상세·편의정보·리뷰·체크리스트를 서버에서 받아 표시.
- 완료 기준(한 줄): 정보 탭(스팟 상세·편의정보·체크리스트)과 리뷰 탭이 실 API로 동작하고, 로딩/에러 상태를 처리한다.

## 3) 범위

- 포함(In Scope):
  - 스팟 상세 조회 `GET /spots/{id}` (편의정보 임베디드 포함)
  - 리뷰 목록 조회 `GET /spots/{id}/reviews` (`timeSlot` 배지 포함, 정렬)
  - 체크리스트 조회/추가/삭제 `GET·POST·DELETE /spots/{id}/checklist`
  - **포토제닉 지수 `GET /spots/{id}/photogenic-score?date=&time=`** (2차 확장 — API 팀이 date/time 재조회 + 골든아워 카운트다운 필드 제공하며 언블록됨)
  - `api/spot.ts`, `hooks/useSpot.ts`, `types/spot.ts` 구현/보강
  - 정보 탭·리뷰 탭·체크리스트 섹션·포토제닉 카드 컴포넌트를 props/훅 기반으로 전환
- 제외(Out of Scope):
  - 사진 탭 (`#7`) — 담당: 소영재.
  - 채팅 탭 — 실시간(WebSocket) 별도 진행.
  - 히어로 북마크 토글 (`#6`) — API는 boolean 토글만이나 화면 `BookmarkSheet`는 컬렉션 UI. 불일치로 후속(박예은).
  - 리뷰 작성/수정/삭제 (`#11~13`) — `ReviewWriteScreen` 스코프. 본 작업은 리뷰 **조회**만.
  - 편의정보 "화장실" 셀 → **"주차장"으로 교체** (parking은 상세 응답에 존재, API 추가 불필요).
  - 코스에 저장 / 바로 출발 시트 — travel 도메인(모정민).

## 4) 사용자 시나리오

- 시나리오 A — 상세 진입:
  - Given: 홈/검색/지도에서 스팟 카드 탭 (`spotId` 전달)
  - When: `SpotDetailScreen` 마운트
  - Then: `GET /spots/{id}` 결과로 히어로·이름·주소·평점·태그·편의정보 렌더, 로딩 중 스켈레톤/플레이스홀더
- 시나리오 B — 리뷰 정렬:
  - Given: 리뷰 탭 진입
  - When: 정렬 칩(최신순/별점 높은순/별점 낮은순) 선택
  - Then: `sort` 파라미터로 재조회, 요약 분포 + 목록(시간대 배지 포함) 갱신
- 시나리오 C — 체크리스트 추가/삭제:
  - Given: 정보 탭 체크리스트 섹션
  - When: 항목 추가(자유 텍스트, 최대 10·20자) 또는 사용자 항목 삭제
  - Then: `POST`/`DELETE` 후 목록 무효화·재조회, 기본 항목(`defaultItems`)은 삭제 불가
- 시나리오 D — 포토제닉 날짜/시간 재조회:
  - Given: 정보 탭 포토제닉 카드
  - When: 날짜(오늘~+2일) 또는 시간(5분 단위) 셀렉터 변경
  - Then: `date`/`time` 파라미터로 재조회, 점수·등급·링·5개 팩터·골든아워 콜아웃 갱신 (로딩 표시)

## 5) UI/UX 요구사항

- 참조 목업: `src/components/ui/spot/spot-detail.html` (정보/리뷰 탭)
- 화면 전환: `SpotStack > SpotDetail { spotId }` — 현재 하드코딩된 `MOCK_SPOT.id` 대신 `route.params.spotId` 사용
- 빈 상태: 리뷰 0건 시 목록 빈 처리 / 체크리스트 미등록 시 편집(추가) 상태
- 에러 상태: 조회 실패 시 재시도 가능한 최소 에러 표시(Toast 또는 인라인)
- 로딩 상태: 상세 로딩 시 헤더/편의정보 스켈레톤(기존 `ConvenienceInfoSection.loading` 계약 활용), 리뷰 로딩 시 스피너/플레이스홀더

## 6) 데이터/API 요구사항

Base URL: `http://localhost:8080` (`EXPO_PUBLIC_API_URL`). 체크리스트는 `Authorization: Bearer` 필요, 상세·리뷰 조회는 공개.

| 용도 | 메서드 · 경로 | 인증 | 비고 |
|---|---|---|---|
| 상세 | `GET /spots/{id}` | X | `convenience`·`stats`·`tags`·`isBookmarked` 포함 |
| 리뷰 | `GET /spots/{id}/reviews?sort=&page=&size=` | X | `summary` + 페이지네이션. **1페이지만** (load-more 후속) |
| 체크리스트 조회 | `GET /spots/{id}/checklist` | O | `defaultItems` + `userItems` |
| 체크리스트 추가 | `POST /spots/{id}/checklist` | O | body `{content}`, 최대 10·20자, `201` |
| 체크리스트 삭제 | `DELETE /spots/{id}/checklist/{itemId}` | O | userItem만, `204` |
| 기본 항목 숨김 | `DELETE /spots/{id}/checklist/default/{defaultItemId}` | O | defaultItem 숨김, 멱등, `204` |
| 포토제닉 | `GET /spots/{id}/photogenic-score?date=&time=` | X | `date`(yyyy-MM-dd)·`time`(HH:mm) 선택 파라미터. 5팩터 + 골든아워 카운트다운 |

**응답 → 뷰 모델 매핑**

- 상세: `badge(boolean)` → 라벨(true→"관광공사 인증"), `stats.avgRating/reviewCount/photoCount` → 평점·리뷰수·사진수, `imageUrl` → 히어로 단일 이미지(다중 카운터는 사진 탭 후속)
- 편의정보(`convenience`) → `ConvenienceInfo`:
  - transport 카드: `parking`, `subwayAccess`
  - cells: **주차장**(`parking`), 휠체어(`wheelchairAccess`), 유모차(`strollerAccess`), 반려동물(`petFriendly`), 지하철(`subwayAccess`), 문의(`infocenter`) — 값이 "가능/있음"이면 `green`, 아니면 `default`
- 리뷰: `distribution`(카운트) → percent 변환, `nickname` → 이름·이니셜(첫 글자)·아바타색(클라 생성), `timeSlot`(SUNRISE/DAY/SUNSET/NIGHT) → 배지 라벨(일출/낮/일몰/야간), **`timeSlot === null`이면 배지 미표시**, `equipmentInfo`→장비, `photos`→사진 URL
- 정렬: 최신순→`LATEST`, 별점 높은순→`RATING_HIGH`, 별점 낮은순→`RATING_LOW`
- 체크리스트: `defaultItems`(`defaultItemId`) + `userItems`(숫자 `id`), **사용자 항목은 삭제**(`DELETE .../checklist/{itemId}`)·**기본 항목은 숨김**(`DELETE .../checklist/default/{defaultItemId}`), 체크 토글은 **클라 로컬 상태**(서버 토글 API 없음)
- 포토제닉 → `PhotogenicScoreData`:
  - `score`/`grade` 그대로, `maxScore = 80`(총점 만점), 링 진행 = score/80
  - 팩터 5개: `weather`(만점30)·`fineDust→dust`(20)·`ozone`(10, **신규 키**)·`season`(15)·`goldenHour`(5). 각 `value = label`, `barPercent = score / 팩터만점 × 100`, 색/아이콘은 팩터키별 클라 고정
  - 골든아워 콜아웃: `minutesUntilStart`/`startTime` 사용. **null 규칙** — `minutesUntilStart=null & score=5` → "진행 중", `=null & score=0` → "오늘 종료", 그 외 "N분 후 시작 · HH:mm"
  - "데이터 없음"/"해당 없음" label은 그대로 노출(score 0, bar 0)
- 포토제닉 재조회: 날짜(오늘~+2일, `yyyy-MM-dd`)·시간(`HH:mm`, 5분 단위) 셀렉터 → `date`/`time` 파라미터로 재조회. 쿼리키 `['spot', id, 'photogenic', date, time]`

- 실패 처리: `api/auth.ts`의 `ApiError`/`toErrorMessage` 재사용, 타임아웃 10s
- 캐싱/무효화: 상세·리뷰는 `spotId`(+`sort`) 쿼리키. 체크리스트 add/delete 성공 시 `['spot', id, 'checklist']` invalidate

## 7) 상태 관리

- 서버 상태: TanStack Query (`hooks/useSpot.ts`) — `useQuery` 4종(상세·리뷰·체크리스트·포토제닉) + `useMutation` 2종
- 클라이언트 상태: 리뷰 정렬 선택, 체크리스트 체크 토글(로컬), 포토제닉 날짜/시간 선택, 인증 토큰은 `useAuthStore.accessToken`
- 영속화: 불필요

## 8) 기술 제약 체크

- [x] NativeWind `className`만 사용 (기존 컴포넌트가 인라인 style 다수 사용 중 — 현행 유지, 신규 코드는 규칙 준수)
- [x] `StyleSheet.create()` 미사용
- [x] `@/` alias 사용
- [x] 타입 정의 명확 (DTO 타입 신설, `any` 금지)
- [x] 디자인 토큰 준수

## 9) 수용 기준 (Acceptance Criteria)

- [ ] AC1: `GET /spots/{id}` 응답으로 히어로·이름·주소·평점·리뷰수·태그·편의정보(주차장 셀 포함)가 렌더된다.
- [ ] AC2: 리뷰 탭에서 정렬 칩 변경 시 `sort` 파라미터로 재조회되고, 요약 분포·목록·시간대 배지가 갱신된다.
- [ ] AC3: 체크리스트 항목 추가/삭제가 서버에 반영되고 재조회로 목록이 갱신되며, `defaultItems`는 삭제 버튼이 없다.
- [ ] AC4: 상세/리뷰 조회 로딩·에러 상태가 크래시 없이 처리된다.
- [ ] AC5: `tsc --noEmit`·`lint` 통과, `MOCK_*` 상수가 화면 렌더 경로에서 제거된다.
- [ ] AC6: 포토제닉 카드가 실 API로 렌더되고(5팩터·골든아워 카운트다운), 날짜/시간 셀렉터 변경 시 `date`/`time`으로 재조회되어 값이 갱신된다.

## 10) 테스트 시나리오

- 정상: 유효 `spotId`로 상세·리뷰·체크리스트·포토제닉 정상 표시
- 경계: 리뷰 0건, 체크리스트 userItems 0건, 태그 빈 배열, `equipmentInfo`/`photos` 누락, 골든아워 `minutesUntilStart=null`(진행 중/종료), 팩터 "데이터 없음"
- 실패: 404(없는 스팟), 401(체크리스트 미인증), 네트워크 타임아웃

## 11) 결정 사항 (확정)

1. **체크리스트 = 자유 입력** — 프리셋 칩(`MOCK_CHECKLIST_OPTIONS`) 제거. 서버 `defaultItems`를 기본 추천으로 표시 + 사용자는 텍스트 입력으로 자유 추가(최대 10·20자) + **사용자 항목 삭제(`id`)** + **기본 항목 숨김(`defaultItemId`, `DELETE .../default/{defaultItemId}`)**. 개인 데이터라 자유 입력 리스크 낮음.
2. **badge = 조건부 렌더** — `badge === true`일 때만 "관광공사 인증" 배지 표시. 현재는 전량 관광공사 데이터라 항상 표시되지만, 향후 사용자 스팟(`false`) 대비.
3. **리뷰 시간대 배지 = 색 구분 없음** — 라벨만 교체, 현행 회색 단색 유지. `timeSlot === null`이면 미표시.
4. **포토제닉 = 실 API 연동(2차)** — API 팀이 date/time 재조회 + 골든아워 카운트다운 필드를 제공해 언블록. `maxScore=80`, `ozone` 팩터 신규 추가, 골든아워 콜아웃은 `minutesUntilStart`/`startTime` null 규칙대로 "진행 중/오늘 종료/N분 후" 분기. 날짜 옵션은 오늘~+2일 동적 생성.

## 12) 남은 참고 사항

- **BASE URL** — `http://localhost:8080`은 로컬. 시뮬레이터/기기에서 접근 불가할 수 있음(안드로이드 `10.0.2.2` 등). `.env`의 `EXPO_PUBLIC_API_URL` 설정은 사용자 환경 책임.
