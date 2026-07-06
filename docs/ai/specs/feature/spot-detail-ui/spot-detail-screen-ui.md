# 기능 스펙 — 스팟 상세 화면 UI 우선 구현

## 1) 기능 정보

- 기능명: 스팟 상세 화면 UI (API 연동 제외)
- 담당자: `@Lucy`
- 관련 이슈: `[FE] 스팟 상세 화면 UI 우선 구현 (API 연동 제외)`
- 대상 플랫폼: iOS / Android

## 2) 문제와 목표

- 해결하려는 문제: 서비스 핵심 플로우(탐색→상세→액션)의 중심 화면인 스팟 상세가 아직 빈 화면(`SpotDetailScreen.tsx` placeholder)으로만 존재함.
- 사용자 가치: 화면 UI/인터랙션을 먼저 완성해 QA·디자인 검토를 API 개발과 병렬로 진행할 수 있게 함.
- 완료 기준(한 줄): `spot-detail.html` 목업의 정보/사진/리뷰/채팅 탭과 4종 바텀시트가 390px 기준으로 목업과 동일하게 동작하되, 모든 데이터는 로컬 mock이고 네트워크 호출은 없음.

## 3) 범위

- 포함(In Scope):
  - Hero 영역(콜랩싱 애니메이션, 뒤로가기/공유/북마크 액션 버튼, 카운터)
  - 스팟 기본 정보(배지·이름·위치·평점·태그)
  - 탭 바(정보/사진/리뷰/채팅) 전환
  - 정보 탭: 포토제닉 스코어 카드(SVG 링+팩터 그리드), 편의 정보, 촬영 체크리스트(빈 상태↔완료 상태 로컬 토글), 위시리스트 배너, Bottom CTA(코스에 저장/바로 출발)
  - 사진 탭: 필터 칩 + 로컬 mock 기반 무한 스크롤 페이지네이션 흉내(중첩 VirtualizedList 경고를 피하기 위해 `FlatList`가 아닌 일반 `View` flex-wrap 그리드 + 상위 `ScrollView` 근접-하단 감지로 구현)
  - 리뷰 탭: 요약(평점 분포 바) + 정렬 칩(스타일 토글만, 실제 재정렬 없음) + 리뷰 카드 리스트 + 리뷰 작성하기 sticky CTA(네비게이션 진입점만, `ReviewWriteScreen` 자체 구현은 제외)
  - 채팅 탭: 메시지 리스트 + 로컬 state 기반 전송(append만, 영속화 없음)
  - 바텀시트 4종: 코스에 저장(여행 선택→DAY 선택 2단계), 바로 출발(내비 앱 선택), 공유하기, 즐겨찾기(북마크, 미저장/저장됨 2 패널)
  - 기존 `Toast`(`src/components/auth/Toast.tsx`) 재사용한 액션 피드백
  - `src/types/spot.ts` 타입 확장, 각 컴포넌트 파일에 `MOCK_*` 상수 콜로케이션
  - **공통 컴포넌트 분리** (`src/components/common/`): 이번 화면에서 2회 이상 반복 사용되는 UI 조각은 스팟 전용 폴더가 아닌 공통 폴더로 분리해 다른 화면에서도 재사용 가능하게 함
    - `BottomSheet.tsx` — 백드롭+슬라이드업 컨테이너+핸들+헤더/푸터 슬롯 (바텀시트 4종에서 공통 사용, 기존 `FilterBottomSheet.tsx`의 Modal+Pressable 패턴을 컴포넌트화)
    - `Chip.tsx` — 선택 가능한 pill 칩(라벨 + 선택 도트 옵션) — 체크리스트 칩·사진 필터 칩·리뷰 정렬 칩·DAY 선택 칩 4곳에서 재사용
    - `StarRating.tsx` — 별점 표시 — 스팟 정보 헤더·리뷰 요약·리뷰 카드 3곳에서 재사용
    - `InitialAvatar.tsx` — 이니셜 원형 아바타 — 리뷰 카드·채팅 메시지에서 재사용
    - 기존 `src/components/home/`의 유사 코드(`FilterBottomSheet`, `CategoryFilter` 등)는 이번 스코프에서 리팩터링하지 않음 (범위 밖 파일 변경 승인 절차 필요 — 오픈 이슈에 기재)
  - **포토제닉 날짜/시간 선택** (당초 오픈 이슈 → 세션 중 API팀 확인 후 확정·구현): 날짜는 당일 포함 3일(오늘/내일/모레) 리스트를 공통 `OptionSheet`로 선택. 시간은 24시간 임의 시각 조회가 가능하다는 API 제약에 따라 신규 의존성 `@react-native-community/datetimepicker`(네이티브 스피너, `minuteInterval=5`)로 자유 선택. 선택해도 포토제닉 점수 자체는 mock 고정값이라 변하지 않음(API 연동 시 교체 예정, 코드에 TODO 표시)
  - **편의정보 스켈레톤 로딩**: 공통 `Skeleton`(펄스 애니메이션 블록) 컴포넌트 추가, `ConvenienceInfoSection`에 `loading` prop으로 아이콘/라벨은 고정 노출하고 값만 스켈레톤 처리. `SpotDetailScreen`엔 미리보기용 5초 타이머가 TEMP로 남아있음(API 연동 시 `isLoading`으로 교체 필요, TODO 표시)
  - **즐겨찾기 컬렉션 생성**: `BookmarkSheet`의 "새 컬렉션 만들기"가 원래 목업엔 토스트만 띄우는 placeholder였는데, 이름 입력 + 색상 5종(핑크/블루/퍼플/그린/오렌지) 선택으로 실제 컬렉션을 만들 수 있도록 확장(세션 내 화면 상태로만 유지, 최대 10개 제한, 목업에 없던 기능)
  - **홈 화면 인기 스팟 카드 → 스팟 상세 진입 연동**: `PopularSpotsSection`의 기존 `onSpotPress` 훅에 `HomeScreen`에서 실제 네비게이션(`SpotStack`/`SpotDetail`, `spotId` 파라미터 전달)을 연결함
- 제외(Out of Scope):
  - 스팟 상세 조회/리뷰/사진/채팅/체크리스트/위시리스트/코스저장 등 실제 API 연동 (`src/api/spot.ts` 등은 후속 이슈)
  - TanStack Query 훅 연결 (현재는 로컬 state만)
  - `ReviewWriteScreen`, `PhotoDetailScreen`의 실제 구현 (네비게이션 연결만 확인, 화면 내부는 기존 placeholder 유지)
  - 리뷰 정렬 로직(실제 배열 재정렬), 사진 필터 칩의 실제 필터링(칩 active 스타일만 전환)
  - 실시간 채팅(웹소켓 등), 딥링크 기반 내비게이션 앱 실제 실행(Linking 호출 등은 TODO 주석만)
  - 홈/지도/여행플랜 등 **다른** 진입 경로에서의 이동 연결(인기 스팟 카드 제외) — `SpotStack`의 `SpotDetail` 라우트 자체는 이미 등록되어 있으므로 필요 시 각 화면에서 개별 연결
  - `SpotDetailScreen`이 `route.params.spotId`를 실제로 소비해 스팟별 다른 데이터를 보여주는 것 — 현재는 어떤 경로로 들어와도 mock 광안리 데이터만 고정 표시

## 4) 사용자 시나리오

- 시나리오 A: 탭 전환
  - Given: 사용자가 스팟 상세 화면(정보 탭)에 있음
  - When: 탭 바에서 "사진"을 탭함
  - Then: 사진 탭 콘텐츠(필터 칩 + 그리드)로 전환되고 스크롤이 상단으로 초기화됨. 최초 진입 시 mock 사진 18장이 로드됨.
- 시나리오 B: 촬영 체크리스트 등록
  - Given: 체크리스트가 비어있는 상태(칩 선택 UI 노출)
  - When: 칩을 1개 이상 선택하고 저장 버튼을 누름
  - Then: 완료 상태 카드로 전환되고, 각 항목을 개별적으로 체크/해제할 수 있으며 "수정" 버튼이 노출됨
- 시나리오 C: 코스에 저장 (다일차 여행)
  - Given: "코스에 저장" 바텀시트가 열려 있음
  - When: 여행 계획(예: 부산 2박 3일) 선택 후 "다음"을 누름
  - Then: DAY 선택 스텝으로 전환되고, DAY를 선택하면 "저장하기" 버튼이 활성화되어 완료 시 토스트가 노출되고 시트가 닫힘
- 시나리오 D: 채팅 메시지 전송
  - Given: 채팅 탭이 열려 있고 입력창에 텍스트가 있음
  - When: 전송 버튼을 누르거나 엔터를 입력함
  - Then: 메시지가 로컬 리스트 맨 아래에 "내 메시지" 스타일로 추가되고 입력창이 비워지며 자동 스크롤됨

## 5) UI/UX 요구사항

- **목업 재현 원칙 (중요)**: `spot-detail.html`은 "참고용 레퍼런스"가 아니라 **동일하게 재현해야 하는 기준(ground truth)**이다.
  - 색상: 목업의 hex/rgba 값을 그대로 사용 (근사치·추정 색상 금지)
  - 문구: 목업의 한국어 텍스트를 그대로 사용 (예: "지금 광안리 해수욕장에 방문하기 최적인 시간대예요", "골든아워 23분 후 시작 · 오후 6:53" 등)
  - 수치: spacing/radius/font-size는 임의 조정 없이 `CLAUDE.md`/`development-guide.md`의 변환표(`className` vs `layout.ts` 상수 vs `normalize(n)`/`normalizeFontSize(n)`)를 그대로 적용해 목업 px 값과 1:1 대응
  - 레이아웃 구조: 섹션 순서·계층 구조·조건부 노출(체크리스트 빈 상태/완료 상태, 북마크 패널 A/B 등)을 임의로 생략·재배치하지 않음
  - 아이콘: 목업 아이콘은 전부 Tabler Icons이므로, 이미 설치된 `@tabler/icons-react-native`에서 **동일한 아이콘**을 매칭해 사용 (예: 뒤로가기 `IconArrowLeft`, 공유 `IconShare2`, 북마크 `IconBookmark`, 위치 `IconMapPin`, 날씨 `IconCloud`, 골든아워 `IconSun`, 미세먼지 `IconWind`, 시즌 `IconFlower`, 수정 `IconEdit`, 새 항목 `IconPlus`, 전송 `IconSend`, chevron류 `IconChevronDown`/`IconChevronRight`/`IconChevronLeft` 등). Tabler 세트에 없는 커스텀 형태(포토제닉 링 그라디언트, 다이나믹 아일랜드, 히어로 랜드스케이프 클립 셰이프, 카카오/네이버/Apple/인스타그램 등 브랜드 로고)만 `react-native-svg`로 직접 구현 (`HeroSection.tsx`/`MapBanner.tsx` 기존 패턴 참고)
- 참조 목업 파일:
  - `src/components/ui/spot/spot-detail.html`
- 화면 전환 규칙:
  - 뒤로가기: 기존 등록된 `SpotStack`(`SpotDetail: { spotId }`)의 네비게이션 스택 `goBack()` 사용 (목업의 `#from=` 해시 분기 로직은 RN 네비게이션 스택으로 대체되므로 불필요)
  - 리뷰 작성하기 CTA → `ReviewWriteScreen`으로 이동 (화면 내부는 기존 placeholder 유지)
- 빈 상태/에러 상태: 체크리스트 빈 상태(미등록)만 해당 — 그 외 목업 기준 항상 데이터가 있는 상태로 렌더링
- 로딩 상태: 사진 탭 무한 스크롤 시 하단 로더 dot 3개(펄스 애니메이션) 노출, `setTimeout` 600ms로 지연 시뮬레이션
- 콜랩싱 히어로: `development-guide.md`의 Reanimated `translateY` interpolate 패턴 적용 (height 직접 조작 금지)

## 6) 데이터/API 요구사항

- 사용 API: 없음 (전체 mock)
- Mock 데이터 위치: 각 컴포넌트 파일에 `MOCK_*` 상수로 콜로케이션 (기존 `PopularSpotsSection.tsx`/`CalendarSection.tsx` 컨벤션과 동일)
- 요청/응답 핵심 필드: N/A — `src/types/spot.ts`에 화면 표시용 타입만 정의
- 실패 처리 방식: N/A (API 연동 없음)
- 캐싱/무효화 전략(TanStack Query): 해당 없음 — 후속 API 연동 이슈에서 `useSpot.ts` 등으로 대체 예정. 연동 지점은 `// TODO: API 연동` 주석으로 표시

## 7) 상태 관리

- 서버 상태: 없음
- 클라이언트 상태(Zustand): 없음 — 모든 상태(탭 선택, 시트 열림/닫힘, 체크리스트, 채팅 메시지, 정렬 칩 등)는 `SpotDetailScreen` 및 하위 컴포넌트의 로컬 `useState`로 처리
- 영속화 필요 여부: 없음 (화면 재진입 시 초기화됨, 목업과 동일)

## 8) 기술 제약 체크

- [ ] NativeWind `className`만 사용
- [ ] `StyleSheet.create()` 미사용
- [ ] `@/` alias 사용
- [ ] 타입 정의 명확 (`any` 금지)
- [ ] 디자인 토큰 준수 (`#E31B59`, 52px 버튼, `layout.ts` 상수 등)
- [ ] 콜랩싱 헤더는 Reanimated `translateY` 방식 (height 직접 조작 금지)
- [ ] 목업 대비 색상/문구/수치 근사치 사용 금지 — 값 변환 규칙만 적용, 값 자체는 동일
- [ ] 2회 이상 반복되는 UI 조각은 `src/components/common/`에 분리 (신규 파일에 한함, 기존 파일 리팩토링 제외)

## 9) 수용 기준 (Acceptance Criteria)

- [ ] AC1: 정보/사진/리뷰/채팅 4개 탭이 모두 전환되며 각 탭 콘텐츠가 목업과 **동일**하다 (레이아웃 구조·색상·문구·수치·아이콘 포함, "비슷함"이 아닌 1:1 재현)
- [ ] AC2: 히어로가 스크롤에 따라 Reanimated 기반으로 자연스럽게 콜랩스되고, JS 스레드 병목(jitter) 없이 동작한다
- [ ] AC3: 포토제닉 스코어 카드가 SVG 링 차트 + 3열 팩터 그리드로 목업과 동일한 수치·색상·문구로 렌더링된다
- [ ] AC3-1: 체크리스트 칩/사진 필터 칩/리뷰 정렬 칩/DAY 칩이 공통 `Chip` 컴포넌트로 구현되고, 별점 표시가 공통 `StarRating`, 아바타가 공통 `InitialAvatar`, 바텀시트 4종이 공통 `BottomSheet`로 구현된다
- [ ] AC4: 체크리스트가 빈 상태(칩 선택)↔완료 상태(개별 체크 토글) 간 로컬로 전환된다
- [ ] AC5: 사진 탭에서 스크롤이 하단에 가까워지면 18장씩 추가 로드되며 총 247장 이후 더 로드하지 않는다 (`FlatList`가 아닌 `View` 그리드 + 상위 스크롤 감지 방식)
- [ ] AC6: 리뷰 탭 정렬 칩 클릭 시 active 스타일만 전환된다 (재정렬 로직 없음, 후속 이슈로 이관)
- [ ] AC7: 채팅 탭에서 메시지 입력 후 전송 시 로컬 리스트에 append되고 입력창이 초기화된다
- [ ] AC8: 코스에 저장 시트가 다일차 계획 선택 시 DAY 선택 스텝으로 전환되고, 단일/미정 계획은 바로 저장 완료 처리된다
- [ ] AC9: 바로 출발/공유하기/즐겨찾기 시트 모두 열림/닫힘 및 항목 선택 인터랙션이 동작하고, 완료 시 `Toast`로 피드백된다
- [ ] AC10: `pnpm exec tsc --noEmit`, `pnpm lint` 모두 통과한다
- [ ] AC11: 360dp(iPhone SE)~430dp(iPhone 15 Plus) 범위에서 레이아웃이 깨지지 않는다

## 10) 테스트 시나리오

- 정상 케이스: 탭 전환, 체크리스트 등록/수정, 코스저장 2단계 플로우, 사진 페이지네이션, 채팅 전송, 시트 4종 열림/닫힘
- 경계 케이스: 사진 247장 전부 로드 후 추가 로딩 없음, DAY가 없는 여행 계획(`seoul`, days=0) 선택 시 바로 저장, 체크리스트 전체 해제 시 저장 버튼 비활성화
- 실패 케이스: 해당 없음 (API 없음) — 다만 채팅 입력 공백만 있을 때 전송 무시되는지 확인

## 11) 오픈 이슈 / 결정 필요

- `ReviewWriteScreen`, `PhotoDetailScreen`으로의 네비게이션 파라미터 계약은 이번 스코프에서 최소(`spotId`)로만 연결하고, 상세 계약은 각 화면 구현 이슈에서 확정
- 내비게이션 앱 실행(카카오맵/네이버지도/Apple지도 딥링크)은 `Linking.openURL` 연동 대신 `Toast` 피드백 + `// TODO: 딥링크 연동`으로 대체
- 별도 QA 체크리스트는 구현 완료 후 `png-test-case` 스킬로 산출 예정 (Phase 4~5 사이)
- `src/components/home/FilterBottomSheet.tsx`, `CategoryFilter.tsx` 등 기존 파일도 신규 공통 컴포넌트(`BottomSheet`, `Chip`)로 교체하면 중복이 줄지만, 이번 이슈 범위 밖이므로 리팩토링하지 않음 — 필요 시 별도 이슈로 제안
- ~~포토제닉 날짜/시간 선택 UI 형태 미정~~ → **해결됨**: API팀 확인 결과대로 날짜는 3일 리스트, 시간은 네이티브 타임피커로 구현 완료 (3장 참고)
- `BookmarkSheet`의 즐겨찾기 컬렉션 생성은 세션 내 로컬 state로만 유지됨 — 새로고침/재진입 시 초기화됨. 영속화(AsyncStorage 등)는 API 연동 시 함께 처리 필요
- `MyPageStack`의 즐겨찾기(PIC MAP) 화면이 아직 없어 `BookmarkSheet`의 "즐겨찾기 보기" 버튼은 TODO로 비활성 상태 — 해당 화면 구현 후 연결 필요

---

## 작성 시 참고 문서

- 화면 구조/네비게이션: `docs/guide/dev/ui-publishing.md`
- 구현 규칙/디자인 제약: `CLAUDE.md`
- 프론트 구현 기준: `docs/guide/dev/development-guide.md` (SpotDetailScreen 콜랩싱 헤더 주의사항 포함)
- 기기/스케일링 기준: `docs/guide/dev/device-support.md`
