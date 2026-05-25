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

## Design System

Full spec is in `.claude/design.md`. Key rules:

- **Brand / Accent color**: `#E31B59` (Pink) — used for all interactive elements (CTA buttons, active states, active tabs, focus borders). Primary palette: Black · White · Pink.
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
