# Non-Claude Quickstart

Copilot/GPT/Cursor 등 **클로드가 아닌 에이전트**를 사용할 때의 공용 시작 가이드입니다.

핵심 원칙:

- 도구는 달라도 산출물 포맷은 동일하게 유지
- 구현 전에 Intake(요구사항 정제)부터 진행
- `spec`/`plan` 승인 후 구현 시작

---

## 1) 시작 전 읽을 문서

아래 5개를 먼저 읽고 시작합니다.

1. `docs/ai/README.md`
2. `docs/ai/00-context.md`
3. `docs/ai/05-intake-workflow.md`
4. `docs/ai/01-feature-spec-template.md`
5. `docs/ai/02-implementation-plan-template.md`

UI 기능이면 추가로:

- `docs/ui-publishing.md`

---

## 2) Intake 시작 프롬프트 (복붙용)

```md
코드 수정은 하지 말고 Intake(요구사항 정제)만 먼저 진행해줘.

먼저 아래 문서를 읽고 반영해:
- docs/ai/00-context.md
- docs/ai/05-intake-workflow.md
- docs/ai/01-feature-spec-template.md
- docs/ai/02-implementation-plan-template.md
- docs/ui-publishing.md (UI 작업이면)

내가 만들 기능 설명:
[자연어 설명]

요청:
1) Clarifying Questions (5~8개)
2) Draft Scope (In/Out)
3) Spec Draft Summary (AC 3개 이상 포함)
4) Plan Draft Summary
5) Open Decisions

추가 조건:
- 아래 산출물 초안을 반드시 작성
  - docs/ai/specs/<feature-name>.md
  - docs/ai/plans/<feature-name>-plan.md
- 구현 코드는 아직 작성하지 않음
```

---

## 3) 구현 단계 핸드오프

Intake 완료 후 아래 문구로 구현을 시작합니다.

```md
이제 구현 단계로 진행해줘.

반드시 아래 문서를 기준으로 작업해:
- docs/ai/00-context.md
- docs/ai/specs/<feature-name>.md
- docs/ai/plans/<feature-name>-plan.md
- docs/ai/04-agent-handoff-prompt-template.md

요청:
- plan의 Task 순서대로 구현
- 변경 파일 목록을 먼저 제시
- 완료 후 검증 결과 보고
  - tsc:
  - lint:
  - 수동 테스트:
  - 남은 리스크:
```

---

## 4) PR 전 체크

- `docs/ai/03-pr-review-checklist.md` 통과
- 필요 시 `docs/ai/08-harness-self-audit-checklist.md`로 하네스 문서 자체 점검

---

## 5) 자주 하는 실수

- Intake 없이 바로 코드 생성 시작
- `spec` 없이 `plan` 먼저 작성
- 팀 표준(`docs/ai/README.md`) 대신 개인 보조 문서만 참조
- 산출물 경로를 팀 규칙과 다르게 생성

---

## 관련 문서

- 팀 표준: `docs/ai/README.md`
- 개인 보조 프롬프트: `docs/ai-prompt-guide.md`
- 클로드 전용 시작: `docs/ai/06-claude-intake-starter-prompt.md`
