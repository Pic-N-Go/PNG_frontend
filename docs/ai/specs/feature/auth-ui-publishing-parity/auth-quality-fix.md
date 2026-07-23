# 기능 스펙 — auth-quality-fix

## 1) 기능 정보

- 기능명: Auth 코드 품질 수정 (3건)
- 담당자: @yeni
- 관련 이슈: 없음 (코드 리뷰 후속 수정)
- 대상 플랫폼: iOS / Android

## 2) 문제와 목표

- 해결하려는 문제:
  1. `LoginScreen`의 `timerRef` interval이 컴포넌트 unmount 시 정리되지 않아 메모리 누수 발생 가능
  2. `SignupScreen`과 `OnboardingScreen`에 동일한 `THEMES` 배열이 복붙되어 유지보수 불일치 위험
  3. `AuthCheckbox`의 체크마크 `✓` 문자가 Android 폰트에 따라 렌더링이 달라질 수 있음
- 사용자 가치: 안정적인 동작(메모리 누수 없음), 일관된 체크박스 렌더링
- 완료 기준(한 줄): 3개 파일/코드 수정 후 tsc + lint 통과

## 3) 범위

- 포함(In Scope):
  - `LoginScreen.tsx` — `useEffect` unmount cleanup 추가
  - `src/constants/themes.ts` 신규 생성 및 `SignupScreen`, `OnboardingScreen`에서 import
  - `AuthCheckbox.tsx` — `<Text>✓</Text>` → `<Feather name="check" />` 교체
- 제외(Out of Scope):
  - 신규 기능 추가
  - 다른 화면 스타일 변경
  - API 연동

## 4) 사용자 시나리오

- 시나리오 A (타이머 누수):
  - Given: 사용자가 비밀번호 찾기 시트를 열고 인증코드 발송
  - When: 타이머 도중 뒤로가기로 LoginScreen을 떠남
  - Then: interval이 즉시 정리되어 setState 경고 없음

- 시나리오 B (체크박스):
  - Given: Android 기기에서 회원가입 화면 진입
  - When: 약관 동의 체크박스를 탭
  - Then: Feather 아이콘으로 일관된 체크마크 표시

## 5) UI/UX 요구사항

- 참조 목업 파일: 없음 (코드 수정만)
- 화면 전환 규칙: 변경 없음
- 빈 상태/에러 상태: 변경 없음

## 6) 데이터/API 요구사항

- 없음

## 7) 상태 관리

- 변경 없음

## 8) 기술 제약 체크

- [x] NativeWind `className`만 사용 (변경 없음)
- [x] `StyleSheet.create()` 미사용
- [x] `@/` alias 사용
- [x] 타입 정의 명확
- [x] 디자인 토큰 준수

## 9) 수용 기준 (Acceptance Criteria)

- [ ] AC1: `LoginScreen` 언마운트 시 setInterval이 즉시 정리된다
- [ ] AC2: `THEMES`가 `src/constants/themes.ts` 단일 출처에서 export되며, SignupScreen·OnboardingScreen 모두 해당 파일에서 import한다
- [ ] AC3: `AuthCheckbox` 체크마크가 `<Feather name="check" />`로 렌더링되며 `<Text>✓</Text>`가 제거된다
- [ ] AC4: `pnpm exec tsc --noEmit` 및 `pnpm lint` 오류 없음

## 10) 테스트 시나리오

- 정상 케이스: 비밀번호 찾기 시트 열기 → 타이머 도중 닫기 → 경고 없음
- 경계 케이스: Android에서 체크박스 탭 → Feather 아이콘 정상 표시
- 실패 케이스: tsc/lint 오류 없어야 함

## 11) 오픈 이슈 / 결정 필요

- 없음 (모든 수정 내용이 구체적으로 명시됨)
