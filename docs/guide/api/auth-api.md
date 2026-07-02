# 인증 API 정리

베이스 URL: `http://localhost:8080`  
인증이 필요한 요청은 헤더에 `Authorization: Bearer {accessToken}` 추가.

---

## 1. 회원가입 — `POST /auth/register`

**이메일 인증 완료 후** 호출해야 함. 미인증 이메일이면 400 에러.

### Request Body
```json
{
  "email": "user@example.com",
  "password": "password123",   // 8~64자
  "nickname": "예은"           // 최대 50자
}
```

### Response `201 Created`
```json
{
  "tokenType": "Bearer",
  "accessToken": "eyJhbGci...",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "예은",
    "profileImageUrl": null,
    "role": "USER",
    "provider": "LOCAL"
  }
}
```

---

## 2. 일반 로그인 — `POST /auth/login`

### Request Body
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response `200 OK`
> 회원가입 응답과 동일한 구조 (`TokenResponse`)

---

## 3. 카카오 로그인 — `POST /auth/login/social`

프론트(네이티브 SDK `@react-native-seoul/kakao-login`)가 카카오톡 앱으로 로그인해 받은 카카오 액세스 토큰을 백엔드로 전달. 백엔드가 해당 토큰으로 카카오 서버 검증 + 유저 생성/조회까지 처리.

### Request Body
```json
{
  "accessToken": "카카오 액세스 토큰"
}
```

### Response `200 OK`
> 회원가입 응답과 동일한 구조 (`TokenResponse`)

---

## 4. 이메일 인증 코드 발송 — `POST /auth/email/verify`

회원가입 전에 먼저 호출. 이미 가입된 이메일이면 400 에러.  
코드 유효시간: **5분(300초)**

### Request Body
```json
{
  "email": "user@example.com"
}
```

### Response `200 OK`
```json
{
  "email": "user@example.com",
  "verified": false,
  "expiresIn": 300,
  "verificationCode": null   // 항상 null. 코드는 이메일로만 발송됨
}
```

---

## 5. 이메일 인증 코드 확인 — `POST /auth/email/confirm`

### Request Body
```json
{
  "email": "user@example.com",
  "code": "123456"   // 6자리 숫자
}
```

### Response `200 OK`
```json
{
  "email": "user@example.com",
  "verified": true,
  "expiresIn": null,
  "verificationCode": null
}
```

### 에러 케이스
| 상황 | 에러 메시지 |
|------|------------|
| 코드 만료 또는 미발송 | `인증 코드가 만료되었거나 존재하지 않습니다.` |
| 코드 불일치 | `인증 코드가 일치하지 않습니다.` |

---

## 6. 닉네임 중복 확인 — `GET /auth/nickname/check?value={nickname}`

### Response `200 OK`
```json
{
  "nickname": "예은",
  "available": true   // true: 사용 가능, false: 중복
}
```

---

## 공통 에러 응답 구조

```json
{
  "code": "INVALID_INPUT_VALUE",
  "message": "에러 메시지"
}
```

Validation 실패(빈 값, 이메일 형식 오류 등)는 `400 Bad Request`.

---

## 회원가입 플로우 요약

```
1. GET  /auth/nickname/check?value=xxx   → 닉네임 중복 확인
2. POST /auth/email/verify               → 인증 코드 발송
3. POST /auth/email/confirm              → 코드 확인 (verified: true 확인)
4. POST /auth/register                   → 회원가입 → accessToken 저장
```

## TokenResponse 타입 (프론트용)

```typescript
type Role = 'USER' | 'ADMIN';
type SocialProvider = 'LOCAL' | 'KAKAO';

interface UserResponse {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  role: Role;
  provider: SocialProvider;
}

interface TokenResponse {
  tokenType: 'Bearer';
  accessToken: string;
  expiresIn: number;        // 초 단위
  user: UserResponse;
}
```
