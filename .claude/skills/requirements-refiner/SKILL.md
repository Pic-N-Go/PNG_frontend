# Requirements Refiner Skill

자연어 요구사항을 구현 가능한 스펙/계획 문서로 정제하는 스킬입니다.

## 목적

- 개발자 설명을 구조화한다.
- 모호한 요구를 질문으로 분리한다.
- 코드 변경 전 `spec`/`plan`을 먼저 확정한다.

## 입력

- 기능 설명 (자연어)
- 필요 시 참고 화면/파일

## 동작 규칙

1. 구현/코드 수정은 하지 않는다.
2. 먼저 Clarifying Questions 5~8개를 우선순위 순으로 제시한다.
3. 답변을 반영해 아래를 정리한다.
   - In Scope / Out of Scope
   - 수용 기준(AC) 3개 이상
   - 오픈 이슈/결정 필요 항목
4. 아래 산출물을 생성/갱신한다.
   - `docs/ai/specs/<branch>/<feature-name>.md`
   - `docs/ai/plans/<branch>/<feature-name>-plan.md`

## 필수 참고 문서

- `docs/ai/00-context.md`
- `docs/ai/05-intake-workflow.md`
- `docs/ai/01-feature-spec-template.md`
- `docs/ai/02-implementation-plan-template.md`
- `docs/guide/dev/ui-publishing.md` (UI 변경 시)
