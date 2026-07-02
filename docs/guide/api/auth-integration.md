# Auth API 연동 현황

> 브랜치: `feature/auth-login-signup-api` (이후 `feature/kakao-login-ios`, `feature/kakao-login-android`, `feature/login-v3`에서 계속 연동)
> 작업 기준일: 2026-07-02

---

## 연동 완료

| 화면 | 기능 | 엔드포인트 | 상태 |
|---|---|---|---|
| LoginScreen | 이메일 로그인 | `POST /auth/login` | ✅ 완료 |
| SignupScreen | 회원가입 (관심테마 포함) | `POST /auth/register` | ✅ 완료 |
| SignupScreen | 이메일 인증코드 발송 | `POST /auth/email/verify` | ✅ 완료 |
| SignupScreen | 이메일 인증코드 확인 | `POST /auth/email/confirm` | ✅ 완료 |
| LoginScreen | 카카오 소셜 로그인 | `POST /auth/login/social` | ✅ 완료 |
| LoginScreen | 비밀번호 재설정 코드 발송 | `POST /auth/password/reset/code` | ✅ 완료 |
| LoginScreen | 비밀번호 재설정 | `POST /auth/password/reset` | ✅ 완료 |

### 카카오 소셜 로그인 상세

`@react-native-seoul/kakao-login`(iOS/Android 네이티브 SDK)로 카카오톡 앱 로그인 → 액세스 토큰 획득 → `authApi.loginWithKakao(accessToken)`으로 백엔드 전달. 백엔드가 카카오 서버에서 프로필 조회 후 자체 JWT 발급.

- Request: `{ "accessToken": "카카오 액세스 토큰" }`
- 카카오 개발자 콘솔에서 닉네임/프로필사진/카카오계정(이메일) 동의항목이 꺼져있으면 백엔드가 폴백값(`kakao_{providerId}`, `{providerId}@kakao.local`)을 채워 넣음 — 실제 값 받으려면 동의항목 설정 + (이메일은) 비즈 앱 전환 필요
- 알려진 이슈: 기존 유저가 재로그인해도 이메일이 최신 카카오 값으로 갱신 안 됨 (`User.updateSocialProfile`이 email 미포함) — 아래 "백엔드 협의 필요 사항" 참고

### 비밀번호 재설정 상세

LoginScreen "비밀번호를 잊으셨나요?" 바텀시트 3단계: 이메일 입력 → 인증코드 입력 → 새 비밀번호 입력. 이메일 인증코드 발송과 달리 별도 "코드 확인" API가 없어서, 코드 검증은 최종 `POST /auth/password/reset` 호출 시점에 함께 이루어짐 (틀리면 에러 응답으로 반환).

### 관심 테마 상세

`src/constants/themes.ts`의 `THEME_CATEGORY_MAP`으로 한글 라벨 ↔ 백엔드 `SpotCategory` enum 매핑. 백엔드 enum 15개 중 10개만 프론트에 노출:

```
야경→NIGHT_VIEW, 바다→BEACH, 한옥→HANOK, 꽃→FLOWER, 카페→CAFE,
인물→PORTRAIT, 축제→FESTIVAL, 반려동물→PET, 일출/일몰→SUNRISE_SUNSET, 은하수→MILKY_WAY
```

미노출 5개: `PARK`(공원), `MOUNTAIN`(산), `CITY`(도시), `FOREST`(숲), `ETC`(기타) — 의도적으로 뺀 것인지 기획 확인 필요. 기존 프론트 옵션 중 `커플/드론/비오는날/필름`은 백엔드 enum에 대응값이 없어 제거함.

가입 시(`SignUpRequest.spotCategories`)만 연동돼 있고, 가입 후 수정용 `PATCH /users/me/spot-categories`는 아직 프론트에서 미사용 (마이페이지 화면 미구현).

---

## 미연동 (API 있음)

| 기능 | 엔드포인트 | 사유 |
|---|---|---|
| 닉네임 중복 확인 | `GET /auth/nickname/check` | 가입 버튼 클릭 시 자동 체크할지 별도 버튼으로 뺄지 미결정 |
| 관심테마 수정 | `PATCH /users/me/spot-categories` | 마이페이지 화면 미구현 |
| 내 정보 조회 | `GET /users/me` | 로그인 응답에 이미 `user` 포함돼 있어 당장 불필요. 앱 재시작 시 토큰 유효성 검증/최신화 용도로 추후 사용 예정 |

---

## UI만 있고 API 없는 항목

| 항목 | 처리 내용 |
|---|---|
| Apple 로그인 | 카카오 우선 진행으로 보류 — LoginScreen에서 버튼 JSX 주석 처리 (제거 아님, 재개 시 주석 해제). HTML 퍼블리싱 파일은 유지 |

---

## 백엔드 협의 필요 사항

### 해결됨

- ~~에러 응답 구조가 500으로 뭉개지는 문제~~ → `CustomException` + `AuthErrorCode` + `GlobalExceptionHandler`로 해결 확인 (`feature/login-v2`, `login-v3`)

### 이후

- **기존 유저 이메일 미갱신**: `UserService.getOrCreateSocialUser()`가 기존 유저는 `updateSocialProfile(nickname, profileImageUrl)`만 호출하고 email은 갱신 안 함. 카카오 이메일이 바뀌어도 최초 가입 시점 값(또는 폴백값)이 계속 유지됨 — 의도된 정책인지 확인 필요
- **토큰 만료 처리**: refresh token 없이 access token 1시간 만료 후 앱 동작 방침 합의
- **닉네임 글자 수**: 백엔드 `@Size(max = 50)`, 프론트 최대 10자 — 기준 통일 필요
- **관심테마 옵션 범위**: 백엔드 `SpotCategory` 15개 중 프론트가 10개만 노출 — 나머지 5개(`PARK/MOUNTAIN/CITY/FOREST/ETC`) 노출 여부 기획 확인

---

## 구현 파일

| 파일 | 변경 내용 |
|---|---|
| `src/api/auth.ts` | API 함수 9개 + TS 타입 (`TokenResponse`, `UserResponse`(spotCategories 포함), `EmailVerificationResponse`), 204 응답 처리 |
| `src/store/useAuthStore.ts` | `accessToken`, `user`, `setAuth`, `clearAuth`, `expo-secure-store`(Keychain/Keystore) persist |
| `src/constants/themes.ts` | `THEME_CATEGORY_MAP` — 한글 라벨 ↔ `SpotCategory` enum 매핑 |
| `src/screens/auth/LoginScreen.tsx` | login/카카오 로그인/비밀번호 재설정(3단계) API 연결, Apple 버튼 주석 처리 |
| `src/screens/auth/SignupScreen.tsx` | register API 연결(관심테마 포함), 이메일 인증 플로우, 닉네임 10자 제한 |
| `src/screens/auth/OnboardingScreen.tsx` | 닉네임 제한 10자로 통일, Apple 온보딩 가짜 세션 생성 로직 제거(미지원 안내로 대체) |

---

> **마이그레이션 주의사항**: `AsyncStorage` → `expo-secure-store`로 저장소를 교체하면서 저장 키(`auth-storage`)는 그대로 유지했습니다. `SecureStore`는 `AsyncStorage`와 물리적으로 다른 저장소라 기존에 로그인해있던 사용자는 앱 업데이트 후 **자동으로 로그아웃**됩니다 (에러 없이 조용히 로그인 화면으로 이동). 배포 노트에 언급 필요.

---

## 로컬 테스트 환경

```dotenv
# .env
EXPO_PUBLIC_API_URL=http://localhost:8080        # iOS 시뮬레이터
# EXPO_PUBLIC_API_URL=http://10.0.2.2:8080       # Android 에뮬레이터
```

백엔드 CORS: `http://localhost:*` 허용 (`SecurityConfig.java` 수정 완료)

카카오 로그인은 Expo Go로 테스트 불가 (커스텀 네이티브 모듈 미지원) — `pnpm ios` / `pnpm android`로 빌드한 커스텀 dev build 필요.
