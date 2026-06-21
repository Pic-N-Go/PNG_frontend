# 기능 스펙: splash-screen

## 1) 기능 정보

- 기능명: SplashScreen — 앱 시작 시 스플래시 오버레이 구현
- 담당자: @lucy
- 관련 이슈: 없음
- 대상 플랫폼: iOS / Android

## 2) 문제와 목표

- 해결하려는 문제: `SplashScreen.tsx`가 빈 `<View />`만 반환하는 스텁 상태
- 사용자 가치: 앱 첫 진입 시 브랜드 경험 제공 (핑크 배경 + 로고 + 로딩 바 → 페이드아웃 → 로그인)
- 완료 기준: 앱 실행 시 Splash 화면 2.5초 + 페이드아웃 400ms → Login 전환 정상 동작

## 3) 범위

- 포함(In Scope):
  - `src/screens/auth/SplashScreen.tsx` 구현
  - `App.tsx`에 Fugaz One 폰트 로드 추가 (기존 `useFonts` 패턴 확장)
  - `@expo-google-fonts/fugaz-one` 패키지 설치
- 제외(Out of Scope):
  - Login / Signup / Onboarding 화면 변경
  - AuthStack 네비게이션 구조 변경 (Splash가 첫 화면인 현재 구조 유지)
  - Native splash screen (expo-splash-screen) 설정 변경

## 4) 디자인 레퍼런스

- HTML 목업: `src/components/ui/auth/login.html` — `#splash-screen` 블록 및 하단 fade-out 스크립트
- 핵심 요소 (SVG viewBox="0 0 390 844" 기준):
  - 전체 배경: `#E31B59`
  - 상태바: 시스템 StatusBar(`barStyle="light-content"`) 사용 (커스텀 드로잉 제외)
  - 로고: "P N G" (Fugaz One, white) + "PIC N GO" (Pretendard, rgba(255,255,255,0.85), letterSpacing 3.5)
  - 로딩 바 트랙: 100×3dp, `rgba(255,255,255,0.2)`, rx=1.5
  - 로딩 바 진행: 0→100dp, `rgba(255,255,255,0.9)`, duration=2500ms
  - 홈 인디케이터: 110×5dp, `rgba(255,255,255,0.3)`, rx=2.5

## 5) UI/UX 요구사항

- 참조 목업 파일: `src/components/ui/auth/login.html` (`#splash-screen`)
- 화면 전환: `navigation.replace('Login')` — Splash를 스택에서 제거
- 애니메이션 시퀀스:
  1. mount → 로딩 바 width 0→100dp (2500ms, `useNativeDriver: false`)
  2. mount → setTimeout 2500ms 후 opacity 1→0 (400ms, `useNativeDriver: true`)
  3. opacity 애니메이션 완료 콜백에서 `navigation.replace('Login')`

## 6) 데이터/API 요구사항

해당 없음

## 7) 상태 관리

- 로컬 Animated.Value 2개: `screenOpacity`(1→0), `loadingBarWidth`(0→100)
- 스토어 사용 없음

## 8) 기술 제약 체크

- [ ] `StyleSheet.create()` 미사용
- [ ] `@/` alias 사용
- [ ] NativeWind `className` 우선, 정밀 스타일은 inline style
- [ ] `any` 타입 없음
- [ ] `NativeStackScreenProps<AuthStackParamList, 'Splash'>` 타입 사용

## 9) 기기별 포지셔닝 (Q4·Q5 결정사항)

설계 기준: 390×844dp (iPhone 15)

```
scaleY = SCREEN_HEIGHT / 844

// 로딩 바: 시스템 safe area 위 + 비례 여백
loadingBarBottom = insets.bottom + round(50 * scaleY)
  → iPhone 15(844dp, insets=34): 84dp  ← HTML 그대로

// 홈 인디케이터: safe area 중간 (장식 바)
homeIndicatorBottom = max(8, round(insets.bottom * 0.5))
  → iPhone 15(insets=34): 17dp
```

## 10) 수용 기준 (Acceptance Criteria)

- [ ] AC1: 앱 실행 시 전체화면 `#E31B59` 배경에 "P N G"(Fugaz One) + "PIC N GO" 텍스트 표시
- [ ] AC2: 하단 로딩 바가 2.5초에 걸쳐 0→100% 채워짐
- [ ] AC3: 2500ms 후 화면이 페이드아웃(400ms)되며 Login 화면으로 전환 (뒤로가기로 Splash 복귀 불가)
- [ ] AC4: tsc, lint 에러 없음

## 11) 오픈 이슈 / 결정 필요

- Fugaz One은 `useFonts`로 비동기 로드 → App.tsx의 `if (!fontsLoaded && !fontError) return null` 패턴으로 폰트 준비 후 앱 진입 보장 (폰트 flash 없음)
- 기존 `StatusBar style="light"` (expo-status-bar, App.tsx)와 SplashScreen 내 `StatusBar barStyle="light-content"` (react-native) 중복 설정 → SplashScreen에서는 별도 `<StatusBar>` 렌더 불필요 (App.tsx가 전역 처리)
