# Kakao Login Android Implementation Plan

**Goal:** Android에서 카카오 로그인 SDK를 연동하여 LoginScreen의 카카오 버튼이 실제 카카오 로그인을 시작하도록 한다. 추가로 토큰 영속화(AsyncStorage persist)와 colorPrimary 브랜드 컬러 고정을 함께 처리한다.

**Architecture:** `@react-native-seoul/kakao-login` SDK (iOS와 동일 패키지). `expo-build-properties`로 Kakao Maven 레포지터리 주입. Expo config plugin(`withAndroidColorPrimary`)으로 `colorPrimary` prebuild 덮어쓰기 문제 해결. `AsyncStorage` + zustand `persist` 미들웨어로 토큰 영속화.

**Tech Stack:** React Native (Expo bare workflow), @react-native-seoul/kakao-login, expo-build-properties, @react-native-async-storage/async-storage, Android Studio, Gradle

## Global Constraints

- NativeWind className 방식 유지 (StyleSheet.create 사용 금지)
- 모든 import는 `@/` alias 사용
- 패키지명: `com.picngo.app`
- 카카오 Android 네이티브 앱 키: `<YOUR_KAKAO_ANDROID_NATIVE_APP_KEY>` (실제 값은 `.env` 참고)
- `.env`에 `EXPO_PUBLIC_KAKAO_ANDROID_NATIVE_APP_KEY` 로 저장
- 백엔드 API 연동은 이 플랜 범위 밖 — 토큰 획득까지만 구현

---

## 완료된 작업

- [x] `@react-native-async-storage/async-storage@2.1.2` 설치
- [x] `useAuthStore` zustand persist 미들웨어 적용 (AsyncStorage)
- [x] `plugins/withAndroidColorPrimary.js` — colorPrimary `#E31B59` 고정 config plugin
- [x] `expo-build-properties` 설치 + Kakao Maven 레포지터리 주입
- [x] `@react-native-seoul/kakao-login` 플러그인 설정 (Android 앱키, kotlinVersion: 2.0.21)
- [x] 카카오 개발자 콘솔 Android 플랫폼 등록 (패키지명 + 키 해시)
- [x] `LoginScreen` 카카오 버튼 → `handleKakaoLogin` 연결 (SDK 호출 + placeholder setAuth)
- [x] 실기기 테스트 완료 (카카오 로그인 동작 확인)
- [x] iOS prebuild 부수 효과 — `AppDelegate.swift` + `Info.plist` 카카오 URL 핸들링 자동 주입 (의도된 동작)
- [x] 리뷰 반영: `AndroidManifest.xml` / `strings.xml` EOF 개행 수정, `.env.example` iOS/Android 키 구분 주석 추가

## 환경 설정 참고

- **JAVA_HOME**: `/Applications/Android Studio.app/Contents/jbr/Contents/Home` (`~/.zshrc`에 등록)
- **ANDROID_HOME**: `~/Library/Android/sdk` (`~/.zshrc`에 등록)
- **NDK 버전**: `27.1.12297006`
- **Kotlin 버전**: `2.0.21` (KSP 호환)
- **debug.keystore**: `android/app/debug.keystore` (`.gitignore` 적용, 노션에 공유)
- **debug 키 해시**: `Xo8WBi6jzSxKDVR4drqm84yr9iU=` (카카오 콘솔 등록값)
- **`android/app/src/main/res/values/strings.xml`**: 카카오 앱키가 평문으로 포함되어 커밋됨 — 의도된 동작. 카카오 네이티브 앱 키는 공개 식별자(APK 디컴파일로 누구나 확인 가능)이며, Kakao 콘솔에서 패키지명 + 키 해시로 화이트리스트 검증하므로 키 노출 자체는 보안 위협 아님.

---

## 잔여 이슈

### Important

#### 토큰 평문 AsyncStorage 저장 (보안)

**현황:** `useAuthStore`의 `accessToken`이 AsyncStorage에 JSON 평문으로 저장됨. AsyncStorage는 암호화되지 않아 루팅된 기기에서 파일 직접 읽기 가능.

**해결책:** `expo-secure-store`로 교체 (iOS Keychain / Android Keystore 사용).

```ts
import * as SecureStore from 'expo-secure-store';

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// persist storage 옵션에 적용
storage: secureStorage
```

**주의:** Secure Store는 항목당 최대 2048 bytes 제한. 백엔드 JWT + 유저 정보가 2048 bytes를 초과하면 저장 실패. **백엔드 API 연동 후 토큰 크기 확인 필요.**

**토큰 크기 확인 방법:**
```ts
const stored = JSON.stringify({ accessToken: token.accessToken, user: ... });
console.log('storage size (bytes):', new Blob([stored]).size);
```

**작업 시점:** 백엔드 API 연동 스프린트에서 처리.

---

### Minor

#### refresh token 처리 미구현

`useAuthStore`에 `accessToken`만 있고 `refreshToken`이 없음. 토큰 만료 시 자동 갱신 로직 없어 사용자가 재로그인 필요. 백엔드 API 연동 시 함께 처리.
