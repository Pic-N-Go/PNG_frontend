# 프론트엔드 개발 가이드

> 퍼블리싱 완료 후 React Native 화면 구현 시 팀원이 참고하는 문서입니다.  
> HTML 목업(`src/components/ui/`)을 기준으로 구현하며, 팀 AI 협업은 `docs/ai-prompt-guide.md`를 기준으로 진행하세요.

---

## 폴더 구조

```
src/
├── api/                        # REST API 호출 함수
│   ├── client.ts               # axios 인스턴스 (baseURL, 토큰, 인터셉터) — TODO: 미생성
│   ├── auth/
│   │   ├── auth.api.ts         # login, signup, logout, tokenRefresh
│   │   └── auth.types.ts       # LoginRequest, LoginResponse...
│   ├── spot/
│   │   ├── spot.api.ts         # getSpots, getSpotDetail, registerSpot
│   │   └── spot.types.ts       # Spot, SpotDetail, SpotFilter...
│   ├── review/
│   │   ├── review.api.ts       # getReviews, createReview, deleteReview
│   │   └── review.types.ts     # Review, CreateReviewRequest...
│   ├── user/
│   │   ├── user.api.ts         # getProfile, updateProfile, follow, unfollow
│   │   └── user.types.ts       # User, ProfileUpdateRequest...
│   ├── travel/
│   │   ├── travel.api.ts       # getTravels, createTravel, addSpotToTravel
│   │   └── travel.types.ts     # Travel, TravelSpot...
│   ├── community/
│   │   ├── community.api.ts    # getPosts, createPost, likePost
│   │   └── community.types.ts  # Post, Comment...
│   └── wishlist/
│       ├── wishlist.api.ts     # getWishlists, createWishlist, addSpot
│       └── wishlist.types.ts   # Wishlist, WishlistSpot...
│
├── components/                 # 재사용 가능한 React Native 컴포넌트
│   ├── ScreenContainer.tsx     # 모든 화면 루트 래퍼 — Safe Area 처리
│   ├── common/                 # 전역 공통 (Button, Input, Card, Toast...)
│   ├── spot/                   # 스팟 관련 컴포넌트
│   ├── home/                   # 홈 관련 컴포넌트
│   └── ui/                     # HTML 목업 (퍼블리싱 전용 — RN 구현 시 읽기 전용 참조)
│       ├── fonts.css           # Pretendard Variable 폰트 (공통)
│       ├── common.css          # 디자인 토큰·리셋·phone-frame 기본 (공통)
│
├── constants/
│   └── layout.ts               # 기기 스케일링 레이아웃 상수
│
├── hooks/                      # TanStack Query 커스텀 훅
│   ├── useSpots.ts
│   ├── useAuth.ts
│   └── ...
│
├── navigation/                 # 네비게이션 설정
│   ├── RootNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── TabNavigator.tsx
│
├── screens/                    # 화면 단위 컴포넌트 (목업 구조와 동일)
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   └── OAuthOnboardingScreen.tsx
│   ├── home/
│   │   ├── HomeScreen.tsx
│   │   └── MapScreen.tsx
│   ├── travel/
│   │   ├── TravelListScreen.tsx
│   │   ├── TravelPlanScreen.tsx
│   │   └── TravelNewScreen.tsx
│   ├── community/
│   │   └── CommunityFeedScreen.tsx
│   ├── spot/
│   │   ├── SpotDetailScreen.tsx
│   │   ├── SpotRegisterScreen.tsx
│   │   ├── SpotListScreen.tsx
│   │   └── ReviewWriteScreen.tsx
│   ├── mypage/
│   │   ├── MypageScreen.tsx
│   │   ├── MyPhotosScreen.tsx
│   │   ├── PhotoMapScreen.tsx
│   │   ├── ProfileEditScreen.tsx
│   │   ├── SettingScreen.tsx
│   │   └── NotificationScreen.tsx
│   └── wishlist/
│       ├── WishlistScreen.tsx
│       └── WishlistSettingScreen.tsx
│
├── store/                      # Zustand 클라이언트 상태
│   ├── useAuthStore.ts         # JWT 토큰, 유저 정보
│   └── ...
│
├── types/                      # 공통 TypeScript 타입
│   ├── spot.ts
│   ├── user.ts
│   └── ...
│
└── utils/
    └── normalize.ts            # 기기 너비 스케일링 유틸
```

---

## 개발 규칙

### 스타일링

- **NativeWind `className`만 사용** — `StyleSheet.create()` 사용 금지
- Tailwind 단위(`px-7` 등)는 고정 픽셀. 기기별 스케일링이 필요한 값(버튼 높이, 폰트 크기)은 `src/constants/layout.ts` 상수 사용

```tsx
// ✅ 올바른 사용
<TouchableOpacity
  className="w-full items-center justify-center bg-[#E31B59] rounded-full"
  style={{ height: BUTTON_HEIGHT }}
>
  <Text style={{ fontSize: FONT_LG }} className="text-white font-medium">
    로그인
  </Text>
</TouchableOpacity>

// ❌ 사용 금지
const styles = StyleSheet.create({ button: { height: 52 } });
```

### import 경로

`@/` alias를 항상 사용합니다.

```ts
// ✅
import { useAuthStore } from "@/store/useAuthStore";
import { BUTTON_HEIGHT } from "@/constants/layout";

// ❌
import { useAuthStore } from "../../store/useAuthStore";
```

### API 레이어

- `*.api.ts` — 순수 fetch 함수만 작성 (훅, 상태 포함 금지)
- `*.types.ts` — 해당 도메인의 Request / Response 타입 정의
- `src/hooks/` — TanStack Query로 api 함수를 감싼 커스텀 훅

```ts
// src/api/spot/spot.api.ts
import { client } from "@/api/client";
import { Spot, SpotFilter } from "./spot.types";

export const getSpots = async (filter: SpotFilter): Promise<Spot[]> => {
  const { data } = await client.get("/spots", { params: filter });
  return data;
};

// src/hooks/useSpots.ts
import { useQuery } from "@tanstack/react-query";
import { getSpots } from "@/api/spot/spot.api";

export const useSpots = (filter: SpotFilter) =>
  useQuery({
    queryKey: ["spots", filter],
    queryFn: () => getSpots(filter),
  });
```

### 인증 (JWT)

JWT 토큰은 Zustand store에서 관리하고, `client.ts` 인터셉터에서 자동으로 헤더에 추가합니다.

```ts
// src/api/client.ts
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

export const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Safe Area (기기 모서리)

모든 화면은 `ScreenContainer`를 최상위 래퍼로 사용합니다.  
iOS Dynamic Island / 노치, Android 상태바, 하단 홈 인디케이터를 자동으로 처리합니다.

```tsx
import { ScreenContainer } from "@/components/ScreenContainer";

// 일반 화면
export function SettingScreen() {
  return (
    <ScreenContainer>
      {/* 콘텐츠 */}
    </ScreenContainer>
  );
}

// 히어로 이미지가 상단까지 꽉 차는 화면 (home, spot-detail 등)
// top을 제외해야 이미지가 Dynamic Island 뒤까지 자연스럽게 이어집니다.
export function HomeScreen() {
  return (
    <ScreenContainer edges={['left', 'right', 'bottom']}>
      {/* 콘텐츠 */}
    </ScreenContainer>
  );
}
```

### 화면 구현 순서

HTML 목업 파일을 보면서 아래 순서로 구현합니다.

1. `src/components/ui/[화면명].html` 열기
2. 레이아웃 구조 파악 → `src/screens/[도메인]/[화면명]Screen.tsx` 생성
3. `ScreenContainer`를 루트 래퍼로 적용 (히어로 화면은 `edges` 조정)
4. NativeWind className으로 스타일 적용
5. 고정 수치는 `src/constants/layout.ts` 상수 사용
6. API 연동 필요 시 `src/api/[도메인]/` 함수 작성 후 `src/hooks/` 훅으로 감싸기

---

## 환경 변수

### `.env` vs `.env.example`

| 파일 | git 포함 | 용도 |
|------|----------|------|
| `.env.example` | ✅ 포함 | 필요한 변수 목록만 명시 (값 없음) — 템플릿 역할 |
| `.env` | ❌ 제외 (`.gitignore`) | 실제 API 키·비밀값 — 절대 커밋 금지 |

### 초기 세팅

```bash
cp .env.example .env
# .env 파일을 열고 노션 공유 문서의 실제 값으로 채우기
```

실제 값은 **노션 팀 채널**에서 공유합니다. 각자 복붙해서 사용하세요.

### 변수 규칙

`EXPO_PUBLIC_` 접두사가 붙은 변수만 클라이언트 코드에 노출됩니다.  
API 키 등 서버 전용 값은 접두사 없이 선언하면 앱 번들에 포함되지 않습니다.

```ts
// ✅ 클라이언트에서 접근 가능
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

// ❌ 클라이언트에서 undefined — 서버 전용
const secret = process.env.SECRET_KEY;
```

### 변수 추가 시 프로세스

1. `.env.example`에 새 변수 추가 (값은 비워두기) → git 커밋
2. 노션 공유 문서에 실제 값 업데이트
3. 팀 채널에 공유 ("`.env`에 `EXPO_PUBLIC_OOO` 추가됐습니다, 노션 확인해주세요")

---

## 참고 문서

| 문서 | 내용 |
|---|---|
| `docs/ai-prompt-guide.md` | 팀 공용 AI 하네스(스펙/계획/리뷰 체크리스트) |
| `docs/style-consistency-fixes.md` | 퍼블리싱 스타일 통일성 수정 목록 |
| `docs/ui-publishing.md` | HTML 목업 구조 및 화면 간 네비게이션 흐름 |
| `docs/ai-prompt-guide.md` | AI 활용 화면 구현 프롬프트 템플릿 |
| `docs/device-support.md` | 지원 기기 범위, 레이아웃 상수 사용법 |
| `docs/photo-upload-spec.md` | 사진 업로드 스펙 (TODO: 미작성) |
| `CLAUDE.md` | 프로젝트 전체 규칙 및 디자인 시스템 |
| `.github/CONVENTIONS.md` | 브랜치/PR/라벨 컨벤션 |
| `docs/github-actions-guide.md` | GitHub Actions 자동화 동작 및 대응 |
