# 구현 계획: auth-style-normalize

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/feature/auth-ui-publishing-parity/auth-style-normalize.md`
- 리뷰 문서: `docs/ai/review-responsive-style-fixes.md`
- 관련 상수: `src/constants/layout.ts`, `src/utils/normalize.ts`
- 완료 목표: auth 5개 파일의 raw 픽셀 수치를 layout 상수/normalize로 전면 교체

## 2) 구현 전략

- 핵심 접근: 파일별 단독 수정 (의존성 없음) → 컴포넌트 먼저, 화면 후순
- 리스크: LoginScreen 수정 항목이 4개(가장 많음) — 라인 번호가 근사치이므로 실제 코드 확인 필수
- 리스크 완화: 각 Task마다 파일 Read 후 실제 위치 확인, 수정 후 tsc/lint 검증

## 3) 작업 태스크

### Task 1 — AuthCheckbox.tsx: dim raw 숫자 → ICON_SM / ICON_MD

- 대상 파일: `src/components/auth/AuthCheckbox.tsx`
- 변경 내용:
  - `const dim = size === 'sm' ? 18 : 22` → `const dim = size === 'sm' ? ICON_SM : ICON_MD`
  - import에 `ICON_SM, ICON_MD` 추가 (`@/constants/layout`)
- 완료 조건: dim이 상수 참조로 교체됨
- 검증 방법: tsc --noEmit, lint

### Task 2 — Toast.tsx: bottom 고정값 → safe area insets

- 대상 파일: `src/components/auth/Toast.tsx`
- 변경 내용:
  - `useSafeAreaInsets` import 추가 (`react-native-safe-area-context`)
  - `normalize` import 추가 (`@/utils/normalize`)
  - `bottom: 48` → `bottom: insets.bottom + normalize(16)`
  - 컴포넌트 함수 내부에 `const insets = useSafeAreaInsets()` 추가
- 완료 조건: bottom이 safe area 기반으로 계산됨
- 검증 방법: tsc --noEmit, lint

### Task 3 — OnboardingScreen.tsx: fontSize raw → FONT_XS

- 대상 파일: `src/screens/auth/OnboardingScreen.tsx`
- 변경 내용:
  - `~line 173` "마지막 단계" 레이블 `fontSize: 12` → `fontSize: FONT_XS`
  - `~line 252` 닉네임 글자수 카운터 `fontSize: 12` → `fontSize: FONT_XS` (리뷰 후 추가)
  - `~line 264` 닉네임 에러 텍스트 `fontSize: 12` → `fontSize: FONT_XS` (리뷰 후 추가)
  - import에 `FONT_XS` 추가 (`@/constants/layout`, 이미 있으면 추가만)
- 완료 조건: raw fontSize: 12 전체 제거
- 검증 방법: tsc --noEmit, lint

### Task 4 — SignupScreen.tsx: fontSize 상수화 + gradient locations

- 대상 파일: `src/screens/auth/SignupScreen.tsx`
- 변경 내용:
  - `~line 388` labelStyle `fontSize: 13` → `fontSize: FONT_SM`
  - `~line 399` ErrorText `fontSize: 12` → `fontSize: FONT_XS`
  - `~line 430` TermItem "보기" 레이블 `fontSize: 12` → `fontSize: FONT_XS`
  - `~line 281` 닉네임 글자수 카운터 `fontSize: 12` → `fontSize: FONT_XS` (리뷰 후 추가)
  - `~line 107–112` 히어로 LinearGradient에 `locations={[0, 0.6, 1]}` prop 추가
  - import에 `FONT_SM, FONT_XS` 추가 (`@/constants/layout`)
- 완료 조건: raw fontSize 제거, gradient locations 명시됨
- 검증 방법: tsc --noEmit, lint

### Task 5 — LoginScreen.tsx: 소셜 버튼 + 바텀시트 + 히어로 로고 정규화

- 대상 파일: `src/screens/auth/LoginScreen.tsx`
- 변경 내용:
  - [1] `~line 336` 카카오 버튼: `height: 48` → `height: normalize(48)`, `borderRadius: 24` → `borderRadius: normalize(24)`
  - [1] `~line 358` Apple 버튼: 동일 패턴
  - [2] `~line 445, 481, 550` 바텀시트 `paddingHorizontal: 24` → `paddingHorizontal: SPACING_LG`
  - [3] `~line 494` Step1 TextInput: `height: 50` → `height: INPUT_HEIGHT`, `fontSize: 16` → `fontSize: FONT_MD`
  - [3] `~line 563` Step2 TextInput: `height: 50` → `height: INPUT_HEIGHT`, `fontSize: 24` → `fontSize: FONT_XL`
  - [6] `~line 184` 히어로 로고 텍스트: `fontSize: 40` → `fontSize: normalizeFontSize(40)`
  - import에 `normalize, normalizeFontSize` (`@/utils/normalize`), `SPACING_LG, INPUT_HEIGHT, FONT_MD, FONT_XL` (`@/constants/layout`) 추가 (없는 것만)
- 완료 조건: raw 픽셀 6곳 전부 교체
- 검증 방법: tsc --noEmit, lint

## 4) 검증 체크포인트

- [ ] Type check 통과 (`pnpm exec tsc --noEmit`)
- [ ] Lint 통과 (`pnpm lint`)
- [ ] 390dp 시뮬레이터에서 login/signup/onboarding 화면 레이아웃 이상 없음 (수동)
- [ ] Toast가 홈 인디케이터 위에 표시됨 (수동, Dynamic Island 기기 또는 iPhone 14 Pro 시뮬)

## 5) 롤백 계획

- 영향 파일: `LoginScreen.tsx`, `SignupScreen.tsx`, `OnboardingScreen.tsx`, `AuthCheckbox.tsx`, `Toast.tsx`
- 되돌림 방법: `git restore src/screens/auth/LoginScreen.tsx src/screens/auth/SignupScreen.tsx src/screens/auth/OnboardingScreen.tsx src/components/auth/AuthCheckbox.tsx src/components/auth/Toast.tsx`
- 데이터 영향: 없음

## 6) PR 구성

- PR 제목: `fix(auth): raw 픽셀 → normalize 상수 정규화 (반응형 스타일)`
- 변경 요약: auth 화면 5개 파일의 고정 픽셀값을 layout 상수/normalize로 교체, Toast safe area 대응
- 리뷰 요청 포인트: FONT_XS(11px) 적용이 원래 fontSize: 12 대체로 적합한지 확인
