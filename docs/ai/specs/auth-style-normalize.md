# 기능 스펙: auth-style-normalize

## 1) 기능 정보

- 기능명: auth 화면 반응형 스타일 normalize 정규화
- 담당자: @yeni
- 관련 이슈: 없음
- 대상 플랫폼: iOS / Android (360dp–430dp)
- 입력 문서: `docs/ai/review-responsive-style-fixes.md`

## 2) 문제와 목표

- 해결하려는 문제: auth 화면 4개 파일에 raw 픽셀 숫자(`48`, `24`, `50`, `12` 등)가 남아있어 360dp 기기에서 레이아웃 비율이 기준값과 달라짐
- 사용자 가치: 보급형 안드로이드(360dp)~Pro Max(430dp) 전 범위에서 일관된 UI 비율 유지
- 완료 기준(한 줄): auth 4개 파일의 고정 픽셀 수치가 모두 layout 상수 또는 normalize()로 대체됨

## 3) 범위

- 포함(In Scope):
  - [1] LoginScreen 소셜 버튼 `height: normalize(48)`, `borderRadius: normalize(24)`
  - [2] LoginScreen 바텀시트 `paddingHorizontal: 24` → `SPACING_LG`
  - [3] LoginScreen 바텀시트 TextInput `height: 50` → `INPUT_HEIGHT`, `fontSize` → `FONT_MD`/`FONT_XL`
  - [4] SignupScreen `labelStyle` `fontSize: 13` → `FONT_SM`, `ErrorText`/TermItem `fontSize: 12` → `FONT_XS`
  - [5] OnboardingScreen `fontSize: 12` → `FONT_XS`
  - [6] LoginScreen 히어로 로고 `fontSize: 40` → `normalizeFontSize(40)`
  - [7] AuthCheckbox `dim: 18/22` → `ICON_SM`/`ICON_MD`
  - [8] Toast `bottom: 48` → `insets.bottom + normalize(16)` (safe area 기반)
  - [9] SignupScreen 히어로 LinearGradient `locations={[0, 0.6, 1]}` 추가

- 제외(Out of Scope):
  - 히어로 고정 높이(`380`, `160`, `200`) 스케일링 — 너비 기반 normalize 적용 시 비율 어색, 팀 정책 결정 필요 (리뷰 문서 "별도 논의 필요" 항목)
  - auth 외 다른 화면 정규화

## 4) 사용자 시나리오

- 시나리오 A (360dp 기기):
  - Given: 안드로이드 360dp 기기에서 로그인 화면 진입
  - When: 카카오/Apple 소셜 버튼, Toast, 비밀번호 찾기 바텀시트 표시
  - Then: 버튼 높이/radius/폰트가 기준값과 동일한 비율로 렌더링됨
- 시나리오 B (Dynamic Island 기기):
  - Given: iPhone 14 Pro (insets.bottom ≈ 34dp) 에서 에러 Toast 표시
  - When: Toast가 화면 하단에 표시
  - Then: 홈 인디케이터와 겹치지 않고 `insets.bottom + 16dp` 위치에 렌더링됨

## 5) UI/UX 요구사항

- 참조 목업 파일: `src/components/ui/auth/login.html`
- 수정 대상 파일: `LoginScreen.tsx`, `SignupScreen.tsx`, `OnboardingScreen.tsx`, `AuthCheckbox.tsx`, `Toast.tsx`
- 시각적 변화 없음 (390dp 기준 기기에서는 normalize 결과가 원래 값과 동일 또는 근사)

## 6) 데이터/API 요구사항

- 없음 (스타일 전용 변경)

## 7) 상태 관리

- 서버 상태: 없음
- 클라이언트 상태(Zustand): 없음
- `useSafeAreaInsets()` — `react-native-safe-area-context` (이미 설치됨)

## 8) 기술 제약 체크

- [x] NativeWind `className`만 사용 (스타일 수정은 `style={}` prop 내부 값만 교체)
- [x] `StyleSheet.create()` 미사용
- [x] `@/` alias 사용
- [x] 타입 정의 명확
- [x] 디자인 토큰 준수 (`src/constants/layout.ts` 상수 사용)

## 9) 수용 기준 (Acceptance Criteria)

- [ ] AC1: auth 5개 파일 내 raw 픽셀 숫자(버튼 높이, fontSize, padding, icon dim)가 모두 layout 상수 또는 normalize()로 대체됨 (닉네임 카운터/에러 텍스트 포함)
- [ ] AC2: Toast가 `useSafeAreaInsets`를 사용해 safe area 기반 bottom 위치를 가짐
- [ ] AC3: SignupScreen 히어로 LinearGradient에 `locations={[0, 0.6, 1]}` 명시됨
- [ ] AC4: `pnpm exec tsc --noEmit` + `pnpm lint` 통과

## 10) 테스트 시나리오

- 정상 케이스: 390dp 시뮬레이터에서 로그인/회원가입/온보딩 화면 렌더링 확인
- 경계 케이스: 360dp 기기(또는 시뮬레이터 축소) 에서 버튼/폰트 비율 확인
- 실패 케이스: Toast가 홈 인디케이터와 겹치지 않는지 Dynamic Island 기기에서 확인

## 11) 오픈 이슈 / 결정 필요

- 히어로 고정 높이(`380`, `160`, `200`) 스케일링 방식 → `docs/ai/review-hero-height-scaling.md`에서 확정, 별도 커밋으로 처리 완료
- `FONT_XS = normalizeFontSize(11)`을 `fontSize: 12` 대체로 사용 (1px 근사 — 허용)
