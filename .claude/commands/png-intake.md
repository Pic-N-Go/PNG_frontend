---
allowed-tools: Read, Write
description: PNG 프로젝트 요구사항을 질문 기반으로 정제해 spec/plan 초안 생성
---

## 참고 스킬

- `.claude/skills/requirements-refiner/SKILL.md`

## 실행 지침

아래 순서대로 Intake만 수행합니다.

1. 먼저 다음 문서를 읽고 제약을 반영합니다.
   - `docs/ai/00-context.md`
   - `docs/ai/05-intake-workflow.md`
   - `docs/ai/01-feature-spec-template.md`
   - `docs/ai/02-implementation-plan-template.md`
   - `docs/ui-publishing.md` (필요 시)
2. 사용자의 자연어 설명을 바탕으로 질문 5~8개를 우선순위 순서로 제시합니다.
3. 답변을 반영해 `In Scope/Out of Scope`, `AC`, `Open Decisions`를 정리합니다.
4. 다음 산출물을 작성합니다.
   - `docs/ai/specs/<feature-name>.md`
   - `docs/ai/plans/<feature-name>-plan.md`
5. 구현 코드는 작성하지 않고, 문서 검토 요청으로 마무리합니다.

## 출력 형식

1) Clarifying Questions  
2) Draft Scope (In/Out)  
3) Spec Draft Summary  
4) Plan Draft Summary  
5) Open Decisions
