# 히어로 높이 스케일링 정책

브랜치: `feat/auth-ui-publishing-parity`  
결정 일자: 2026-06-21  
상태: 확정 (별도 작업 예정)

---

## 참조 문서

| 문서 | 경로 |
|---|---|
| 디바이스 지원 정책 | `docs/guide/dev/device-support.md` |
| normalize 유틸 | `src/utils/normalize.ts` |
| 레이아웃 상수 | `src/constants/layout.ts` |

---

## 배경

auth 화면 3개(LoginScreen, SignupScreen, OnboardingScreen)의 히어로 영역 높이가 raw 픽셀로 고정되어 있어 360dp~430dp 기기 간 비율 차이 문제가 제기됨.

| 화면 | 현재 값 |
|---|---|
| LoginScreen | `height: 380` |
| SignupScreen | `height: 160` |
| OnboardingScreen | `height: 200` |

---

## 결정: Dimensions 기반 높이 비율 계산

### normalize() 미적용 이유

- `normalize()`는 기기 **너비** 기준 스케일링 — 높이 레이아웃에는 목적 불일치
- 히어로 영역은 버튼/아이콘 같은 고정 컴포넌트가 아니라 **화면 비율 컴포넌트**
- 360dp~430dp 지원 범위 내에서도 기기 height 편차가 커서 높이 비율 방식이 더 자연스러움
- 너비 기반으로 히어로 높이를 스케일하면 세로가 긴 기기에서 히어로가 의도보다 낮아짐

### 적용 방식

기준 디바이스 390×844 기준으로 비율화:

| 화면 | 기준값 | 비율 |
|---|---|---|
| LoginScreen | 380 / 844 | ≈ 0.450 |
| SignupScreen | 160 / 844 | ≈ 0.190 |
| OnboardingScreen | 200 / 844 | ≈ 0.237 |

---

## 구현 규칙

### 1. `useWindowDimensions()` 사용

`Dimensions.get('window')` 대신 React Native 공식 권장 훅 사용.  
portrait-only 프로젝트라 실질 차이는 없으나 일관성을 위해 훅 방식으로 통일.

```tsx
import { useWindowDimensions } from 'react-native';

const { height: SCREEN_H } = useWindowDimensions();
```

> 기준: `SCREEN_H`는 `window` 높이(시스템 safe area 포함)로 계산한다.  
> 본 프로젝트는 `ScreenContainer`에서 safe area를 처리하므로, 히어로 높이는 별도 safe area 차감 없이 위 기준을 공통 적용한다.

### 2. 비율 상수는 각 화면 파일 상단에 선언

화면 특화 값이므로 `layout.ts`에 추가하지 않음.

```tsx
// 파일 상단 모듈 레벨
const HERO_RATIO = 380 / 844; // LoginScreen 예시
```

### 3. 클램프(min/max) 적용

극단적인 화면(매우 짧거나 긴 기기)에서 과도한 크기 변화 방지.

```tsx
const heroHeight = Math.min(
  Math.max(SCREEN_H * HERO_RATIO, MIN),
  MAX
);
```

MIN/MAX는 기준 높이(390×844) 대비 대략 `-20% ~ +15%` 범위에서 설정한다.  
디자인 의도(히어로 존재감)는 유지하되, 짧은 화면/긴 화면에서 본문 영역 침범 또는 과도한 확장을 방지한다.

| 화면 | 기준값 | MIN | MAX |
|---|---|---|---|
| LoginScreen | 380 | 300 | 440 |
| SignupScreen | 160 | 130 | 200 |
| OnboardingScreen | 200 | 160 | 250 |

### 4. 키보드 표시 시 리사이즈 정책

입력 중심 auth 화면 특성상, 키보드 표시/해제 시 `window` 높이 변화로 히어로가 점프하면 UX가 불안정해질 수 있다.

- 기본 원칙: 히어로 높이는 화면 첫 렌더 시점 값을 기준으로 고정
- 키보드 표시 중에는 히어로 높이 재계산을 하지 않음
- 키보드가 닫힌 뒤에만(필요 시) 재계산 허용

```tsx
import { useRef } from 'react';
import { useWindowDimensions } from 'react-native';

const HERO_RATIO = 380 / 844;

export default function LoginScreen() {
  const { height: SCREEN_H } = useWindowDimensions();
  const initialHeroHeightRef = useRef<number | null>(null);

  const computedHeroHeight = Math.min(Math.max(SCREEN_H * HERO_RATIO, 300), 440);
  if (initialHeroHeightRef.current == null) {
    initialHeroHeightRef.current = computedHeroHeight;
  }

  const heroHeight = initialHeroHeightRef.current;
  // ...
}
```

### 전체 적용 예시 (LoginScreen 기준)

```tsx
import { useRef } from 'react';
import { useWindowDimensions } from 'react-native';

const HERO_RATIO = 380 / 844;

export default function LoginScreen() {
  const { height: SCREEN_H } = useWindowDimensions();
  const initialHeroHeightRef = useRef<number | null>(null);
  const computedHeroHeight = Math.min(Math.max(SCREEN_H * HERO_RATIO, 300), 440);
  if (initialHeroHeightRef.current == null) {
    initialHeroHeightRef.current = computedHeroHeight;
  }
  const heroHeight = initialHeroHeightRef.current;

  return (
    // ...
    <View style={{ height: heroHeight }}>
      {/* 히어로 콘텐츠 */}
    </View>
  );
}
```

---

## Out of Scope

현재 작업 중인 `auth-style-normalize` 플랜과 별도로 진행.  
별도 브랜치 또는 후속 커밋으로 처리 예정.
