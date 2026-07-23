# 기능 스펙 — 방해 금지 설정 통합 (1c안) RN 구현 + 환경설정 v2

## 1) 기능 정보

- 기능명: 방해 금지 설정 통합 (1c안) + 환경설정 화면 v2 + 1:1 문의 화면 분리
- 담당자: 미정
- 관련 이슈: 없음
- 관련 도메인: `mypage`, `wishlist`
- 대상 플랫폼: iOS / Android

## 2) 문제와 목표

- 해결하려는 문제: 위시리스트 스팟마다 따로 있던 "방해 금지 시간" 설정을 전역 알림 설정(마이페이지 › 환경설정)의 "방해 금지" 섹션으로 통합한다. 동시에 환경설정 화면을 처음으로 실제 구현하고(v1은 빈 stub), v2 리뷰 피드백(FAQ 위계 정리, 1:1 문의 화면 분리, 기타 카드 통합)을 반영한다.
- 사용자 가치: 방해 금지 시간을 스팟마다 반복 설정할 필요 없이 한 곳에서 관리. 반복 요일 설정(평일/주말/사용자 지정)까지 지원.
- 완료 기준(한 줄): `SettingScreen`에서 방해 금지 모드/시간/반복을 설정할 수 있고, `WishlistSettingScreen`에는 더 이상 개별 방해 금지 시간 UI가 없으며, 1:1 문의는 별도 화면으로 진입한다.

## 3) 범위

- 포함(In Scope):
  - `src/screens/mypage/SettingScreen.tsx` 신규 구현 (현재 빈 stub) — `설정.native.jsx (v2)` 반영
  - `src/screens/wishlist/WishlistSettingScreen.tsx`에서 방해 금지 시간 행 + 관련 로컬 state(`dndStart`, `dndEnd`, `adjustTime`, `timeSheetVisible`, Time Picker Sheet JSX) 제거, 안내 문구로 대체
  - `DndTimeSheet`, `DndRepeatSheet`는 **`SettingScreen.tsx` 파일 하단에 인라인 컴포넌트로 정의** (별도 디렉터리/파일 신설 없음 — 결정 3)
  - `DndTimeSheet`는 **v2 디자인**(`방해금지 시간 시트.native.jsx (v2)`)으로 구현 — 아래 5) UI/UX 요구사항 참고
  - `src/hooks/useNotificationSettings.ts` 신규 — 내부는 `useState`로만 구현, API 연동 지점에 TODO 코멘트 (결정 2)
  - `src/screens/mypage/InquiryListScreen.tsx`/`InquiryDetailScreen.tsx`/`ComposeInquiryScreen.tsx` 신규 (1:1 문의 — 카드 내 인라인 폼에서 목록/상세/작성 화면으로 분리)
  - `src/navigation/stacks/MyPageStack.tsx`에 `Inquiry`/`InquiryDetail`/`ComposeInquiry` 라우트 추가, `SettingScreen`의 `onPress('contact')` → `navigation.navigate('Inquiry')` 연결
  - 회원 탈퇴 행은 기존 `#ff453a`(에러/danger 톤) 그대로 사용 — 신규 컬러 토큰 추가 없음 (결정 1)
  - 모든 신규/변경 컴포넌트는 NativeWind `className` + `normalize()`/`normalizeFontSize()` 조합으로 작성 (프로젝트 실제 컨벤션)
- 제외(Out of Scope):
  - **백엔드 API 연동**: `src/api/settings.ts`는 이 레포에 존재하지 않고, 이 레포는 프론트엔드 전용 범위(`docs/ai/00-context.md`)이다. DND GET/PATCH 엔드포인트 스펙이 아직 없으므로 실제 네트워크 연동은 하지 않는다. `useNotificationSettings.ts`는 이번 라운드에서 `useState`만 담당하고 API 연동은 후속 라운드.
  - **마이그레이션(스팟별 dndStart/dndEnd → 전역 기본값 승격, 최초 실행 배너)**: DB/백엔드 마이그레이션이며 이 레포에 스키마가 없다. `src/types/spot.ts`에는 애초에 `dndStart`/`dndEnd` 필드가 없다 — 해당 값은 `WishlistSettingScreen.tsx` 안의 로컬 `useState`로만 존재했다. 이번 작업에서는 그 로컬 state를 제거하는 것까지만 하고, 백엔드 마이그레이션/배너 UX는 DND 엔드포인트 스펙이 나온 뒤 별도 라운드로 진행한다.
  - **신규 컬러 토큰(`colors.ts`, `DANGER`)**: 도입하지 않음. 기존 `#ff453a`를 그대로 유지한다.
  - **시트 공용 디렉터리(`src/components/sheets/`) 신설**: 하지 않음. 다른 시트를 공용 디렉터리로 옮기는 리팩터링 계획도 없음.
  - `MyPageScreen.tsx` 리디자인: 현재 임시 화면("프로필(MY) 탭 임시 화면")이며 `Setting` 화면으로 진입하는 버튼이 없다. 이번 스펙은 `SettingScreen` 자체 구현만 다루고, MyPage 탭 진입 버튼 추가는 범위 밖(검증 방법에서 임시 우회 방법 명시).

## 4) 사용자 시나리오

- 시나리오 A — 방해 금지 모드 켜고 시간 조정:
  - Given: 사용자가 마이페이지 › 환경설정에 있다.
  - When: "방해 금지 모드" 토글을 켜고 "시간" 행을 탭해 시작 06:00 / 종료 08:00으로 조정 후 저장한다.
  - Then: "시간" 행에 "06:00 ~ 08:00"이 표시된다.
- 시나리오 B — 반복 사용자 지정:
  - Given: 방해 금지 반복 시트가 열려 있다.
  - When: "사용자 지정"을 선택하고 화·목만 선택 후 저장한다.
  - Then: "반복" 행 서브텍스트가 "화·목"으로 바뀐다. 0개 선택 시 저장 버튼이 비활성화되고 경고 문구가 뜬다.
- 시나리오 C — 위시리스트 설정 화면 진입:
  - Given: 사용자가 위시리스트 스팟 설정 화면에 있다.
  - When: "알림 설정" 카드를 확인한다.
  - Then: "방해 금지 시간" 행은 더 이상 없고, 카드 아래 "방해 금지 시간은 설정 › 방해 금지에서 모든 알림에 공통 적용돼요" 안내 문구만 보인다.
- 시나리오 D — 1:1 문의:
  - Given: 사용자가 환경설정 › 문의 섹션의 "1:1 문의" 행을 탭한다.
  - When: `InquiryListScreen`으로 이동해 새 문의 작성을 선택하면 `ComposeInquiryScreen`으로 이동한다.
  - Then: 문의 유형 선택 + 문의 내용(500자) 입력 후 "문의 보내기"가 활성화된다 (유형+내용 모두 있어야 활성).

## 5) UI/UX 요구사항

- 참조 목업 파일:
  - `src/components/ui/mypage/setting.html` (1c안 + 시간/반복 시트 HTML로 갱신 완료 — RN 구현의 1차 기준)
  - `src/components/ui/wishlist/wishlist-setting.html` (DND 행 제거 완료 — RN 구현의 1차 기준)
  - 참고용 원본 RN 목업(인라인 style, 데이터 구조만 참고하고 그대로 포팅 금지): `/Users/yeeun/Downloads/위시리스트 방해금지 설정 통합/설정.native.jsx`, `위시리스트 설정.native.jsx`, `방해금지 시간 시트.native.jsx`, `방해금지 반복 시트.native.jsx`, `문의하기.native.jsx`
- 화면 전환 규칙:
  - `SettingScreen` "시간" 행 탭 → `DndTimeSheet`(인라인 컴포넌트) 오픈, `@/components/common/BottomSheet` 사용
  - `SettingScreen` "반복" 행 탭 → `DndRepeatSheet`(인라인 컴포넌트) 오픈
  - `SettingScreen` "1:1 문의" 행 탭 → `navigation.navigate('Inquiry')`
  - 그 외 행(`profile`, `email`, `password`, `themes`, `social`, `location`, `block`, `faq-*`, `version`, `logout`, `delete-account`)은 이번 스펙에서 실제 네비게이션 로직을 새로 만들지 않음 — 기존 `WishlistSettingScreen`처럼 handler 자리만 마련
- 빈 상태/에러 상태: `DndSection`은 `state` prop(`normal`/`empty`/`unavailable`/`loading`)에 따라 다르게 렌더링 (원본 스펙 그대로 유지)
- 로딩 상태: `state === 'loading'`일 때 카드 자리에 스피너
- **`DndTimeSheet` v2 디자인** (`방해금지 시간 시트.native.jsx (v2)` 기준, v1에서 변경):
  - 레이아웃: 시작/종료를 좌우 2컬럼이 아니라 **한 카드 안에 위아래로 쌓은 행**으로 변경 (각 행 = 라벨 좌측 + 시·분 휠 2개 우측, 구분선으로 분리)
  - 헤더: 중앙 정렬 제목 → **좌측 정렬 제목 + 우측 원형 X 버튼**(배경 `CARD`)
  - 딤(dim) 밝기: 다른 시트는 공용 `BottomSheet`의 기본값(`rgba(0,0,0,0.4)`)을 쓰지만, 이 시트만 `rgba(0,0,0,0.20)`로 더 밝게 — 공용 `BottomSheet`에 `dimOpacity`(기본 0.4) prop을 추가해 이 시트에서만 0.2로 오버라이드 (다른 시트 호출부는 변경 없음)
  - 안내 문구: 자정 교차 시 강조 문구(브랜드 컬러) + **항상** 아래에 "총 N시간 M분 동안 알림이 꺼져요" 총 소요 시간 표기 (v1은 자정 교차/소요시간 중 하나만 보여줬음)
  - 소요 시간 계산: 시작=종료로 같으면 0분이 아니라 **24시간**으로 계산(`d <= 0`이면 `+24h`)
  - 휠 상/하단에 `expo-linear-gradient`(이미 설치됨, 버전 추가 불필요) 기반 fade mask 추가
  - CTA 라벨은 기존 계획과 동일하게 "저장"

## 6) 데이터/API 요구사항

- 사용 API: 없음 (Out of Scope 참조)
- 요청/응답 핵심 필드: N/A (후속 라운드에서 DND 엔드포인트 스펙 확정 후 작성)
- 실패 처리 방식: N/A
- 캐싱/무효화 전략: N/A

## 7) 상태 관리

- 서버 상태: 없음 (이번 라운드 범위 밖)
- 클라이언트 상태: `src/hooks/useNotificationSettings.ts`에서 `useState`로 관리 — `{ enabled, start, end, repeatPreset, repeatDays }` + setter들. 훅 내부에 `// TODO: API 연동 시 TanStack Query로 교체` 코멘트만 남김.
- 영속화 필요 여부: 없음 (다음 실행 시 초기값으로 리셋됨 — 이번 라운드에서는 정상 동작으로 간주)

## 8) 기술 제약 체크

- [x] NativeWind `className`만 사용 — 참고 `.native.jsx` 원본은 인라인 style만 쓰지만, `CLAUDE.md`가 단일 기준이므로 **className으로 변환**해서 구현
- [x] `StyleSheet.create()` 미사용
- [x] `@/` alias 사용
- [x] 타입 정의 명확 (`.tsx`, props/훅 반환 타입 명시)
- [x] 디자인 토큰 준수 (`#E31B59`, 52px 버튼 등, 회원 탈퇴는 기존 `#ff453a`)

## 9) 수용 기준 (Acceptance Criteria)

- [ ] AC1: `SettingScreen`이 stub이 아니라 실제 UI(계정/알림/방해 금지/개인정보/FAQ/문의/기타)를 렌더링한다.
- [ ] AC2: `WishlistSettingScreen`에 방해 금지 시간 행/시트/로컬 state가 없다. 대신 안내 문구가 있다.
- [ ] AC3: `DndTimeSheet`(v2, 위아래 행 레이아웃)에서 시작/종료 시간을 바꾸면 자정 교차 시 강조 문구 + 항상 총 소요 시간 문구가 뜨고(시작=종료면 24시간), 저장 시 "시간" 행 라벨이 갱신된다.
- [ ] AC4: `DndRepeatSheet`에서 "사용자 지정" 선택 후 요일 0개면 저장이 막히고, 1개 이상이면 라벨이 요일 조합(예: "화·목") 또는 프리셋 라벨로 갱신된다.
- [ ] AC5: `ComposeInquiryScreen`은 문의 유형 + 내용이 모두 있어야 "문의 보내기"가 활성화된다.
- [ ] AC6: `MyPageStack`에서 `Inquiry`/`InquiryDetail`/`ComposeInquiry` 라우트로 정상 진입 가능하다.
- [ ] AC7: `useNotificationSettings.ts`가 존재하고 `SettingScreen`이 이를 사용한다. 내부는 `useState`뿐이고 API 연동 지점에 TODO 코멘트가 있다.
- [ ] AC8: 신규 컬러 토큰이 추가되지 않았고, 회원 탈퇴 행은 기존 `#ff453a`를 사용한다.
- [ ] AC9: `pnpm exec tsc --noEmit`, `pnpm lint` 통과.

## 10) 테스트 시나리오

- 정상 케이스: 시나리오 A~D 모두 정상 동작
- 경계 케이스: 방해 금지 시작=종료 같은 값(자정 교차 문구), 반복 요일 전체 선택(→ "매일" 라벨과 동일 표기 여부 확인)
- 실패 케이스: 반복 요일 0개 저장 시도 시 저장 차단

## 11) 오픈 이슈 / 결정 필요

모두 확정됨 (디자인 담당자 확인 완료):

1. ~~DANGER 컬러 적용 범위~~ → **확정**: 신규 토큰 없음. 기존 `#ff453a` 그대로 사용.
2. ~~방해 금지 값의 저장/연동 범위~~ → **확정**: 이번 라운드는 로컬 state(`useNotificationSettings.ts`, 내부 `useState`)로만 구현. API 연동·마이그레이션·최초 실행 배너는 DND 엔드포인트 스펙 확정 후 별도 라운드.
3. ~~시트 컴포넌트 분리 여부~~ → **확정**: `src/components/sheets/` 신설 없음. `DndTimeSheet`/`DndRepeatSheet`는 `SettingScreen.tsx` 안에 인라인 컴포넌트로 정의.

남은 미결 사항:

- `SettingScreen` 진입 경로 부재: `MyPageScreen`이 아직 임시 화면이라 실기기/시뮬레이터에서 `Setting` 화면에 도달할 UI 진입점이 없다. → Plan에서 임시 검증용 버튼(커밋 전 되돌림)으로 처리.
- **HTML 목업과의 동기화**: `src/components/ui/mypage/setting.html`의 방해 금지 시간 시트는 v2 레이아웃(한 카드에 시작/종료를 위아래로 쌓은 행, 좌측 정렬 헤더)으로 갱신 완료됐다 (Section 1 "갱신 완료" 상태 참고).

---

## 작성 시 참고 문서

- 화면 구조/네비게이션: `docs/guide/dev/ui-publishing.md`
- 구현 규칙/디자인 제약: `CLAUDE.md`
- 프론트 구현 기준: `docs/guide/dev/development-guide.md`
- 기기/스케일링 기준: `docs/guide/dev/device-support.md`
