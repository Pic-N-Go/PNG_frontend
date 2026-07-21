# 프론트엔드 개발 가이드

> 퍼블리싱 완료 후 React Native 화면 구현 시 팀원이 참고하는 문서입니다.  
> HTML 목업(`src/components/ui/`)을 기준으로 구현하며, 팀 AI 협업은 `docs/guide/dev/prompt-writing-guide.md`를 기준으로 진행하세요.

---

## 폴더 구조

```
src/
├── api/                        # REST API 호출 함수
│   ├── client.ts               # axios 인스턴스 (baseURL, 토큰, 인터셉터) — TODO: 미생성
│   ├── auth.ts                 # login, signup, logout, tokenRefresh
│   ├── spot.ts                 # getSpots, getSpotDetail, registerSpot
│   ├── community.ts            # getPosts, createPost, likePost
│   ├── travel.ts               # getTravels, createTravel, addSpotToTravel
│   ├── mypage.ts               # getProfile, updateProfile
│   ├── search.ts               # search, getSearchHistory
│   ├── notification.ts         # getNotifications, markRead
│   └── wishlist.ts             # getWishlists, createWishlist, addSpot
│
├── components/                 # 재사용 가능한 React Native 컴포넌트
│   ├── ScreenContainer.tsx     # 모든 화면 루트 래퍼 — Safe Area 처리
│   ├── common/                 # 전역 공통 (Button, Input, Card, Toast...)
│   ├── spot/                   # 스팟 관련 컴포넌트
│   ├── community/              # 커뮤니티 관련 컴포넌트
│   ├── travel/                 # 여행 관련 컴포넌트
│   └── ui/                     # HTML 목업 (퍼블리싱 전용 — RN 구현 시 읽기 전용 참조)
│       └── common/
│           ├── fonts.css       # Pretendard Variable 폰트 (공통)
│           ├── common.css      # 디자인 토큰·리셋·phone-frame 기본 (공통)
│           └── icons.js        # Tabler Icons SVG 스프라이트
│
├── constants/
│   └── layout.ts               # 기기 스케일링 레이아웃 상수
│
├── hooks/                      # TanStack Query 커스텀 훅
│   ├── useAuth.ts
│   ├── useSpot.ts
│   ├── useCommunity.ts
│   ├── useTravel.ts
│   ├── useMypage.ts
│   ├── useSearch.ts
│   └── useNotification.ts
│
├── navigation/                 # 네비게이션 설정
│   ├── index.tsx               # RootNavigator — 로그인 여부로 AuthStack / MainTab 분기
│   ├── AuthStack.tsx           # 인증 스택 (Splash, Login, Signup, Onboarding)
│   ├── MainTab.tsx             # 메인 탭 (홈·여행·커뮤니티·마이)
│   └── stacks/
│       ├── HomeStack.tsx       # Home, Map
│       ├── SpotStack.tsx       # SpotDetail, ReviewWrite, PhotoDetail
│       ├── TravelStack.tsx     # TravelList, TravelPlan, TravelNew, Wishlist, WishlistSetting
│       ├── CommunityStack.tsx  # CommunityFeed, CommunityWrite, Contest
│       └── MyPageStack.tsx     # MyPage, UserProfile, Setting, Notification
│
├── screens/                    # 화면 단위 컴포넌트
│   ├── auth/
│   │   ├── SplashScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   └── OnboardingScreen.tsx
│   ├── home/
│   │   ├── HomeScreen.tsx
│   │   └── MapScreen.tsx
│   ├── search/
│   │   └── SearchResultScreen.tsx
│   ├── travel/
│   │   ├── TravelListScreen.tsx
│   │   ├── TravelPlanScreen.tsx
│   │   └── TravelNewScreen.tsx
│   ├── community/
│   │   ├── CommunityFeedScreen.tsx
│   │   ├── CommunityWriteScreen.tsx
│   │   └── ContestScreen.tsx
│   ├── spot/
│   │   ├── SpotDetailScreen.tsx
│   │   ├── SpotRegisterScreen.tsx
│   │   ├── ReviewWriteScreen.tsx
│   │   └── PhotoDetailScreen.tsx
│   ├── mypage/
│   │   ├── MyPageScreen.tsx
│   │   ├── UserProfileScreen.tsx
│   │   ├── SettingScreen.tsx
│   │   └── NotificationScreen.tsx
│   └── wishlist/
│       ├── WishlistScreen.tsx
│       └── WishlistSettingScreen.tsx
│
├── store/                      # Zustand 클라이언트 상태
│   ├── useAuthStore.ts         # JWT 토큰, 유저 정보
│   ├── useMapStore.ts          # 지도 상태 (마커, 뷰포트)
│   ├── useTravelStore.ts       # 여행 계획 편집 임시 상태
│   └── useUIStore.ts           # 토스트·모달 등 전역 UI 상태
│
├── types/                      # 공통 TypeScript 타입
│   ├── auth.ts
│   ├── spot.ts
│   ├── community.ts
│   ├── travel.ts
│   ├── user.ts
│   └── common.ts
│
└── utils/
    └── normalize.ts            # 기기 너비 스케일링 유틸
```

---

## 개발 규칙

### 스타일링

- **NativeWind `className`만 사용** — `StyleSheet.create()` 사용 금지
- Tailwind 단위(`px-7` 등)는 고정 픽셀. 기기별 스케일링이 필요한 값(버튼 높이, 폰트 크기)은 `src/constants/layout.ts` 상수 사용

> **목업 vs RN 구현 차이**: HTML 목업은 390px 고정 기준으로 CSS `px` 값을 그대로 씁니다.  
> RN 구현 시에는 목업의 px 값을 그대로 하드코딩하지 말고, 아래 기준에 따라 상수 또는 `normalizeFontSize`로 변환하세요.

> **`className`과 `style` prop 동시 사용**: `className`에는 Tailwind 유틸리티 클래스만 들어갑니다. `layout.ts` 상수처럼 JS 값은 `className`에 넣을 수 없으므로 `style` prop을 함께 사용합니다. 두 prop은 동시에 사용 가능합니다.
> ```tsx
> <View className="w-full items-center" style={{ height: BUTTON_HEIGHT }}>
> ```

#### className vs layout.ts 상수 기준

| 값 종류 | 방법 | 예시 |
|---|---|---|
| 패딩 · 마진 · gap | `className` | `className="px-7 gap-2"` |
| 폰트 크기 (스케일 내) | `layout.ts` 상수 (`FONT_*`) | `style={{ fontSize: FONT_LG }}` |
| 폰트 크기 (14px, 상수 없음) | `normalizeFontSize(14)` 인라인 | `style={{ fontSize: normalizeFontSize(14) }}` |
| 버튼·인풋 높이 | `layout.ts` 상수 | `style={{ height: BUTTON_HEIGHT }}` |
| border-radius (pill·card) | `layout.ts` 상수 | `style={{ borderRadius: BUTTON_RADIUS }}` |
| 아이콘 크기 | `layout.ts` 상수 또는 `normalize(n)` 인라인 | `size={ICON_MD}` 또는 `size={normalize(24)}` |
| `width: 100%` / `flex: 1` | `className` | `className="w-full flex-1"` |

> **`FONT_*` 상수 전체 목록** (토큰 px → 상수명):  
> `10px → FONT_2XS` / `11px → FONT_XS` / `13px → FONT_SM` / `15px → FONT_MD` / `17px → FONT_LG` / `22px → FONT_XL` / `28px → FONT_2XL`  
> `14px`(`--font-base`)만 상수가 없어 `normalizeFontSize(14)` 인라인으로 처리합니다.  
> **폰트는 8개 토큰(`10 · 11 · 13 · 14 · 15 · 17 · 22 · 28px`) 안에서만 사용합니다. 사이값(`9 · 12 · 16 · 18 · 20px` 등)은 금지** — `12px`는 `11` 또는 `13`으로 맞추세요.

> **raw 픽셀 사용 금지**: `fontSize: 12`, `height: 52` 등 raw 숫자를 직접 쓰지 않습니다.

#### normalizeFontSize 사용 기준

- **`FONT_*` 상수로 커버되는 크기** (10·11·13·15·17·22·28px): 반드시 상수 사용
- **`14px`(`--font-base`)**: 상수 미정의 → `normalizeFontSize(14)` 인라인
- **사이값(9·12·16·18·20px 등)**: 사용 금지 — 8개 토큰 안에서만 고름 (`12` → `11` 또는 `13`)
- **폰트 외 레이아웃 크기** (높이, radius, 아이콘 등): `normalize(n)` 사용 (`normalizeFontSize` 아님)
- **로고·히어로 타이틀 등 핵심 브랜드 요소**: `normalizeFontSize` 또는 `normalize` 적용 권장

```tsx
// ✅ 올바른 사용 — className과 style 동시 사용
<TouchableOpacity
  className="w-full items-center justify-center bg-[#E31B59] rounded-full"
  style={{ height: BUTTON_HEIGHT }}
>
  <Text style={{ fontSize: FONT_LG }} className="text-white font-medium">
    로그인
  </Text>
</TouchableOpacity>

// ✅ 상수 없는 토큰(14px)
<Text style={{ fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.4)' }}>
  본문
</Text>

// ✅ 아이콘 크기
<Feather name="search" size={ICON_MD} />

// ❌ StyleSheet 사용 금지
const styles = StyleSheet.create({ button: { height: 52 } });
// ❌ raw 픽셀 직접 사용
<Text style={{ fontSize: 12 }}>레이블</Text>
// ❌ layout.ts 상수를 className에 넣으려는 시도 (불가)
<Text className={`text-[${FONT_LG}px]`}>레이블</Text>
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

- `src/api/[domain].ts` — 순수 fetch 함수만 작성 (훅, 상태 포함 금지)
- `src/types/[domain].ts` — 도메인별 Request / Response 타입 정의
- `src/hooks/` — TanStack Query로 api 함수를 감싼 커스텀 훅

```ts
// src/api/spot.ts
import { client } from "@/api/client";
import type { Spot, SpotFilter } from "@/types/spot";

export const getSpots = async (filter: SpotFilter): Promise<Spot[]> => {
  const { data } = await client.get("/spots", { params: filter });
  return data;
};

// src/hooks/useSpot.ts
import { useQuery } from "@tanstack/react-query";
import { getSpots } from "@/api/spot";

export const useSpot = (filter: SpotFilter) =>
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

### 화면별 구현 주의사항

#### SpotDetailScreen — Collapsing Header 애니메이션

HTML 목업(`spot-detail.html`)은 스크롤 이벤트마다 hero 요소의 `height`를 직접 조작합니다.  
**RN 구현 시 이 방식을 그대로 쓰면 안 됩니다.** JS 스레드 → Native 스레드 브릿지 병목으로 심각한 jitter가 발생합니다.

```tsx
// ❌ 금지 — height 직접 조작 (reflow + jitter)
scrollY.addListener(({ value }) => {
  heroRef.current?.setNativeProps({ style: { height: 300 - value } });
});

// ✅ 권장 — Reanimated + translateY transform
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const scrollY = useSharedValue(0);
const onScroll = useAnimatedScrollHandler(e => {
  scrollY.value = e.contentOffset.y;
});

const heroStyle = useAnimatedStyle(() => ({
  transform: [{
    translateY: interpolate(scrollY.value, [0, 200], [0, -100], Extrapolation.CLAMP),
  }],
}));

return (
  <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}>
    <Animated.View style={[styles.hero, heroStyle]} />
    {/* 콘텐츠 */}
  </Animated.ScrollView>
);
```

핵심: `translateY` transform은 native 스레드에서 처리되어 JS 부하 없이 60fps를 유지합니다.

---

### 화면 구현 순서

HTML 목업 파일을 보면서 아래 순서로 구현합니다.

1. `src/components/ui/[도메인]/[화면명].html` 열기
2. 레이아웃 구조 파악 → `src/screens/[도메인]/[화면명]Screen.tsx` 생성
3. `ScreenContainer`를 루트 래퍼로 적용 (히어로 화면은 `edges` 조정)
4. NativeWind className으로 스타일 적용
5. 고정 수치는 `src/constants/layout.ts` 상수 사용
6. API 연동 필요 시 `src/api/[도메인].ts` 함수 작성 후 `src/hooks/` 훅으로 감싸기

---

### 반응형 구현 주의사항

지원 기기 범위 (360dp ~ 430dp) 전체에서 레이아웃이 올바르게 보이려면 아래 규칙을 반드시 따라야 합니다.

#### 목업 값을 RN으로 옮길 때 변환 기준

목업 CSS의 px 값을 보고 구현할 때, 값 종류에 따라 다르게 처리합니다.

| 목업 CSS 값 | RN 구현 방법 | 이유 |
|---|---|---|
| `padding: 28px` / `gap: 16px` | `className="px-7 gap-4"` | Tailwind flex 레이아웃이 남은 공간을 자동으로 분배 |
| `font-size: 17px` (스케일 내) | `FONT_LG` | 기기 너비에 따라 폰트 크기 비례 조정 필요 |
| `font-size: 14px` (상수 없음) | `normalizeFontSize(14)` | `--font-base`, 상수 미정의 (12·16·20px 등 사이값은 금지) |
| `height: 52px` (버튼·인풋) | `BUTTON_HEIGHT` / `INPUT_HEIGHT` | 360dp에서 비율 유지 |
| `border-radius: 26px` | `BUTTON_RADIUS` | 높이 상수와 함께 비례 유지 |
| `width: 100%` / `flex: 1` | `className="w-full"` / `className="flex-1"` | 비율 기반, 스케일링 불필요 |

#### 자주 하는 실수

```tsx
// ❌ 목업 값을 그대로 복사
<View style={{ height: 52, borderRadius: 26 }} />
<Text style={{ fontSize: 17 }} />

// ✅ 상수로 변환
<View style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}>
  <Text style={{ fontSize: FONT_LG }}>...</Text>
</View>
```

```tsx
// ❌ 패딩을 style로 지정
<View style={{ paddingHorizontal: 28 }} />

// ✅ className 사용 (고정 픽셀이어도 레이아웃 무관)
<View className="px-7" />
```

```tsx
// ❌ StyleSheet.create 사용
const styles = StyleSheet.create({ card: { borderRadius: 16 } });

// ✅ layout.ts 상수 사용
<View style={{ borderRadius: CARD_RADIUS }} />
```

#### 확인 방법

iOS 시뮬레이터에서 **iPhone SE (375dp)** 와 **iPhone 15 Plus (428dp)** 를 각각 확인하세요.

시뮬레이터 전환 방법:
```bash
pnpm ios --simulator='iPhone SE (3rd generation)'
pnpm ios --simulator='iPhone 15 Plus'
```
또는 Xcode → Window → Devices and Simulators에서 기기를 변경합니다.

두 기기에서 버튼·텍스트 비율이 자연스러우면 360~430dp 전 범위가 대응된 것입니다. SE에서 버튼 높이가 기준 기기 대비 2~4px 작게 보이는 것은 스케일링에 의한 정상 동작입니다.

---

### 스케일링 변환 원리

`src/utils/normalize.ts`가 앱 시작 시 실제 기기 너비를 읽어 `scale` 계수를 계산합니다.

```ts
scale = clamp(실제 기기 너비, 360, 430) / 390
// 예) 360dp → 0.923 / 390dp → 1.000 / 430dp → 1.103
```

이 `scale`을 두 가지 방식으로 적용합니다.

#### normalize(n) — 레이아웃 크기용

버튼 높이, 아이콘 크기, radius 등 레이아웃 요소에 사용합니다. `scale`을 그대로 곱합니다.  
**폰트 크기 이외의 모든 고정 크기(높이, radius, 아이콘, 간격 상수)는 `normalize(n)`을 사용합니다.** `normalizeFontSize`는 폰트 전용입니다.

```ts
normalize(n) = Math.round(n * scale)
```

| 기준값 | 360dp | 390dp | 430dp |
|---|---|---|---|
| `52` (버튼 높이) | 48 | 52 | 57 |
| `26` (pill radius) | 24 | 26 | 29 |
| `22` (아이콘) | 20 | 22 | 24 |

#### normalizeFontSize(n) — 폰트 크기용

폰트는 `scale`을 그대로 적용하면 기기 간 차이가 너무 커져 가독성이 깨집니다. 변화폭을 절반으로 줄입니다.

```ts
fontScale = (scale - 1) * 0.5 + 1
normalizeFontSize(n) = Math.round(n * fontScale)
```

| 기준값 | 360dp | 390dp | 430dp |
|---|---|---|---|
| `11` (FONT_XS) | 10 | 11 | 12 |
| `17` (FONT_LG) | 16 | 17 | 18 |
| `28` (FONT_2XL) | 26 | 28 | 30 |

> 360dp와 430dp 사이의 실제 차이가 1~2px 수준인 것이 의도적입니다. 글자 크기가 기기마다 크게 달라지면 줄바꿈 위치가 바뀌어 레이아웃이 깨질 수 있습니다.

#### layout.ts에 없는 값을 추가해야 할 때

새 화면에서 기존 상수로 커버되지 않는 고정 크기가 반복적으로 필요하다면 `src/constants/layout.ts`에 추가합니다.

```ts
// layout.ts에 추가 — 여러 파일/화면에서 반복 사용되는 경우
export const BADGE_HEIGHT = normalize(20);       // 레이아웃 크기 → normalize
export const CHIP_RADIUS = normalize(17);        // 레이아웃 크기 → normalize
// export const FONT_LABEL = normalizeFontSize(14); // 폰트 → normalizeFontSize
```

한 화면에서 한 번만 쓰이는 값은 인라인으로 처리하고 상수로 올리지 않습니다.

```tsx
// ✅ 인라인 처리 (일회성)
<Text style={{ fontSize: normalizeFontSize(14) }}>레이블</Text>
<View style={{ height: normalize(36) }} />
```

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
| `docs/guide/ops/team-assignments.md` | 화면·API·훅·스토어 담당자 현황 |
| `docs/guide/dev/ui-publishing.md` | HTML 목업 구조 및 화면 간 네비게이션 흐름 |
| `docs/guide/dev/prompt-writing-guide.md` | AI 활용 화면 구현 프롬프트 템플릿 |
| `docs/guide/dev/device-support.md` | 지원 기기 범위, 레이아웃 상수 사용법 |
| `docs/guide/api/photo-upload-spec.md` | 사진 업로드 스펙 (형식·크기·EXIF 처리) |
| `docs/guide/ops/github-actions-guide.md` | GitHub Actions 자동화 동작 및 대응 |
| `CLAUDE.md` | 프로젝트 전체 규칙 및 디자인 시스템 |
