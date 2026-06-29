# Auth API 연동 현황

> 브랜치: `feature/auth-login-signup-api`
> 작업 기준일: 2026-06-22

---

## 연동 완료

| 화면 | 기능 | 엔드포인트 | 상태 |
|---|---|---|---|
| LoginScreen | 이메일 로그인 | `POST /auth/login` | ✅ 완료 |
| SignupScreen | 회원가입 | `POST /auth/register` | ✅ 완료 |
| SignupScreen | 이메일 인증코드 발송 | `POST /auth/email/verify` | ✅ 완료 |
| SignupScreen | 이메일 인증코드 확인 | `POST /auth/email/confirm` | ✅ 완료 |

---

## 미연동 (API 있음)

| 기능 | 엔드포인트 | 사유 |
|---|---|---|
| 닉네임 중복 확인 | `GET /auth/nickname/check` | 가입 버튼 클릭 시 자동 체크할지 별도 버튼으로 뺄지 미결정 |
| 카카오 소셜 로그인 | `POST /auth/login/social` | OAuth 플로우 별도 작업 범위 (아래 참고) |

---

## UI만 있고 API 없는 항목

| 항목 | 처리 내용 |
|---|---|
| Apple 로그인 | LoginScreen에서 버튼 제거. HTML 퍼블리싱 파일은 유지 |
| 비밀번호 찾기 | 백엔드 비밀번호 재설정 엔드포인트 없음. UI만 유지 (바텀시트 동작은 하되 API 미연결) |

---

## 카카오 소셜 로그인 구현 전 필요 사항

카카오 OAuth 플로우는 아래 조건이 충족되면 별도로 진행.

1. **카카오 개발자 콘솔** — 모바일 redirect URI 등록 필요
   - 현재 백엔드 `KAKAO_REDIRECT_URI`: `http://localhost:5173/oauth/kakao/callback` (웹용)
   - 앱용 커스텀 scheme 결정 필요 (예: `picngo://oauth/kakao/callback`)

2. **백엔드 `.env` 수정** — 모바일용 redirect URI로 변경

3. **프론트 패키지 설치** — `expo-web-browser`, `expo-linking`

4. **`app.json` scheme 추가** — 딥링크 수신용 커스텀 scheme 등록

---

## 백엔드 협의 필요 사항

### 긴급 (현재 테스트 블로커)

- **에러 응답 구조**: `AuthService`의 `IllegalArgumentException` / `IllegalStateException`이 `GlobalExceptionHandler`의 제네릭 핸들러에 걸려 무조건 `500 INTERNAL_SERVER_ERROR`로 반환됨. 실제 에러 메시지("이메일 또는 비밀번호가 올바르지 않습니다." 등)가 프론트로 전달되지 않음.
  - 해결 방법: Auth 관련 에러를 `CustomException` + 전용 에러코드로 교체

### 이후

- **토큰 만료 처리**: refresh token 없이 access token 1시간 만료 후 앱 동작 방침 합의
- **닉네임 글자 수**: 백엔드 `@Size(max = 50)`, 프론트 최대 10자 — 기준 통일 필요

---

## 구현 파일

| 파일 | 변경 내용 |
|---|---|
| `src/api/auth.ts` | API 함수 6개 + TS 타입 (`TokenResponse`, `UserResponse`, `EmailVerificationResponse`) |
| `src/store/useAuthStore.ts` | `accessToken`, `user`, `setAuth`, `clearAuth` 추가 |
| `src/screens/auth/LoginScreen.tsx` | login API 연결, Apple 버튼 제거, 빈 필드 가드 |
| `src/screens/auth/SignupScreen.tsx` | register API 연결, 이메일 인증 플로우, 닉네임 10자 제한 |
| `src/screens/auth/OnboardingScreen.tsx` | 닉네임 제한 10자로 통일 |

---

## 로컬 테스트 환경

```dotenv
# .env
EXPO_PUBLIC_API_URL=http://localhost:8080        # iOS 시뮬레이터
# EXPO_PUBLIC_API_URL=http://10.0.2.2:8080       # Android 에뮬레이터
```

백엔드 CORS: `http://localhost:*` 허용 (`SecurityConfig.java` 수정 완료)
