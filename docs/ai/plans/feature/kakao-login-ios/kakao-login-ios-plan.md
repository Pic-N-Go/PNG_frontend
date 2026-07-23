# Kakao Login iOS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** iOS에서 카카오 로그인 SDK를 연동하여 LoginScreen의 카카오 버튼이 실제 카카오 로그인을 시작하도록 한다.

**Architecture:** `@react-native-seoul/kakao-login` SDK를 사용한다. `expo prebuild`로 bare workflow 전환 후 iOS 네이티브 설정을 추가한다. LoginScreen의 기존 카카오 버튼 onPress를 SDK 호출로 교체하고, 획득한 액세스 토큰을 백엔드에 전달할 준비를 한다 (백엔드 API 미완성이므로 토큰 획득까지만 구현).

**Tech Stack:** React Native (Expo bare workflow), @react-native-seoul/kakao-login, Xcode, CocoaPods

> **구현 노트 (플랜 이탈):** Task 4는 `AppDelegate.mm` (Objective-C) 수정을 명시했으나, `expo prebuild`가 `AppDelegate.swift` (Swift)를 생성했기 때문에 Swift API(`AuthApi.isKakaoTalkLoginUrl`, `AuthController.handleOpenUrl`)로 구현함. 기능상 동일하며 Swift가 올바른 선택.

## Global Constraints

- NativeWind className 방식 유지 (StyleSheet.create 사용 금지)
- 모든 import는 `@/` alias 사용
- 번들 ID: `com.picngo.app`
- 카카오 네이티브 앱 키: `<YOUR_KAKAO_NATIVE_APP_KEY>` (PNG ios 키, `kakao` prefix 제외한 값 — 실제 값은 `.env` 참고)
- `.env`에 `EXPO_PUBLIC_` prefix로 저장
- 백엔드 API 연동은 이 플랜 범위 밖 — 토큰 획득까지만 구현

---

### Task 1: app.json 번들 ID 추가 및 .env 키 설정

**Files:**
- Modify: `app.json`
- Modify: `.env.example`
- Modify: `.env` (로컬, 커밋 안 함)

**Interfaces:**
- Produces: `process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` — 앱 키 문자열

- [ ] **Step 1: app.json에 번들 ID 추가**

`app.json`의 `ios`, `android` 섹션을 아래와 같이 수정:

```json
{
  "expo": {
    "name": "PNG",
    "slug": "png",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/logo/logo_2.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/logo/logo_2.png",
      "resizeMode": "contain",
      "backgroundColor": "#E31B59"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.picngo.app"
    },
    "android": {
      "package": "com.picngo.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/logo/logo_2.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false
    },
    "web": {
      "favicon": "./assets/images/logo/logo_2.png"
    },
    "plugins": []
  }
}
```

- [ ] **Step 2: .env.example에 카카오 키 항목 추가**

`.env.example`에 아래 줄 추가:
```text
EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY=
```

- [ ] **Step 3: .env에 실제 키 값 입력**

`.env` 파일에 아래 줄 추가 (커밋하지 않음):
```text
EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY=<YOUR_KAKAO_NATIVE_APP_KEY>
```

- [ ] **Step 4: 커밋**

```bash
git add app.json .env.example
git commit -m "chore: add bundle identifier and kakao env key placeholder"
```

---

### Task 2: expo prebuild 실행

**Files:**
- Create: `ios/` (자동 생성)
- Create: `android/` (자동 생성)

**Interfaces:**
- Produces: `ios/PNG/Info.plist`, `ios/PNG/AppDelegate.swift` — 다음 태스크에서 수정할 파일들

> ⚠️ 최신 Expo prebuild는 Objective-C(`AppDelegate.mm`)가 아니라 **Swift(`AppDelegate.swift`)** 를 생성합니다(현재 저장소도 `ios/PNG/AppDelegate.swift`). Task 4의 네이티브 핸들러는 Swift로 작성해야 하며, 아래 Objective-C 스니펫은 **동작 레퍼런스**입니다 — 실제 반영 시 `RNKakaoLogins`의 Swift API로 변환하고 라이브러리 README로 최종 확인하세요.

- [ ] **Step 1: prebuild 실행**

```bash
npx expo prebuild --clean
```

> `--clean` 옵션은 기존 ios/android 폴더가 없어도 안전하게 실행됨.
> 완료 시 `ios/`, `android/` 폴더가 생성됨.

- [ ] **Step 2: 생성 확인**

```bash
ls ios/
```

예상 출력: `PNG/`, `PNG.xcworkspace/`, `Podfile` 등이 보여야 함.

- [ ] **Step 3: 커밋**

```bash
git add ios/ android/
git commit -m "chore: expo prebuild - add ios and android native projects"
```

---

### Task 3: @react-native-seoul/kakao-login 설치

**Files:**
- Modify: `package.json` (자동)
- Modify: `ios/Podfile` (pod install 시 자동)

**Interfaces:**
- Produces: `import { login, logout } from '@react-native-seoul/kakao-login'` — Task 5에서 사용

- [ ] **Step 1: 패키지 설치**

```bash
pnpm add @react-native-seoul/kakao-login
```

- [ ] **Step 2: pod install**

```bash
cd ios && pod install && cd ..
```

> 완료 시 `Pods/` 하위에 `RNKakaoLogins` 폴더가 생겨야 함.

- [ ] **Step 3: 설치 확인**

```bash
ls ios/Pods/RNKakaoLogins
```

파일이 존재하면 성공.

- [ ] **Step 4: 커밋**

```bash
git add package.json pnpm-lock.yaml ios/Podfile ios/Podfile.lock
git commit -m "chore: install @react-native-seoul/kakao-login"
```

---

### Task 4: iOS 네이티브 설정

**Files:**
- Modify: `ios/PNG/Info.plist`
- Modify: `ios/PNG/AppDelegate.swift` (Objective-C `.mm`이 아님 — 아래 스니펫은 Swift로 변환해 반영)

**Interfaces:**
- Consumes: 카카오 네이티브 앱 키 `<YOUR_KAKAO_NATIVE_APP_KEY>`
- Produces: 카카오톡 앱 실행 및 URL 스킴 처리 가능한 iOS 앱

- [ ] **Step 1: Info.plist에 URL 스킴 및 쿼리 스킴 추가**

`ios/PNG/Info.plist`에서 `</dict>` 바로 위에 아래 항목 추가:

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>kakaokompassauth</string>
  <string>storykompassauth</string>
  <string>kakaolink</string>
</array>
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>kakao<YOUR_KAKAO_NATIVE_APP_KEY></string>
    </array>
  </dict>
</array>
```

- [ ] **Step 2: AppDelegate.swift에 카카오 SDK 핸들러 추가**

> 아래는 Objective-C 레퍼런스입니다. `AppDelegate.swift`에서는 `RNKakaoLogins`의 Swift API(`RNKakaoLogins.isKakaoTalkLoginUrl(url)` / `RNKakaoLogins.handleOpenUrl(url)`)로 옮기고, `application(_:open:options:)` 델리게이트 메서드에 구현하세요. 정확한 시그니처는 라이브러리 README로 확인.

`AppDelegate` 상단 import 아래에 추가:

```objc
#import <RNKakaoLogins.h>
```

같은 파일에서 `openURL` 메서드를 찾아 아래와 같이 수정 (없으면 `@implementation AppDelegate` 블록 안에 추가):

```objc
- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  if ([RNKakaoLogins isKakaoTalkLoginUrl:url]) {
    return [RNKakaoLogins handleOpenUrl:url];
  }
  return NO;
}
```

- [ ] **Step 3: Xcode에서 빌드 확인**

Xcode에서 `ios/PNG.xcworkspace` 열고 빌드(⌘B). 빌드 에러 없어야 함.

- [ ] **Step 4: 커밋**

```bash
git add ios/PNG/Info.plist ios/PNG/AppDelegate.mm
git commit -m "feat(ios): add kakao login url scheme and sdk handler"
```

---

### Task 5: LoginScreen 카카오 버튼 연결

**Files:**
- Modify: `src/screens/auth/LoginScreen.tsx`

**Interfaces:**
- Consumes: `login()` from `@react-native-seoul/kakao-login` — `Promise<KakaoOAuthToken>` 반환, `accessToken` 필드 포함
- Consumes: `useAuthStore` — 기존 `setLoggedIn(true)` (백엔드 연동 전 임시)

- [ ] **Step 1: kakao-login import 추가**

`LoginScreen.tsx` 상단 import 블록에 추가:

```ts
import { login as kakaoLogin } from '@react-native-seoul/kakao-login';
```

- [ ] **Step 2: 카카오 로그인 핸들러 추가**

`LoginScreen` 컴포넌트 내부 (기존 `showToast` 함수 아래)에 추가:

```ts
async function handleKakaoLogin() {
  try {
    const token = await kakaoLogin();
    console.log('[kakao] accessToken:', token.accessToken);
    // ponytail: 백엔드 API 연동 전 임시 처리 — API 완성 시 token을 서버로 전달
    setLoggedIn(true);
  } catch (e) {
    console.error('[kakao] login error:', e);
    showToast('카카오 로그인에 실패했어요');
  }
}
```

- [ ] **Step 3: 카카오 버튼 onPress 교체**

기존 카카오 버튼:
```tsx
<Pressable
  onPress={() => navigation.navigate('Onboarding', { provider: 'kakao' })}
```

를 아래로 교체:
```tsx
<Pressable
  onPress={handleKakaoLogin}
```

- [ ] **Step 4: 커밋**

```bash
git add src/screens/auth/LoginScreen.tsx
git commit -m "feat: wire kakao login button to SDK (token only, pending backend)"
```

---

### Task 6: Xcode 실기기/시뮬레이터 테스트

**Files:** 없음 (테스트 단계)

- [ ] **Step 1: Xcode에서 앱 실행**

```bash
pnpm ios
```

또는 Xcode에서 `ios/PNG.xcworkspace` 열고 실기기/시뮬레이터 선택 후 ▶ 실행.

- [ ] **Step 2: 카카오 로그인 버튼 탭**

로그인 화면에서 카카오 버튼 탭 → 카카오톡 앱이 열리거나 카카오 계정 입력 웹뷰가 뜨면 성공.

- [ ] **Step 3: 콘솔에서 로그인 성공 확인**

로그인 완료 후 Metro 콘솔(터미널)에 성공 로그가 출력되어야 함. 액세스 토큰은 베어러 자격증명이므로 전체 값을 로그로 남기지 말 것(공유 터미널·캡처·스크린샷 노출 위험). 성공 여부만 확인하거나, 부득이하면 마지막 4자리 등 마스킹된 일부만 남긴다:
```text
[kakao] 로그인 성공 (accessToken 확보)
```

- [ ] **Step 4: 에러 없으면 최종 커밋 및 푸시**

```bash
git push origin feature/kakao-login-ios
```
