# 구현 계획 — auth-component-props-fix

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/feature/auth-ui-publishing-parity/auth-component-props-fix.md`
- 관련 목업: 없음
- 완료 목표: 3개 파일 수정 + tsc/lint 통과

## 2) 구현 전략

- 핵심 접근: 파일별 독립 수정, Task 2는 Task 1 완료 후 실행 (AuthCheckbox 타입 변경 → SignupScreen 적용 순서)
- 리스크: `onPress` optional 변경 시 기존 호출부에서 required로 전달하던 경우 타입 충돌 가능 → SignupScreen에서 prop 제거로 해소
- 리스크 완화: Task 1·2를 연속 실행해 tsc로 검증

## 3) Task Breakdown

### Task 1 — AuthCheckbox onPress optional + 조건부 렌더링

- 대상 파일: `src/components/auth/AuthCheckbox.tsx`
- 변경 내용:
  - `Props.onPress: () => void` → `onPress?: () => void`
  - 컴포넌트 내부에서 `onPress` 유무에 따라 `Pressable` 또는 `View` 렌더링
    ```tsx
    const Container = onPress ? Pressable : View;
    // Pressable: hitSlop={8}, onPress={onPress}
    // View: hitSlop 없음
    ```
  - 박스 style, Feather 아이콘 동일 유지
- 완료 조건: tsc 통과
- 검증 방법: `pnpm exec tsc --noEmit`

### Task 2 — SignupScreen AuthCheckbox onPress 제거

- 대상 파일: `src/screens/auth/SignupScreen.tsx`
- 변경 내용:
  - TermItem 컴포넌트(line ~424)의 `<AuthCheckbox onPress={...}>` → `<AuthCheckbox>`
  - "전체 동의" 행(line ~317)의 `<AuthCheckbox onPress={...}>` → `<AuthCheckbox>`
  - 부모 `Pressable`의 핸들러는 그대로 유지
- 완료 조건: tsc + lint 통과
- 검증 방법: `pnpm exec tsc --noEmit && pnpm lint`

### Task 3 — AuthInput `{...rest}` 순서 수정

- 대상 파일: `src/components/auth/AuthInput.tsx`
- 변경 내용:
  - `{...rest}`를 `onFocus`/`onBlur` 앞으로 이동
  - `onFocus`/`onBlur`에서 소비자 핸들러 체이닝:
    ```tsx
    onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
    onBlur={(e)  => { setFocused(false); rest.onBlur?.(e); }}
    ```
  - `style` prop은 마지막 유지
- 완료 조건: tsc + lint 통과
- 검증 방법: `pnpm exec tsc --noEmit && pnpm lint`

## 4) 검증 체크포인트

- [ ] `pnpm exec tsc --noEmit` 통과
- [ ] `pnpm lint` 통과
- [ ] TODO 수동: SignupScreen에서 약관 항목 탭 시 체크 토글 1회만 발생 확인

## 5) 롤백 계획

- 영향 파일:
  - `src/components/auth/AuthCheckbox.tsx`
  - `src/screens/auth/SignupScreen.tsx`
  - `src/components/auth/AuthInput.tsx`
- 되돌림 방법: `git restore src/components/auth/AuthCheckbox.tsx src/screens/auth/SignupScreen.tsx src/components/auth/AuthInput.tsx`
- 데이터 영향: 없음

## 6) PR 구성

- PR 제목: `fix(auth): AuthCheckbox onPress optional, AuthInput rest 순서 수정`
- 변경 요약: 이중 탭 이벤트 제거, AuthInput 외부 onFocus/onBlur 체이닝 지원
- 리뷰 요청 포인트: Pressable/View 조건부 렌더링 타입 호환성, onFocus 체이닝 동작
