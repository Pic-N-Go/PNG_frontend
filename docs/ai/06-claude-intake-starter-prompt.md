# Claude Intake 시작 프롬프트

> Claude Code 사용자는 `/png-intake`를 입력하면 Intake → 구현 → 커밋 → PR 초안까지 자동으로 실행됩니다.
> 이 문서는 **Intake만 수동으로 실행**하고 싶을 때 사용하는 대체 경로입니다.

아래 프롬프트를 클로드 대화에 그대로 붙여넣으면, 구현 전에 요구사항 정제(Intake)만 수행합니다.

---

```md
지금부터는 코드 수정하지 말고 Intake(요구사항 정제)만 수행해줘.

먼저 아래 문서를 읽고 규칙을 반영해:
- docs/ai/00-context.md
- docs/ai/05-intake-workflow.md
- docs/ai/01-feature-spec-template.md
- docs/ai/02-implementation-plan-template.md
- docs/ui-publishing.md

내가 설명하는 기능:
[여기에 자연어로 기능 설명]

목표:
- 내 설명을 바탕으로 부족한 정보를 질문으로 먼저 정리
- 답변을 반영해서 아래 산출물을 작성
  1) docs/ai/specs/<feature-name>.md
  2) docs/ai/plans/<feature-name>-plan.md

반드시 지켜줘:
- 질문은 우선순위 높은 것부터 5~8개만
- In Scope / Out of Scope를 분리
- 수용 기준(AC) 최소 3개 작성
- 구현 코드는 아직 작성하지 않음

출력 형식:
1) Clarifying Questions
2) Draft Scope (In/Out)
3) Spec Draft Summary
4) Plan Draft Summary
5) Open Decisions
```

---

## 사용 팁

- 팀원이 비클로드 AI를 사용하더라도, 동일한 문구로 시작해 `spec`/`plan` 산출물만 맞추면 됩니다.
- 첫 실행에서는 기능 하나만 대상으로 테스트하는 것을 권장합니다.

---

## 관련 문서

- 팀 표준: `docs/ai/README.md`
- Intake 절차: `docs/ai/05-intake-workflow.md`
- 스펙 템플릿: `docs/ai/01-feature-spec-template.md`
- 계획 템플릿: `docs/ai/02-implementation-plan-template.md`
