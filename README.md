# PNG

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Expo (React Native) |
| 언어 | TypeScript |
| 패키지 매니저 | pnpm |
| 클라이언트 상태 | Zustand |
| 서버 상태 / API | TanStack Query |
| 스타일링 | NativeWind (Tailwind CSS v3) |

---

## 시작하기

### 사전 준비

- Node.js 18 이상
- pnpm (`npm install -g pnpm`)
- Expo Go 앱 (실기기 테스트 시) — [iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
- Xcode (iOS 시뮬레이터, Mac 전용) — 설치 후 아래 명령어 실행 필요
  ```bash
  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
  sudo xcodebuild -license accept
  ```
- Android Studio (Android 에뮬레이터)

### 설치 및 실행

```bash
# 1. 의존성 설치
pnpm install

# 2. 실행
pnpm ios       # iOS 시뮬레이터
pnpm android   # Android 에뮬레이터
pnpm start     # Expo Go 앱으로 실기기 테스트
```

---

## 프로젝트 구조

```
PNG/
├── src/
│   ├── api/          # API 호출 함수 (REST)
│   ├── components/
│   │   └── ui/       # 퍼블리싱 파일 (순수 UI, 로직 없음)
│   ├── hooks/        # 커스텀 훅
│   ├── screens/      # 화면 단위 컴포넌트
│   ├── store/        # Zustand 스토어
│   ├── types/        # 공통 타입 정의
│   └── utils/        # 유틸 함수
├── assets/           # 이미지, 폰트 등 정적 리소스
├── App.tsx           # 앱 진입점
├── global.css        # Tailwind 글로벌 CSS
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 주요 설정

### Path Alias

`src/` 하위 경로를 `@/`로 줄여서 사용할 수 있습니다.

```ts
// 기존
import { Button } from "../../components/Button";

// alias 사용
import { Button } from "@/components/Button";
```

### 스타일링 (NativeWind)

Tailwind 클래스를 React Native에서 그대로 사용합니다.

```tsx
<View className="flex-1 bg-white px-4">
  <Text className="text-lg font-bold text-gray-800">Hello</Text>
</View>
```

### 서버 상태 관리 (TanStack Query)

`QueryClientProvider`는 `App.tsx`에 이미 설정되어 있습니다.

```ts
// src/api/user.ts
export const getUser = async (id: string) => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
};

// src/screens/UserScreen.tsx
import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/api/user";

const { data, isLoading } = useQuery({
  queryKey: ["user", id],
  queryFn: () => getUser(id),
});
```

### 클라이언트 상태 관리 (Zustand)

```ts
// src/store/useAuthStore.ts
import { create } from "zustand";

type AuthStore = {
  token: string | null;
  setToken: (token: string) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
  clear: () => set({ token: null }),
}));
```

---

## 환경 변수

`.env` 파일을 루트에 생성하고 아래 형식으로 작성합니다.  
Expo에서는 `EXPO_PUBLIC_` 접두사가 붙은 변수만 클라이언트에 노출됩니다.

```
EXPO_PUBLIC_API_URL=https://api.example.com
```

```ts
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

> `.env` 파일은 git에 커밋하지 않습니다. `.env.example`을 참고하세요.

---

## 협업 및 자동화 규칙

### 브랜치/PR 컨벤션

- 브랜치 네이밍, PR 제목 prefix, 라벨 규칙은 `.github/CONVENTIONS.md`를 따릅니다.
- PR 템플릿은 `.github/pull_request_template.md`를 사용합니다.

### CI

- `main`/`develop` 대상 `push` 및 `pull_request`에서 아래 검사가 자동 실행됩니다.
  - Type check: `pnpm exec tsc --noEmit`
  - Lint: `pnpm lint`

### PR 라벨 자동화

- `.github/workflows/labeler.yml`과 `.github/labeler.yml`로 PR 제목/브랜치 기준 라벨이 자동 적용됩니다.
- 예: `feat: ...` -> `feature`, `fix: ...` -> `bug`, `test: ...` -> `test`

### 의존성 동기화 (pull 이후)

- Husky `post-merge` hook이 활성화되어 있습니다.
- `git pull` 이후 `pnpm-lock.yaml` 또는 `package.json`이 바뀐 경우에만 자동으로 `pnpm install --frozen-lockfile`를 실행합니다.
- 의존성 파일 변경이 없으면 자동 설치를 건너뜁니다.

### Lockfile 정책

- 이 프로젝트는 `pnpm` 기준입니다.
- `pnpm-lock.yaml`만 관리하며, `package-lock.json`은 커밋하지 않습니다.

### ESLint 인라인 리뷰 (Reviewdog)

- PR에서 ESLint 오류가 발생한 줄에 직접 코멘트가 달립니다.
- 워크플로우: `.github/workflows/reviewdog.yml`
- 동작 조건: `main` / `develop` 대상 PR

### 이슈 템플릿

- 이슈 작성 시 **버그 리포트** / **기능 요청** 템플릿 중 하나를 선택해 작성합니다.
- 템플릿 선택 시 라벨(`bug` / `feature`)이 자동 적용됩니다.
- 이슈 제목 prefix(`fix:`, `feat:` 등)로도 라벨이 자동 적용됩니다.
- 워크플로우: `.github/workflows/issue-labeler.yml`

### 의존성 자동 업데이트 (Dependabot)

- 매주 월요일 오전 9시(KST)에 의존성 버전을 확인하고 업데이트 PR을 자동으로 생성합니다.
- 생성된 PR에는 `chore` 라벨이 자동으로 붙습니다.
- 설정 파일: `.github/dependabot.yml`
