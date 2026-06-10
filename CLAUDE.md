# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PNG (Pick N Go)** — a photo-spot travel planning app. Users discover photo locations with conditions like weather, golden hour, and air quality. The app follows Apple Design System conventions (Light Mode only, mobile-first at 390×844).

## Commands

```bash
pnpm install          # install dependencies
pnpm ios              # run on iOS simulator
pnpm android          # run on Android emulator
pnpm start            # start Expo dev server (scan with Expo Go)
pnpm web              # run in browser
```

No lint or test scripts are configured yet.

## Architecture

### State Management

- **Client state**: Zustand stores in `src/store/` (e.g. auth token, UI state)
- **Server state**: TanStack Query — API fetch functions live in `src/api/`, consumed via `useQuery`/`useMutation` in screens or `src/hooks/`
- `QueryClientProvider` is already set up in `App.tsx`

### Styling

NativeWind (Tailwind CSS v3) is used for all styling. Use `className` props directly on React Native components. Global CSS is in `global.css`. The tailwind config is at `tailwind.config.js`.

**Do NOT use `StyleSheet.create()`** — all styles must be written as NativeWind `className`. Using StyleSheet breaks design token consistency and makes it harder to match the HTML mockups.

### Path Alias

`@/` maps to `src/`. Always use this alias for imports within the project.

```ts
import { useAuthStore } from "@/store/useAuthStore";
```

### Directory Conventions

| Directory | Purpose |
|---|---|
| `src/api/` | Raw fetch functions (no hooks, no state) |
| `src/components/ui/` | HTML mockups grouped by feature (`auth/` `home/` `travel/` `community/` `spot/` `mypage/` `wishlist/`) — see `docs/ui-publishing.md` |
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
- 상세 지원 기기 목록, 상수 사용 예시, 태블릿 향후 계획 → `docs/device-support.md`

> NativeWind `className`의 Tailwind 단위(`px-7` 등)는 고정 픽셀입니다. 기기 너비에 따라 스케일이 필요한 값(버튼 높이, 폰트 크기 등)은 `src/constants/layout.ts` 상수를 사용하세요. 패딩·마진·gap은 `className`으로 표현합니다.

## Design System

Full spec is in `.claude/design.md`. Key rules:

- **Brand / Accent color**: `#E31B59` (Pink) — used for all interactive elements (CTA buttons, active states, active tabs, focus borders). Primary palette: Black · White · Pink.
  - 예외: 알림 화면(`notification.html`)의 필터 탭 활성 상태는 Black(`#000`) 사용 (의도된 디자인)
- **Backgrounds**: page `#ffffff`, card/input `#f5f5f7`
- **Cards**: no border, no shadow — elevation via background color contrast only
- **Buttons**: pill shape (`border-radius: 50%` of height), primary height 52px
- **Typography**: Pretendard Variable font, negative letter-spacing on all sizes, max weight 600
- **Layout**: 28px horizontal padding for content, 20px for card grids
- **No emojis anywhere in the UI**
- **Text alignment**: left-align everything; center only in hero/logo areas
- Hero gradient (golden hour): `#1a1530 → #2d1b4e → #8b4a6b → #d4856a → #e8a87c → #f0c89a`, used only in hero sections

### Screens Planned

- `/login` — hero + email/password + social login (Kakao, Apple)
- `/signup` — condensed hero + email verification + password strength + interest theme pills + terms
- `/home` — hero + search + category filter + nearby spots map + popular spots scroll + calendar
- `/spot/:id` — spot detail with Photogenic Score (weather/golden hour/dust/congestion/season)

HTML mockups are in `src/components/ui/` (grouped by feature). Full structure and navigation flow in `docs/ui-publishing.md`.
