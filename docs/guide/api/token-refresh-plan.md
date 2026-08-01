# 리프레시 토큰 도입 시 프론트 작업

**상태**: 백엔드 미구현 (담당자 별도 진행 예정) · 프론트는 임시 대응만 되어 있음

액세스 토큰은 **1시간** 만료이고 리프레시 토큰이 없습니다. 재발급 수단이 없으므로 현재 프론트는 **만료 = 즉시 로그아웃**으로 처리합니다. 백엔드에 재발급이 붙으면 이 문서의 작업 목록대로 교체하면 됩니다.

관련 협의 항목: [`auth-integration.md`](./auth-integration.md) → "백엔드 협의 필요 사항 › 이후 › 토큰 만료 처리"

---

## 지금 어떻게 동작하나

### 만료 감지 경로 2개

| 시점 | 처리 | 위치 |
|---|---|---|
| **앱 콜드 스타트** | SecureStore에서 복원한 토큰으로 `/users/me`를 한 번 호출해 살아 있는지 확인, 실패하면 `clearAuth()` | `src/store/useAuthStore.ts` `onRehydrateStorage` |
| **앱 사용 중 401** | 어떤 API에서 401이 나든 등록된 핸들러가 `clearAuth()` | `src/api/auth.ts` `toHttpError` → `src/store/useAuthStore.ts` `setUnauthorizedHandler` |

두 번째 경로가 없던 시절에는 앱을 켜 둔 채 1시간이 지나면 죽은 토큰을 계속 들고 있었습니다. 재시도해도 401만 반복되고 앱을 강제 종료해야만 풀렸습니다.

### 401 핸들러가 붙은 구조

`toHttpError`가 유일한 공통 실패 지점이라 여기에 걸었습니다. 실제로 HTTP 에러를 던지는 5개 모듈(`auth`·`spot`·`courses`·`notification`·`wishlist`)이 전부 이 함수를 거칩니다.

스토어를 `api/auth.ts`에서 직접 import하면 `useAuthStore → api/auth` 방향과 맞물려 **순환 참조**가 됩니다. 그래서 `setUnauthorizedHandler()`로 등록을 스토어 쪽에서 하도록 방향을 뒤집었습니다. 등록 전에 401이 나면 아무 일도 일어나지 않지만(기존 동작 유지), 스토어 모듈은 `App.tsx → @/navigation → useAuthStore`로 앱 시작에 항상 평가되므로 실제로는 닿지 않는 경로입니다.

### 핸들러가 토큰을 인자로 받는 이유

핸들러 인자는 **그 401을 유발한 요청이 실제로 보낸 토큰**입니다. 이게 없으면 "지금 스토어에 든 토큰"과 구별할 수 없어, 뒤늦게 도착한 옛 요청의 401이 방금 만든 새 세션을 끊어 버립니다.

```text
토큰 만료 → 요청 A가 401 → 강제 로그아웃 → 사용자가 다시 로그인 성공
  → 로그아웃 전에 이미 떠 있던 요청 B가 뒤늦게 401로 종료 → 또 로그아웃
```

사진 업로드는 타임아웃이 180초(`src/api/spot.ts` `UPLOAD_TIMEOUT_MS`)라 이 창이 실제로 넓습니다. 그래서 핸들러는 `requestToken`이 현재 토큰과 다르면 무시합니다.

토큰을 모르는 호출부(로그인·회원가입 등 `api/auth.ts`의 `post`)는 인자를 생략할 수 있고, 그때는 핸들러가 "스토어에 토큰이 있는가"만 보고 판단합니다. 이 가드가 **로그인 실패의 401**이 로그아웃을 유발하는 경로도 함께 막습니다.

헤더를 `options`로 받는 래퍼(`notification`·`wishlist`)는 `tokenFromHeaders()`로 `Authorization` 헤더에서 토큰을 꺼내 넘깁니다.

### 403을 제외한 이유

`403`은 남의 리뷰를 수정하려는 경우처럼 **토큰이 멀쩡해도** 발생하는 정상 거절입니다. 로그아웃시킬 일이 아닙니다. `401`만 처리합니다.

### 로그아웃이 곧 화면 이동인 점

`RootNavigator`가 `accessToken` 유무로 트리 전체를 갈아끼우므로(`src/navigation/index.tsx`), `clearAuth()` 호출은 **곧바로 로그인 화면으로 튕기는 것**과 같습니다.

리뷰 작성처럼 입력 중이던 화면은 언마운트되고 초안이 사라집니다. `usePreventRemove`의 이탈 확인창도 뜨지 않습니다(네비게이터 자체가 사라지므로). 다만 만료된 세션으로는 어차피 제출이 불가능해 초안을 지켜도 쓸 데가 없고, 예전에도 401 무한 반복 끝에 강제 종료하며 초안을 똑같이 잃었으므로 결과는 같고 원인만 분명해진 셈입니다.

### 안내 문구를 핸들러에서 띄우는 이유

만료를 알리는 Alert은 각 화면에 있지만 **mutation에만** 붙어 있습니다. 만료는 보통 백그라운드 리페치(query)에서 먼저 드러나고 그쪽 에러는 아무도 렌더하지 않아, 안내 없이 로그인 화면으로 튕기게 됩니다. 그래서 핸들러가 직접 한 번 알립니다. 위의 "스토어에 토큰이 있는가" 가드 덕분에 동시 401이 여러 개여도 Alert은 한 번만 뜹니다.

---

## 리프레시 토큰이 생기면 할 일

### 1. 백엔드에 먼저 필요한 것

- 재발급 엔드포인트 (`POST /auth/reissue` 류)
- 로그인·회원가입 응답 `TokenResponse`에 `refreshToken` 필드 추가
- 리프레시 토큰 만료 기간, 회전(rotation) 여부, 재사용 감지 정책

### 2. 저장소

`src/store/useAuthStore.ts`의 `partialize`가 지금은 `accessToken`만 저장합니다. SecureStore는 키당 용량 제한(Android 약 2048바이트)이 있어 `user`를 일부러 뺐습니다. `refreshToken`을 추가할 때 **JWT 2개가 그 한도에 들어가는지 확인**해야 합니다. 넘치면 키를 분리해야 합니다.

### 3. 401 핸들러 교체

`src/store/useAuthStore.ts`의 `setUnauthorizedHandler(...)` 콜백을 이렇게 바꿉니다:

```text
현재: 401 → clearAuth()
변경: 401 → 재발급 시도 → 성공하면 setAuth()로 갱신, 실패했을 때만 clearAuth()
```

이때 반드시 처리해야 할 것들:

- **동시 401 합치기** — 여러 요청이 동시에 401을 받으면 재발급이 그 수만큼 나갑니다. 진행 중인 재발급 Promise를 하나 들고 있다가 공유해야 합니다.
- **원 요청 재시도** — 재발급 성공 후 401 난 요청을 새 토큰으로 다시 보낼지 결정해야 합니다. 지금 구조(`toHttpError`는 응답만 받고 요청 정보를 모름)로는 불가능하므로, 재시도가 필요하면 각 `fetch` 래퍼에 재시도 루프를 넣어야 합니다.
- **재발급 요청 자체의 401** — 무한 루프를 막기 위해 재발급 호출은 이 핸들러를 타지 않아야 합니다.
- **`requestToken` 비교 유지** — 재발급으로 토큰이 바뀌면 옛 토큰으로 낸 요청의 401이 계속 들어옵니다. 지금의 "다르면 무시" 가드가 그때 더 중요해집니다.

### 4. 캐시 키 재검토

`src/hooks/useSpot.ts`의 `useSpotDetail`·`useMapSpots`·`useSpots`·`useSearchSpots`가 queryKey에 `token ?? 'guest'`를 넣습니다. 토큰이 재발급될 때마다 **키가 바뀌어 캐시 전체가 미스**가 됩니다.

토큰 문자열 대신 `useAuthStore().user?.id`로 바꾸면 재발급과 무관하게 같은 캐시를 씁니다. (부수 효과로 raw JWT가 React Query Devtools·로그에 노출되는 것도 사라집니다.)

### 5. 사전 만료 판정 (선택)

로그인 응답의 `TokenResponse.expiresIn`(현재 3600)이 어디서도 쓰이지 않습니다. 만료 시각을 저장해 두고 요청 전에 미리 재발급하면 401 왕복을 줄일 수 있습니다. 401 처리가 있으면 결과는 같으므로 필수는 아닙니다.

---

## 함께 처리하면 좋은 것 (별건)

로그아웃 시 `queryClient.clear()`를 호출하는 곳이 없습니다(`App.tsx`가 빈 `QueryClient`를 생성). 토큰이 키에 없는 캐시 — `['spot', id, 'reviews']`, `['users','me','reviews']`, `['bookmark-collections', id]`, `['spot', id, 'checklist']` — 가 계정 전환 후에도 남습니다.

자동 로그아웃이 생기면서 계정 전환이 잦아졌으므로 이전보다 밟기 쉬워졌습니다. 별도 티켓 권장.

---

## 관련 파일

| 파일 | 역할 |
|---|---|
| `src/api/auth.ts` | `toHttpError`(401 감지), `setUnauthorizedHandler`(등록), `tokenFromHeaders` |
| `src/store/useAuthStore.ts` | 토큰 저장(SecureStore), `onRehydrateStorage` 검증, 401 핸들러 구현 |
| `src/navigation/index.tsx` | `accessToken` 유무로 트리 분기 — 로그아웃이 곧 화면 이동인 이유 |
| `src/api/{spot,courses,notification,wishlist}.ts` | `toHttpError` 호출부 (요청 토큰 전달) |
