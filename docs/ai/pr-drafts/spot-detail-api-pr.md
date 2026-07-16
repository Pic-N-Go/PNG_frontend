## 개요

스팟 상세 화면(`SpotDetailScreen`)의 하드코딩 MOCK 데이터를 실제 백엔드 API로 연동했습니다.
정보 탭(상세·편의정보·촬영 체크리스트), 리뷰 탭(조회·정렬), 포토제닉 지수(날짜/시간 재조회 포함)를 TanStack Query로 연결했습니다.
추가로 포토제닉 재조회 UX를 HTML 목업(`spot-detail.html`)에 반영하고, 바텀시트 스크롤 위치 버그를 수정했습니다.

## 관련 이슈

> TODO: 연결할 이슈 번호 (없으면 삭제)

## 작업 내용

- [x] `api/spot.ts` 구현 — 상세/리뷰/체크리스트(CRUD)/포토제닉, `auth.ts` 패턴(`ApiError`·10s 타임아웃) 재사용
- [x] `hooks/useSpot.ts` — `useQuery` 4종 + `useMutation` 2종, 체크리스트 add/delete 시 쿼리 무효화, 포토제닉 `keepPreviousData`
- [x] `utils/spotMappers.ts`(신규) — DTO→뷰모델 순수 매퍼(편의정보 null·빈값·HTML·긴 텍스트 방어, 리뷰 분포/시간대 배지, 포토제닉 팩터/골든아워 null 분기), `__DEV__` self-check
- [x] `types/spot.ts` — API DTO 타입 추가, `ozone` 팩터 키, nullable 정정
- [x] 정보/리뷰 탭·포토제닉 카드·체크리스트 컴포넌트를 props/훅 기반으로 전환, MOCK 제거
- [x] 편의정보 "화장실" → "주차장" 셀 교체, badge 조건부 렌더
- [x] 포토제닉 날짜(오늘~+2일)/시간 셀렉터 재조회 + 로딩 오버레이
- [x] 목업: 포토제닉 재조회 UI(날짜/시간 시트·로딩·값 갱신) 추가, 바텀시트 `position: absolute→fixed` 수정
- [x] `filelist-data.json` 진행 상태 갱신

> 범위 밖(후속): 사진 탭(소영재)·채팅(실시간)·히어로 북마크(#6 컬렉션 UI 조율)·리뷰 작성/수정/삭제(`ReviewWriteScreen`)

## 테스트 방법

1. `.env`의 `EXPO_PUBLIC_API_URL`을 백엔드 주소로 설정 후 앱 실행 → 스팟 상세 진입
2. 정보 탭: 이름·주소·평점·태그·편의정보(주차장 등) 표시 확인
3. 포토제닉 카드: 날짜/시간 셀렉터 변경 시 로딩 오버레이 후 점수·팩터·골든아워 갱신 확인
4. 체크리스트: 항목 추가/삭제가 서버 반영 후 목록 갱신되는지, 기본 항목은 삭제 버튼 없는지 확인
5. 리뷰 탭: 정렬 칩 변경 시 재조회, 리뷰 없을 때 빈 상태 확인
6. `pnpm exec tsc --noEmit`, `pnpm lint` 통과 확인

> 참고: 라이브 백엔드(`localhost:8080`) 대상으로 GET 계열(상세·리뷰·포토제닉) 응답을 실데이터로 검증했고, DTO→매퍼 변환을 자체 하네스로 확인함. 체크리스트 add/delete·북마크는 토큰+DB 변경이라 미검증(TODO).

## 스크린샷 (UI 변경 시)

> TODO: 포토제닉 재조회 동작(목업) 스크린샷 첨부

## 체크리스트

- [x] 타입 에러 없음 (`tsc --noEmit`)
- [x] lint 통과 (`pnpm lint`)
- [x] 셀프 코드 리뷰 완료 (2회 리뷰 반영: 체크리스트 에러 처리·가드, 포토제닉 `keepPreviousData`, 편의정보 robustness)
- [ ] CI 통과
- [x] 문서/주석 업데이트 필요 여부 확인 (spec/plan 갱신, filelist 갱신)
