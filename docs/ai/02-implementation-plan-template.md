# 구현 계획 템플릿

아래 템플릿을 복사해서 `docs/ai/plans/<feature-name>-plan.md`로 저장해 사용합니다.

---

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/...`
- 관련 목업: `src/components/ui/...`
- 완료 목표:

## 2) 구현 전략

- 핵심 접근:
- 리스크:
- 리스크 완화:

## 3) 작업 태스크 (작게 분할)

> 각 태스크는 30~90분 내 완료 가능 크기로 유지
> 단순 기능은 필요한 개수만 사용하고, 불필요한 Task 섹션은 삭제해도 됩니다.

### Task 1 - 타입/계약 정리

- 대상 파일:
  - `src/types/...`
  - `src/api/...`
- 변경 내용:
- 완료 조건:
- 검증 방법:

### Task 2 - API/Hook 연결

- 대상 파일:
  - `src/api/...`
  - `src/hooks/...`
- 변경 내용:
- 완료 조건:
- 검증 방법:

### Task 3 - Screen/UI 구현

- 대상 파일:
  - `src/screens/...`
  - `src/components/...` (필요 시)
- 변경 내용:
- 완료 조건:
- 검증 방법:

### Task 4 - 네비게이션/상태 마무리

- 대상 파일:
  - `src/navigation/...`
  - `src/store/...` (필요 시)
- 변경 내용:
- 완료 조건:
- 검증 방법:

## 4) 검증 체크포인트

- [ ] Type check 통과 (`pnpm exec tsc --noEmit`)
- [ ] Lint 통과 (`pnpm lint`)
- [ ] 주요 사용자 시나리오 수동 검증
- [ ] 회귀 영향 범위 점검

## 5) 롤백 계획

- 영향 파일:
- 되돌림 방법:
- 데이터 영향:

## 6) PR 구성

- PR 제목(컨벤션):
- 변경 요약(3줄 이내):
- 리뷰 요청 포인트:

---

## 작성 시 참고 문서

- 스펙 템플릿: `docs/ai/01-feature-spec-template.md`
- 리뷰 기준: `docs/ai/03-pr-review-checklist.md`
- 브랜치/PR 규칙: `.github/CONVENTIONS.md`
- 자동화 동작/CI 대응: `docs/guide/ops/github-actions-guide.md`
