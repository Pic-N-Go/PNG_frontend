# 구현 계획: expo-compat-fix

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/expo-compat-fix.md`
- 관련 목업: 없음
- 완료 목표: Expo SDK 54 호환 버전 정렬 + `pnpm start` 정상 시작 확인

## 2) 구현 전략

- 핵심 접근: `expo install --fix`로 SDK 54 기준 전체 버전 자동 정렬 → pnpm install → 서버 시작 검증
- 리스크:
  - `expo install --fix`가 일부 패키지(react, eslint-config-expo)를 자동 처리 못할 수 있음
  - boolean/string 런타임 에러가 버전 fix 후에도 지속될 수 있음
- 리스크 완화:
  - 자동 fix 후 `expo-doctor` 재실행으로 잔존 경고 확인
  - 에러 지속 시 navigation screenOptions / boolean prop 코드 스캔 (Task 6)

## 3) 작업 태스크

### Task 1 — Auth UI 변경사항 Stash

- 대상: 현재 working tree의 auth 관련 파일 (package.json, pnpm-lock.yaml 제외)
- 변경 내용:
  ```
  git stash push -u -m "wip/auth-ui-before-expo-fix" \
    App.tsx \
    src/navigation/AuthStack.tsx \
    src/navigation/index.tsx \
    src/screens/auth/LoginScreen.tsx \
    src/screens/auth/OnboardingScreen.tsx \
    src/screens/auth/SignupScreen.tsx \
    src/store/useAuthStore.ts \
    docs/guide/api/auth-api.md \
    src/components/auth
  ```
- 완료 조건: stash list에 `wip/auth-ui-before-expo-fix` 항목 확인, package.json은 working tree에 그대로 존재
- 검증 방법: `git stash list` + `git status` 확인

### Task 2 — 전용 브랜치 생성

- 변경 내용: `git checkout -b chore/expo-compat-fix`
- 완료 조건: `git branch --show-current` → `chore/expo-compat-fix`
- 검증 방법: `git branch --show-current`

### Task 3 — expo-doctor 베이스라인 확인

- 변경 내용: `npx expo-doctor` 실행 (수정 없음, 현황 기록용)
- 완료 조건: 출력 결과 확인 및 경고 항목 목록화
- 검증 방법: 출력 내용을 보고서에 포함

### Task 4 — expo install --fix 실행

- 대상 파일: `package.json`, `pnpm-lock.yaml`
- 변경 내용: `npx expo install --fix`
  - 예상 변경:
    - expo-font: 56.0.x → ~14.0.12
    - expo-linear-gradient: 56.0.x → ~15.0.8
    - react: 19.2.7 → 19.1.0
    - react-native: 0.81.6 → 0.81.5
    - react-native-reanimated: 4.4.1 → ~4.1.1
    - react-native-safe-area-context: 5.8.0 → ~5.6.0
    - react-native-screens: 4.25.2 → ~4.16.0
    - @types/react: 19.2.17 → ~19.1.10
    - eslint-config-expo: 55.0.1 → ~10.0.0
- 완료 조건: 명령어 정상 종료, package.json 버전 갱신 확인
- 검증 방법: `git diff package.json`으로 변경 내용 확인

### Task 5 — pnpm install

- 변경 내용: `pnpm install`로 pnpm-lock.yaml 재생성
- 완료 조건: `pnpm install` 정상 종료, 에러 없음
- 검증 방법: 종료 코드 0 확인

### Task 6 — expo-doctor 재실행 (잔존 경고 확인)

- 변경 내용: `npx expo-doctor` 재실행 (수정 없음)
- 완료 조건: 경고 0개 또는 devDependency 관련 무해한 항목만 잔존
- 검증 방법: 출력 결과 확인 후 보고

### Task 7 — pnpm start 서버 시작 확인

- 변경 내용: `pnpm start --tunnel -c` 실행 (Metro Bundler 시작 확인 후 종료)
- 완료 조건: Metro Bundler "Ready" 상태 확인 (또는 QR 코드 출력)
- 검증 방법: 서버 로그에서 "Metro waiting on..." 또는 ready 메시지 확인

### Task 8 (조건부) — Boolean/String Prop 코드 스캔 및 수정

조건: Task 7 이후 또는 Lucy 수동 테스트 중 `TypeError: expected dynamic type 'boolean', but had type 'string'` 지속 시 실행

- 대상 파일:
  - `src/navigation/AuthStack.tsx`
  - `src/navigation/index.tsx`
  - 모든 Screen 컴포넌트의 `screenOptions`, `options` prop
  - 공통 컴포넌트 prop (boolean 타입에 `"true"` / `"false"` 문자열 전달 케이스)
- 변경 내용: string → boolean 타입 수정 (`"true"` → `{true}`)
- 완료 조건: 런타임 에러 미발생
- 검증 방법: Lucy 수동 테스트

## 4) 검증 체크포인트

- [ ] Task 1: `git stash list`에 auth UI stash 확인, package.json 미포함
- [ ] Task 2: 브랜치 `chore/expo-compat-fix` 확인
- [ ] Task 4: `expo install --fix` 후 package.json 버전 변경 확인
- [ ] Task 5: `pnpm install` 에러 없음
- [ ] Task 6: `expo-doctor` 경고 잔존 항목 확인
- [ ] Task 7: Metro Bundler 정상 시작
- [ ] Task 8: (조건부) boolean/string 에러 제거

## 5) 롤백 계획

- 영향 파일: `package.json`, `pnpm-lock.yaml`
- 되돌림 방법:
  - `git checkout feat/auth-ui-publishing-parity`
  - `git stash pop` (stash@{0}: wip/auth-ui-before-expo-fix)
  - 또는 `chore/expo-compat-fix` 브랜치 삭제 후 재시도
- 데이터 영향: 없음

## 6) PR 구성

- PR 제목: `chore(deps): Expo SDK 54 호환 패키지 버전 정렬 및 런타임 에러 수정`
- 변경 요약:
  - expo-font, expo-linear-gradient, react-native-screens 등 SDK 56+ 버전을 SDK 54 기준으로 다운그레이드
  - react-native-screens 버전 불일치로 인한 boolean/string TypeError 제거
- 리뷰 요청 포인트: package.json 버전 변경 내역, expo-doctor 결과

## 7) 완료 후 대기 사항

- Task 7 완료 후 작업 중단 → Lucy 수동 Expo Go 테스트 대기
- 테스트 OK 확인 전 stash pop / 브랜치 복귀 금지
- 테스트 OK 후 진행할 작업:
  1. `git checkout feat/auth-ui-publishing-parity`
  2. `git stash pop stash@{0}` (wip/auth-ui-before-expo-fix)
  3. 필요 시 package.json 버전 충돌 수동 해결
