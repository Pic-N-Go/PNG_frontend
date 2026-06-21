# 기능 스펙 — auth-component-props-fix

## 1) 기능 정보

- 기능명: Auth 공통 컴포넌트 Props 수정 (2건)
- 담당자: @yeni
- 관련 이슈: 없음 (코드 품질 개선)
- 대상 플랫폼: iOS / Android

## 2) 문제와 목표

- 해결하려는 문제:
  1. `AuthCheckbox.onPress`가 required라 읽기 전용(표시 목적) 체크박스에도 빈 핸들러를 전달해야 함. `SignupScreen`의 `TermItem`·전체동의 행은 부모 `Pressable`이 이미 동일 핸들러를 가지고 있어 이중 탭 이벤트 발생
  2. `AuthInput`의 `{...rest}` 위치가 `onFocus`/`onBlur` 뒤에 있어 외부에서 전달한 `onFocus`/`onBlur`가 내부 focus 상태 관리를 덮어씀
- 사용자 가치: 이중 탭 제거, AuthInput에 onFocus/onBlur를 전달하는 호출부 지원
- 완료 기준(한 줄): 3개 파일 수정 후 tsc + lint 통과

## 3) 범위

- 포함(In Scope):
  - `AuthCheckbox.tsx` — `onPress?: () => void` optional + Pressable/View 조건부 렌더링
  - `SignupScreen.tsx` — TermItem·전체동의 행의 `AuthCheckbox`에서 `onPress` prop 제거
  - `AuthInput.tsx` — `{...rest}` 를 `onFocus`/`onBlur` 앞으로 이동, 소비자 핸들러 체이닝 추가
- 제외(Out of Scope):
  - 신규 기능 추가
  - 다른 컴포넌트 변경

## 4) 사용자 시나리오

- 시나리오 A (AuthCheckbox):
  - Given: SignupScreen의 약관 항목 체크박스
  - When: 사용자가 약관 행(부모 Pressable) 탭
  - Then: 핸들러가 1회만 실행됨 (이중 발생 없음)

- 시나리오 B (AuthInput):
  - Given: 호출부에서 `onFocus` 콜백을 AuthInput에 전달
  - When: 사용자가 인풋을 포커스
  - Then: 내부 focus 상태 + 외부 `onFocus` 콜백 모두 실행됨

## 5) UI/UX 요구사항

- 참조 목업 파일: 없음 (로직 수정만)
- 박스 스타일, 아이콘 내용은 변경 없음

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

- [ ] AC1: `AuthCheckbox`의 `onPress` prop이 optional이고, 없을 경우 `View`로 렌더링됨 (`hitSlop` 없음)
- [ ] AC2: `SignupScreen`의 TermItem·전체동의 행 `AuthCheckbox`에 `onPress` prop이 없음
- [ ] AC3: `AuthInput`의 `{...rest}`가 `onFocus`/`onBlur` 앞에 위치하며, 내부 state + 외부 핸들러가 모두 호출됨
- [ ] AC4: `pnpm exec tsc --noEmit` 및 `pnpm lint` 오류 없음

## 10) 테스트 시나리오

- 정상 케이스: 약관 행 탭 → 체크 토글 1회만 발생
- 경계 케이스: `onPress` 미전달 AuthCheckbox → View 렌더링, 탭 반응 없음
- 실패 케이스: tsc 오류 없어야 함

## 11) 오픈 이슈 / 결정 필요

- 없음
