# 구현 계획 — auth-quality-fix

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/feature/auth-ui-publishing-parity/auth-quality-fix.md`
- 관련 목업: 없음
- 완료 목표: 3개 코드 품질 이슈 수정 + tsc/lint 통과

## 2) 구현 전략

- 핵심 접근: 파일별 독립 수정 (상호 의존성 없음), 각 Task 후 tsc 검증
- 리스크: `AuthCheckbox`에서 `Text` import 미제거 시 lint unused import 경고
- 리스크 완화: `<Text>✓</Text>` 제거 시 `Text` import도 함께 제거 확인

## 3) Task Breakdown

### Task 1 — THEMES 상수 분리

- 대상 파일:
  - `src/constants/themes.ts` (신규)
  - `src/screens/auth/SignupScreen.tsx`
  - `src/screens/auth/OnboardingScreen.tsx`
- 변경 내용:
  - `src/constants/themes.ts` 생성: `export const THEMES = [...]`
  - `SignupScreen.tsx`: 인라인 `THEMES` 상수 제거, `@/constants/themes` import 추가
  - `OnboardingScreen.tsx`: 인라인 `THEMES` 상수 제거, `@/constants/themes` import 추가
- 완료 조건: 두 화면 모두 동일 THEMES 소스 참조, tsc 통과
- 검증 방법: `pnpm exec tsc --noEmit`

### Task 2 — AuthCheckbox 체크마크 교체

- 대상 파일:
  - `src/components/auth/AuthCheckbox.tsx`
- 변경 내용:
  - `<Text>✓</Text>` → `<Feather name="check" size={size === 'sm' ? 10 : 12} color="#fff" />`
  - `Text` import 제거, `Feather` import 추가 (`@expo/vector-icons`)
- 완료 조건: Text 미사용 import 없음, tsc 통과
- 검증 방법: `pnpm exec tsc --noEmit`

### Task 3 — LoginScreen timerRef unmount cleanup

- 대상 파일:
  - `src/screens/auth/LoginScreen.tsx`
- 변경 내용:
  - `useEffect` cleanup 추가:
    ```tsx
    useEffect(() => {
      return () => { clearInterval(timerRef.current ?? undefined); };
    }, []);
    ```
  - `useEffect`가 이미 import됐는지 확인 (이미 있으면 추가 불필요)
- 완료 조건: unmount 시 interval 정리 보장, tsc 통과
- 검증 방법: `pnpm exec tsc --noEmit`, `pnpm lint`

## 4) 검증 체크포인트

- [ ] `pnpm exec tsc --noEmit` 통과
- [ ] `pnpm lint` 통과
- [ ] TODO 수동: Android 에뮬레이터에서 AuthCheckbox 체크마크 렌더링 확인

## 5) 롤백 계획

- 영향 파일:
  - `src/screens/auth/LoginScreen.tsx`
  - `src/screens/auth/SignupScreen.tsx`
  - `src/screens/auth/OnboardingScreen.tsx`
  - `src/components/auth/AuthCheckbox.tsx`
  - `src/constants/themes.ts` (신규)
- 되돌림 방법: `git restore src/screens/auth/LoginScreen.tsx src/screens/auth/SignupScreen.tsx src/screens/auth/OnboardingScreen.tsx src/components/auth/AuthCheckbox.tsx && git rm src/constants/themes.ts`
- 데이터 영향: 없음

## 6) PR 구성

- PR 제목: `fix(auth): timerRef cleanup·THEMES 상수 분리·AuthCheckbox 아이콘 교체`
- 변경 요약: 코드 리뷰 후속 3건 수정 — 메모리 누수 방지, 상수 중복 제거, Android 아이콘 일관성
- 리뷰 요청 포인트: useEffect dependency array 확인, Feather icon 크기 적절성
