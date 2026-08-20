# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PNG (Pick N Go)** — a photo-spot travel planning app. Users discover photo locations with conditions like weather, golden hour, and air quality. The app follows Apple Design System conventions (Light Mode only, mobile-first at 390×844).

## Commands

```bash
pnpm install          # install dependencies
pnpm ios              # run on iOS simulator (bare workflow — Xcode + Metro 필요)
pnpm android          # run on Android emulator (bare workflow — Android Studio + Metro 필요)
pnpm start            # Metro 번들러 실행 (Xcode/Android Studio 빌드 후 별도 실행)
pnpm web              # run in browser
```

> **bare workflow 주의**: 이 프로젝트는 `expo prebuild`로 bare workflow 전환됨. `pnpm ios` 실행 전 `pnpm start`로 Metro를 먼저 실행하거나, Xcode에서 직접 빌드할 것. Expo Go 앱으로는 실행 불가.

> **CocoaPods**: 버전은 루트 `Gemfile`에 고정(cocoapods 1.17.0, xcodeproj 1.28.1). **`bundle install`을 최초 1회 반드시 실행할 것** (Ruby 3.2+ 필요). 이후 pod은 항상 `bundle exec pod install`로 실행.
>
> `bundle install` 직후 첫 빌드는 `bundle exec pod install`도 한 번 수동 실행. 이전에 다른 pod 버전으로 빌드한 적이 있으면 `ios/Pods/Manifest.lock`이 그 버전이라 `The sandbox is not in sync with the Podfile.lock` 에러가 나는데, `expo run:ios`는 `ios/Pods/`가 있으면 pod install을 건너뛰어 자동 복구가 안 됨. 상세 → `docs/guide/ops/ios-pod-lock-workflow.md`
>
> `bundle install`을 건너뛰면 `pnpm ios`가 **경고 없이** 시스템 `pod`으로 폴백해 고정이 무효화되고, `Podfile.lock`·`project.pbxproj` diff 노이즈가 되살아남 (expo CLI가 `bundle exec pod --version` 실패 시 조용히 우회). 어느 쪽이 실행됐는지는 `EXPO_DEBUG=1 pnpm ios` 로그의 `> bundle exec pod install` 줄로 확인.

`pnpm lint` is configured. Test scripts are not configured yet.

## Architecture

### State Management

- **Client state**: Zustand stores in `src/store/` (e.g. auth token, UI state)
- **Server state**: TanStack Query — API fetch functions live in `src/api/`, consumed via `useQuery`/`useMutation` in screens or `src/hooks/`
- `QueryClientProvider` is already set up in `App.tsx`

### Styling

NativeWind (Tailwind CSS v3) is used for all styling. Use `className` props directly on React Native components. Global CSS is in `global.css`. The tailwind config is at `tailwind.config.js`.

**Do NOT use `StyleSheet.create()`** — all styles must be written as NativeWind `className`. Using StyleSheet breaks design token consistency and makes it harder to match the HTML mockups.

**Do NOT use raw pixel values for font sizes or heights** — always use `src/constants/layout.ts` constants (`FONT_2XS`, `FONT_XS`, `FONT_SM`, `FONT_MD`, `FONT_LG`, `FONT_XL`, `FONT_2XL`, `BUTTON_HEIGHT`, etc.). Font sizes must stay within the 8 scale tokens (10/11/13/14/15/17/22/28px) — never introduce in-between sizes like 12/16/18/20px (use 11 or 13 instead of 12). Only `14px` (`--font-base`) has no constant → use `normalizeFontSize(14)`. Never write `fontSize: 12` or `height: 52` as raw numbers.

### Path Alias

`@/` maps to `src/`. Always use this alias for imports within the project.

```ts
import { useAuthStore } from "@/store/useAuthStore";
```

### Directory Conventions

| Directory | Purpose |
|---|---|
| `src/api/` | Raw fetch functions (no hooks, no state) |
| `src/components/ui/` | HTML mockups grouped by feature (`auth/` `home/` `travel/` `community/` `spot/` `mypage/` `wishlist/`) — see `docs/guide/dev/ui-publishing.md`. 공통 파일: `fonts.css` (Pretendard), `common.css` (토큰·리셋·phone-frame) |
| `src/hooks/` | Custom hooks (typically wrap TanStack Query calls) |
| `src/screens/` | Screen-level components |
| `src/store/` | Zustand stores |
| `src/types/` | Shared TypeScript types |
| `src/utils/` | Pure utility functions |
| `docs/` | Project documentation (UI structure, conventions) |

### Environment Variables

Copy `.env.example` to `.env`. Only variables prefixed with `EXPO_PUBLIC_` are exposed to client code.

```ts
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

## 지원 기기

- **대상**: 스마트폰 (iOS / Android), 태블릿 미지원
- **지원 범위**: `360dp ~ 430dp` (안드로이드 보급형 ~ iPhone 15 Pro Max)
- **디자인 기준**: `390dp` (iPhone 15 Pro)
- **스케일링 유틸**: `src/utils/normalize.ts` — 고정 픽셀(버튼 높이, 폰트 크기 등)에 한해 사용
- **레이아웃 상수**: `src/constants/layout.ts` — 버튼 높이, 패딩, radius 등 디자인 기준값 상수 모음
- 상세 지원 기기 목록, 상수 사용 예시, 태블릿 향후 계획 → `docs/guide/dev/device-support.md`

> NativeWind `className`의 Tailwind 단위(`px-7` 등)는 고정 픽셀입니다. 기기 너비에 따라 스케일이 필요한 값(버튼 높이, 폰트 크기 등)은 `src/constants/layout.ts` 상수를 사용하세요. 패딩·마진·gap은 `className`으로 표현합니다.

## Design System

### 토큰 사용 (하드코딩 금지)

색·테두리·그림자·폰트는 상수로만 쓴다. 단일 소스는 `src/constants/colors.json`이며
`tailwind.config.js`와 TS가 같은 파일을 읽어 className과 style prop이 어긋나지 않는다.

| 대상 | className | TS |
|---|---|---|
| 브랜드 (틴트 5/10/30/90) | `bg-brand` `bg-brand/5` | `BRAND` `BRAND_TINT` … |
| 카드·인풋 배경 | `bg-card` | `CARD` |
| 보조 텍스트 | `text-sub` | `TEXT_SUB` |
| 구분선 | `border-hairline` + `border-b-[0.5px]` | `HAIRLINE` / `HAIRLINE_WIDTH` |
| 컨트롤 보더 | — | `BORDER_CONTROL` |
| 그림자 | — | `SHADOW_CONTROL` / `SHADOW_OVERLAY` |

- 폰트는 Pretendard **3웨이트**(`Regular`/`Medium`/`SemiBold`)만 로드. `PretendardVariable`은 쓰지 않는다
- **`fontWeight`를 쓰지 말 것** — RN은 웨이트별로 패밀리가 갈린다. `font-*` 유틸리티가 패밀리 지정으로 재정의돼 있다
- 그림자는 떠 있는 것에만. 콘텐츠 카드는 테두리·그림자 없이 배경 대비로만 구분한다
- 새 웨이트는 `App.tsx`의 `useFonts` 등록이 선행 조건이다

> 토큰 전체 목록, 예외 6종, 폰트 상세, 판단 근거 → **`docs/guide/dev/design-tokens.md`**

Key rules:

- **Brand / Accent color**: `#E31B59` (Pink) — used for all interactive elements (CTA buttons, active states, active tabs, focus borders). Primary palette: Black · White · Pink.
  - **Accent(핑크)**: 화면을 전환하거나 데이터를 바꾸는 것 — CTA 버튼, 하단 탭바 활성, 언더라인 탭 활성, 포커스 보더, 좋아요·팔로우 활성
  - **Black(`#000`)**: 같은 화면 안에서 목록만 거르는 중립 컨트롤 — 세그먼트 컨트롤 활성, 필터 칩 활성, 정렬 칩 활성 (`notification.html` 필터 탭, `community-feed.html` 세그먼트·칩, `spot-detail.html`, `mypage.html`, `travel-plan.html` 등)
  - 판단 기준: **어디로 가는가 → 핑크 / 무엇을 보는가 → 블랙**
- **Backgrounds**: page `#ffffff`, card/input `#f5f5f7`
- **Cards**: no border, no shadow — elevation via background color contrast only
- **Buttons**: pill shape (`border-radius: 50%` of height), primary height 52px
- **Typography**: Pretendard (Regular/Medium/SemiBold 3 weights), negative letter-spacing on all sizes, max weight 600
- **Layout**: 28px horizontal padding for content, 20px for card grids
- **No emojis anywhere in the UI**
- **Text alignment**: left-align everything; center only in hero/logo areas
- Hero gradient (golden hour): `#1a1530 → #2d1b4e → #8b4a6b → #d4856a → #e8a87c → #f0c89a`, used only in hero sections

### Screens Planned

- `/login` — hero + email/password + social login (Kakao; Apple 버튼은 카카오 우선 진행으로 보류, 코드상 주석 처리됨)
- `/signup` — condensed hero + email verification + password strength + interest theme pills + terms
- `/home` — hero + search + category filter + nearby spots map + popular spots scroll + calendar
- `/spot/:id` — spot detail with Photogenic Score (weather/golden hour/dust/congestion/season)

HTML mockups are in `src/components/ui/` (grouped by feature). Full structure and navigation flow in `docs/guide/dev/ui-publishing.md`. RN 구현 가이드: `docs/guide/dev/development-guide.md`.

목업 확인: 브라우저 DevTools에서 뷰포트를 **390px**로 설정 (기기 시뮬레이터 또는 반응형 모드).
