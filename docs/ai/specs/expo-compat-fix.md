# 기능 스펙: expo-compat-fix

## 1) 기능 정보

- 기능명: Expo SDK 54 호환 버전 정렬 + 런타임 에러 제거
- 담당자: @lucy
- 관련 이슈: 없음 (긴급 안정화)
- 대상 플랫폼: iOS / Android (Expo Go)

## 2) 문제와 목표

- 해결하려는 문제:
  - `expo-font ^56.x`, `expo-linear-gradient ^56.x`, `eslint-config-expo ^55.x` 등이 SDK 56+ 버전으로 수동 업그레이드되어 `expo ~54.0.33` (SDK 54)과 불일치
  - `react-native-screens@4.25.2` (expected ~4.16.0)로 인해 Expo Go 런타임에서 `TypeError: expected dynamic type 'boolean', but had type 'string'` 발생
- 사용자 가치: Expo Go에서 앱이 정상 실행됨
- 완료 기준: `expo-doctor` 경고 없음 + `pnpm start` 정상 시작

## 3) 범위

- 포함(In Scope):
  - `expo install --fix`로 SDK 54 기준 패키지 버전 정렬
  - `package.json` + `pnpm-lock.yaml` 버전 변경
  - 버전 fix 후에도 boolean/string 런타임 에러 지속 시 코드 스캔 및 최소 수정
  - 전용 브랜치 `chore/expo-compat-fix`에서만 작업
- 제외(Out of Scope):
  - SDK 56으로의 업그레이드
  - Auth UI/UX 디자인·로직 변경
  - NativeWind, Tailwind, 앱 기능 수정
  - stash pop / 브랜치 복귀 (수동 테스트 OK 확인 전 금지)

## 4) 수용 기준 (Acceptance Criteria)

- [ ] AC1: `npx expo-doctor` 실행 결과에 버전 불일치 경고 없음 (또는 수정 불가 devDependency만 잔존)
- [ ] AC2: `pnpm start` (또는 `pnpm start --tunnel -c`) 실행 시 서버가 정상 시작됨 (Expo Metro Bundler가 ready 상태)
- [ ] AC3: Expo Go 수동 테스트에서 `TypeError: expected dynamic type 'boolean', but had type 'string'` 에러 미발생 (수동 검증, 테스터: Lucy)

## 5) UI/UX 요구사항

해당 없음 (패키지 버전 정렬 작업)

## 6) 데이터/API 요구사항

해당 없음

## 7) 상태 관리

해당 없음

## 8) 기술 제약 체크

- [ ] Auth 화면 디자인/동작 로직 변경 금지
- [ ] NativeWind `className` 기존 패턴 유지
- [ ] `@/` alias 기존 패턴 유지
- [ ] `package.json` 변경 시 `pnpm install`로 lockfile 동기화

## 9) 테스트 시나리오

- 정상 케이스: `expo install --fix` 실행 후 `pnpm install` → `pnpm start` 서버 정상 시작
- 경계 케이스: expo install --fix가 일부 패키지를 자동 fix하지 못하는 경우 → 수동 버전 명시
- 실패 케이스: 버전 fix 후에도 런타임 에러 지속 → 코드에서 boolean prop에 string 전달 케이스 스캔

## 10) 오픈 이슈 / 결정 필요

- `react 19.2.7 → 19.1.0` 다운그레이드 수용 (확인됨)
- `eslint-config-expo 55.0.1 → ~10.0.0` 다운그레이드 시 `.eslintrc` / `eslint.config.js` 설정 변경 필요 여부 → fix 실행 후 확인
- 버전 fix 후 boolean/string 에러 잔존 시 코드 스캔 범위: `navigation/`, `screenOptions`, 공통 컴포넌트 prop (AuthStack.tsx, index.tsx 등)
- stash pop + 브랜치 복귀는 Lucy 수동 테스트 OK 확인 후 별도 진행

## 11) 브랜치/Stash 전략

```
현재 브랜치: feat/auth-ui-publishing-parity
  ↓ stash push (App.tsx, auth screens, auth components, navigation, store, docs — package.json 제외)
  ↓ git checkout -b chore/expo-compat-fix
  ↓ (package.json은 working tree에 유지 → expo install --fix로 버전 수정)
  ↓ pnpm install → commit → 보고 → 대기
```

Stash 복귀는 수동 테스트 OK 후 별도 진행.
