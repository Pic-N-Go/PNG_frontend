# PR 리뷰 체크리스트 (AI 협업 공통)

PR 생성 전/리뷰 시 아래 항목을 확인합니다.

---

## 1) 스펙 정합성

- [ ] 스펙 문서의 In Scope만 구현했는가
- [ ] 수용 기준(AC)을 모두 만족하는가
- [ ] 임의 기능 추가/변경이 없는가

## 2) 아키텍처/구조

- [ ] `src/api/`는 순수 API 함수만 포함하는가
- [ ] 서버 상태는 TanStack Query로 처리했는가
- [ ] 클라이언트 상태는 Zustand에만 두었는가
- [ ] import는 `@/` alias를 일관되게 사용했는가

## 3) UI/디자인 규칙

- [ ] NativeWind `className`만 사용했는가
- [ ] `StyleSheet.create()`를 사용하지 않았는가
- [ ] 디자인 토큰(색상, 52px 버튼, 간격)을 준수했는가
- [ ] HTML 목업과 핵심 구조/흐름이 일치하는가

## 4) 안정성/예외처리

- [ ] 로딩/에러/빈 상태를 처리했는가
- [ ] API 실패 시 사용자 메시지가 적절한가
- [ ] null/undefined 경계 처리가 되어 있는가

## 5) 품질 게이트

- [ ] `pnpm exec tsc --noEmit` 통과
- [ ] `pnpm lint` 통과
- [ ] 주요 시나리오 수동 검증 완료

## 6) 협업 관점

- [ ] PR 설명이 문제/해결/검증을 명확히 담고 있는가
- [ ] 다음 작업자가 이어받을 정보가 충분한가
- [ ] 문서(`docs/ai/specs`, `docs/ai/plans`)가 최신인가

---

## 리뷰 시 참고 문서

- PR/브랜치 네이밍 규칙: `.github/CONVENTIONS.md`
- 자동화/CI 동작: `docs/github-actions-guide.md`
- 기능 스펙: `docs/ai/specs/<branch>/<feature>.md`
- 구현 계획: `docs/ai/plans/<branch>/<feature>-plan.md`
