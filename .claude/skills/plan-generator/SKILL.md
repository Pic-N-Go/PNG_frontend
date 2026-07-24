# Plan Generator Skill

확정된 스펙 문서를 기반으로 구현 계획 문서를 생성/보정하는 스킬입니다.

## 목적

- `spec -> plan` 전환 품질을 팀 기준으로 통일한다.
- 태스크를 30~90분 단위로 분해해 실행 가능성을 높인다.

## 입력

- 스펙 문서 경로 (`docs/ai/specs/<branch>/<feature-name>.md`)
- 필요 시 참고 목업/화면 경로

## 동작 규칙

1. 먼저 아래 문서를 읽고 제약을 반영한다.
   - `docs/ai/00-context.md`
   - `docs/ai/01-feature-spec-template.md`
   - `docs/ai/02-implementation-plan-template.md`
   - `docs/ai/03-pr-review-checklist.md`
   - `docs/guide/dev/ui-publishing.md` (UI 변경 시)
2. 스펙의 In Scope / AC / 시나리오를 기준으로 plan 태스크를 구성한다.
3. 각 태스크에 아래 4가지를 반드시 포함한다.
   - 대상 파일
   - 변경 내용
   - 완료 조건
   - 검증 방법
4. 태스크 수는 기능 크기에 맞게 조절하고, 불필요한 빈 섹션은 제거한다.
5. 최종 plan에는 `tsc`, `lint`, 수동 검증 체크를 포함한다.

## 출력 형식

1) Spec Summary  
2) 구현 전략 (핵심 접근 / 리스크 / 완화)  
3) Task Breakdown (30~90분 단위)  
4) Verification Plan  
5) Risks & Rollback  
6) PR 구성 (제목 컨벤션 / 변경 요약 / 리뷰 포인트)  
7) Plan File Path (`docs/ai/plans/<branch>/<feature-name>-plan.md`)
