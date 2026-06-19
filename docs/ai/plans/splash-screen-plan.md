# 구현 계획: splash-screen

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/splash-screen.md`
- 관련 목업: `src/components/ui/auth/login.html` (`#splash-screen` 블록)
- 완료 목표: Splash 화면 → 2.5초 로딩 → 페이드아웃 → Login 전환

## 2) 구현 전략

- 핵심 접근: 3개 파일 변경 최소화 — 패키지 설치 → App.tsx 폰트 추가 → SplashScreen 구현
- 리스크:
  - `Animated` width(`useNativeDriver: false`)와 opacity(`useNativeDriver: true`) 혼용 → 별개의 Animated.Value이므로 충돌 없음
  - Fugaz One 로드 전 화면 진입 시 폰트 flash → App.tsx의 `if (!fontsLoaded) return null` 패턴으로 방지
- 리스크 완화: App.tsx에서 Fugaz One 포함 후 로드 완료 확인 → splash 첫 렌더 시 폰트 보장

## 3) 작업 태스크

### Task 1 — @expo-google-fonts/fugaz-one 설치

- 변경 내용: `pnpm add @expo-google-fonts/fugaz-one`
- 완료 조건: package.json에 `@expo-google-fonts/fugaz-one` 추가, pnpm install 정상 종료
- 검증 방법: `pnpm list @expo-google-fonts/fugaz-one`

### Task 2 — App.tsx에 Fugaz One 폰트 로드 추가

- 대상 파일: `App.tsx`
- 변경 내용:
  ```tsx
  // 기존
  import { useFonts } from "expo-font";
  // 추가
  import { FugazOne_400Regular } from "@expo-google-fonts/fugaz-one";

  // useFonts에 추가
  const [fontsLoaded, fontError] = useFonts({
    PretendardVariable: require("./assets/fonts/PretendardVariable.ttf"),
    FugazOne_400Regular,  // 추가
  });
  ```
- 완료 조건: App.tsx tsc 통과, 기존 Pretendard 폰트 로딩 유지
- 검증 방법: `pnpm exec tsc --noEmit`

### Task 3 — SplashScreen.tsx 구현

- 대상 파일: `src/screens/auth/SplashScreen.tsx`
- 변경 내용:
  ```
  레이아웃:
  Animated.View (flex:1, bg:#E31B59, opacity)
    ├── View (flex:1, center) ← 로고 영역
    │     ├── Text "P N G"  (FugazOne_400Regular, 80dp, white)
    │     └── Text "PIC N GO" (Pretendard, 12dp, rgba(255,255,255,0.85), letterSpacing 3.5)
    ├── View (absolute, bottom=loadingBarBottom) ← 로딩 바
    │     └── View (track: 100×3, rgba(0.2))
    │           └── Animated.View (width: 0→100, rgba(0.9))
    └── View (absolute, bottom=homeIndicatorBottom) ← 홈 인디케이터
          └── View (110×5, rgba(0.3), rx 2.5)

  애니메이션 (useEffect, mount 시):
    1. loadingBarWidth: 0→100, duration 2500ms, useNativeDriver: false
    2. setTimeout(2500ms) → screenOpacity: 1→0, 400ms, useNativeDriver: true
       → onComplete: navigation.replace('Login')
    3. cleanup: clearTimeout

  포지셔닝 (Dimensions + useSafeAreaInsets):
    scaleY = SCREEN_HEIGHT / 844
    loadingBarBottom = insets.bottom + round(50 * scaleY)
    homeIndicatorBottom = max(8, round(insets.bottom * 0.5))
  ```
- 완료 조건: tsc, lint 통과. AuthStack 타입 오류 없음
- 검증 방법: `pnpm exec tsc --noEmit` + `pnpm lint`

## 4) 검증 체크포인트

- [ ] `pnpm exec tsc --noEmit` 통과
- [ ] `pnpm lint` 통과
- [ ] AuthStackParamList 'Splash' 타입 일치
- [ ] StyleSheet.create 미사용
- [ ] @/ alias 사용
- [ ] TODO 수동 검증: 앱 실행 → Splash(핑크, 로딩 바 채워짐) → 2.5초 후 페이드아웃 → Login 진입

## 5) 롤백 계획

- 영향 파일: `App.tsx`, `src/screens/auth/SplashScreen.tsx`, `package.json`, `pnpm-lock.yaml`
- 되돌림: `git restore App.tsx src/screens/auth/SplashScreen.tsx`
- 패키지 롤백: `pnpm remove @expo-google-fonts/fugaz-one`

## 6) PR 구성

- PR 제목: `feat(auth): SplashScreen 퍼블리싱 구현 — 로고·로딩바·페이드아웃`
- 변경 요약:
  - HTML #splash-screen 목업 기반 RN 구현 (핑크 배경, Fugaz One 로고, 진행 로딩 바)
  - 2500ms 대기 후 opacity fade-out → Login.replace 전환
  - 기기별 safe area 기반 동적 포지셔닝
- 리뷰 요청 포인트: Animated 혼용(`useNativeDriver: false/true`), 폰트 로딩 타이밍
