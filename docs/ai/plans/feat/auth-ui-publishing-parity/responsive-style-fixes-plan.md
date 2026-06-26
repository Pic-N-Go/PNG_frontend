# 반응형 · 스타일 규격 수정 항목

브랜치: `feat/auth-ui-publishing-parity`  
리뷰 기준: 반응형 적합성 (360dp–430dp) + 공통 스타일 규격 준수

---

## 참조 문서

| 문서 | 경로 | 참조 이유 |
|---|---|---|
| 디바이스 지원 정책 | `docs/guide/dev/device-support.md` | normalize 사용 기준, 지원 기기 범위 |
| 레이아웃 상수 | `src/constants/layout.ts` | BUTTON_HEIGHT, FONT_*, SPACING_*, ICON_* |
| normalize 유틸 | `src/utils/normalize.ts` | 고정 픽셀 스케일링 함수 |
| 스타일 규칙 | `CLAUDE.md` → Design System 섹션 | 브랜드 컬러, 버튼 규격, 타이포그래피 |

---

## 수정 항목

### [1] 소셜 버튼 높이/radius normalize 미적용

- **파일**: `src/screens/auth/LoginScreen.tsx`
- **위치**: 카카오 버튼 (~line 336), Apple 버튼 (~line 358)
- **문제**: `height: 48, borderRadius: 24`가 raw 숫자. normalize를 거치지 않아 360dp 기기에서 기준값과 비율이 달라짐
- **수정**:
  ```tsx
  // 변경 전
  height: 48,
  borderRadius: 24,

  // 변경 후
  height: normalize(48),
  borderRadius: normalize(24),
  ```
- **참조**: `src/utils/normalize.ts`, `docs/guide/dev/device-support.md` — 버튼 높이는 normalize 적용 대상

---

### [2] 바텀시트 `paddingHorizontal: 24` → `SPACING_LG`

- **파일**: `src/screens/auth/LoginScreen.tsx`
- **위치**: 비밀번호 찾기 바텀시트 내부 (~line 445, 481, 550)
- **문제**: `paddingHorizontal: 24`가 raw 숫자. `SPACING_LG = normalize(24)`와 값은 같지만 normalize를 거치지 않음
- **수정**:
  ```tsx
  // 변경 전
  paddingHorizontal: 24

  // 변경 후
  paddingHorizontal: SPACING_LG
  ```
- **참조**: `src/constants/layout.ts` — `SPACING_LG = normalize(24)`

---

### [3] 바텀시트 TextInput `height`, `fontSize` raw 숫자

- **파일**: `src/screens/auth/LoginScreen.tsx`
- **위치**: Step 1 TextInput (~line 494), Step 2 TextInput (~line 563)
- **문제**: `height: 50`이 `INPUT_HEIGHT`(normalize(52))와 2px 불일치. `fontSize: 16`, `fontSize: 24`가 normalizeFontSize를 거치지 않음
- **수정**:
  ```tsx
  // Step 1 TextInput
  height: INPUT_HEIGHT,   // normalize(52)
  fontSize: FONT_MD,      // normalizeFontSize(15)

  // Step 2 TextInput (인증코드 강조)
  height: INPUT_HEIGHT,
  fontSize: FONT_XL,      // normalizeFontSize(22)
  ```
- **참조**: `src/constants/layout.ts` — `INPUT_HEIGHT`, `FONT_MD`, `FONT_XL`

---

### [4] SignupScreen `labelStyle`, `ErrorText` fontSize raw 숫자

- **파일**: `src/screens/auth/SignupScreen.tsx`
- **위치**: `labelStyle` (~line 388), `ErrorText` (~line 399), TermItem "보기" 레이블 (~line 430)
- **문제**: `fontSize: 13`, `fontSize: 12`가 raw 숫자. normalizeFontSize 미적용
- **수정**:
  ```tsx
  // labelStyle
  fontSize: FONT_SM,   // normalizeFontSize(13)

  // ErrorText, TermItem "보기"
  fontSize: FONT_XS,   // normalizeFontSize(11) — 12에 근사
  ```
- **참조**: `src/constants/layout.ts` — `FONT_SM`, `FONT_XS`

---

### [5] OnboardingScreen `fontSize: 12` raw 숫자

- **파일**: `src/screens/auth/OnboardingScreen.tsx`
- **위치**: ~line 173 ("마지막 단계" 레이블)
- **문제**: `fontSize: 12` raw 숫자. `FONT_XS`(normalizeFontSize(11)) 미사용
- **수정**:
  ```tsx
  fontSize: FONT_XS
  ```
- **참조**: `src/constants/layout.ts` — `FONT_XS`

---

### [6] LoginScreen 히어로 로고 `fontSize: 40` raw 숫자

- **파일**: `src/screens/auth/LoginScreen.tsx`
- **위치**: 히어로 내 "P N G" 로고 텍스트 (~line 184)
- **문제**: `fontSize: 40`이 raw 숫자. SplashScreen은 `normalizeFontSize(80)` 사용 중
- **수정**:
  ```tsx
  fontSize: normalizeFontSize(40)
  ```
  > `normalizeFontSize`는 `src/utils/normalize.ts`에서 import
- **참조**: `src/utils/normalize.ts`, `src/screens/auth/SplashScreen.tsx` (일관성 기준)

---

### [7] AuthCheckbox `dim` raw 숫자 → `ICON_SM / ICON_MD`

- **파일**: `src/components/auth/AuthCheckbox.tsx`
- **위치**: line 12–13
- **문제**: `dim = 18 / 22`가 raw 숫자. `ICON_SM = normalize(18)`, `ICON_MD = normalize(22)` 상수가 `layout.ts`에 이미 정의되어 있음
- **수정**:
  ```tsx
  // 변경 전
  const dim = size === 'sm' ? 18 : 22;

  // 변경 후
  const dim = size === 'sm' ? ICON_SM : ICON_MD;
  ```
  > `AuthCheckbox.tsx` 상단에 `import { ICON_SM, ICON_MD } from '@/constants/layout'` 추가
- **참조**: `src/constants/layout.ts` — `ICON_SM = normalize(18)`, `ICON_MD = normalize(22)`

---

### [8] Toast `bottom: 48` → safe area insets 기반

- **파일**: `src/components/auth/Toast.tsx`
- **위치**: ~line 43
- **문제**: `bottom: 48`이 raw 숫자이며 safe area를 고려하지 않음. Dynamic Island 기기(insets.bottom ≈ 34dp)에서 홈 인디케이터와 Toast가 겹칠 수 있음
- **수정**:
  ```tsx
  import { useSafeAreaInsets } from 'react-native-safe-area-context';

  export default function Toast(...) {
    const insets = useSafeAreaInsets();
    // ...
    // style에서
    bottom: insets.bottom + normalize(16),
  }
  ```
- **참조**: `docs/guide/dev/device-support.md` — safe area 처리 정책

---

### [9] SignupScreen 히어로 gradient `locations` prop 누락

- **파일**: `src/screens/auth/SignupScreen.tsx`
- **위치**: 히어로 LinearGradient (~line 107–112)
- **문제**: LoginScreen, OnboardingScreen은 `locations` prop을 명시하지만 SignupScreen만 누락. 기본 균등 분포로 렌더링되어 의도한 그라디언트와 차이가 있을 수 있음
- **수정**:
  ```tsx
  <LinearGradient
    colors={['#2d1b4e', '#8b4a6b', '#d4856a']}
    locations={[0, 0.6, 1]}
    ...
  />
  ```
- **참조**: `CLAUDE.md` — Hero gradient 색상 스펙, `src/screens/auth/LoginScreen.tsx` (기준)

---

## 별도 논의 필요

### 히어로 고정 높이 (`380, 160, 200`) 스케일링 방식

- **파일**: `LoginScreen.tsx`, `SignupScreen.tsx`, `OnboardingScreen.tsx`
- **현황**: 히어로 높이가 raw 픽셀로 고정되어 360dp 기기에서 상대 비율이 달라질 수 있음
- **판단 보류 이유**: `normalize()`는 너비 기반 스케일링이라 높이 값에 적용하면 비율이 어색해질 수 있음. `Dimensions.get('window').height * 0.45` 같은 높이 기반 계산이 더 적합할 수 있어 팀 정책 결정 필요
- **참조**: `docs/guide/dev/device-support.md`, `src/utils/normalize.ts`
