# 프론트엔드 개발 가이드

> 퍼블리싱 완료 후 React Native 화면 구현 시 팀원이 참고하는 문서입니다.  
> HTML 목업(`src/components/ui/`)을 기준으로 구현하며, 팀 AI 협업은 `docs/ai/README.md`를 기준으로 진행하세요.

---

## 폴더 구조

```
src/
├── api/                        # REST API 호출 함수
│   ├── client.ts               # axios 인스턴스 (baseURL, 토큰, 인터셉터)
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
│   ├── common/                 # 전역 공통 (Button, Input, Card, Toast...)
│   ├── spot/                   # 스팟 관련 컴포넌트
│   ├── home/                   # 홈 관련 컴포넌트
│   └── ui/                     # HTML 목업 (퍼블리싱 전용, 수정 금지)
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

### 화면 구현 순서

HTML 목업 파일을 보면서 아래 순서로 구현합니다.

1. `src/components/ui/[화면명].html` 열기
2. 레이아웃 구조 파악 → `src/screens/[도메인]/[화면명]Screen.tsx` 생성
3. NativeWind className으로 스타일 적용
4. 고정 수치는 `src/constants/layout.ts` 상수 사용
5. API 연동 필요 시 `src/api/[도메인]/` 함수 작성 후 `src/hooks/` 훅으로 감싸기

---

## 환경 변수

`.env.example`을 복사해서 `.env` 생성 후 API URL을 설정합니다.

```
EXPO_PUBLIC_API_URL=https://api.example.com
```

---

## 참고 문서

| 문서 | 내용 |
|---|---|
| `docs/ai/README.md` | 팀 공용 AI 하네스(스펙/계획/리뷰 체크리스트) |
| `docs/ui-publishing.md` | HTML 목업 구조 및 화면 간 네비게이션 흐름 |
| `docs/ai-prompt-guide.md` | AI 활용 화면 구현 프롬프트 템플릿 |
| `docs/device-support.md` | 지원 기기 범위, 레이아웃 상수 사용법 |
| `docs/photo-upload-spec.md` | 사진 업로드 스펙 |
| `CLAUDE.md` | 프로젝트 전체 규칙 및 디자인 시스템 |
| `.github/CONVENTIONS.md` | 브랜치/PR/라벨 컨벤션 |
| `docs/github-actions-guide.md` | GitHub Actions 자동화 동작 및 대응 |
