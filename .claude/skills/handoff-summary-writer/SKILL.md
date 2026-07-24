# Handoff Summary Writer Skill

팀원 인수인계용 handoff 문서를 생성하는 스킬입니다.

## 목적

- 구현 완료 후 팀원 인수인계를 위한 표준 형식의 문서를 생성한다.
- 사람이 읽는 문서를 작성한다. AI 에이전트 핸드오프는 `04-agent-handoff-prompt-template.md`가 별도 담당한다.

## 입력

- spec 문서 (`docs/ai/specs/<branch>/<feature-name>.md`)
- plan 문서 (`docs/ai/plans/<branch>/<feature-name>-plan.md`)
- `git diff --stat HEAD` (변경 파일 목록 + 1줄 통계)
- `git log --oneline` (최근 커밋 이력)
- 사용자 제공 완료/잔여 태스크·리스크 정보

## 동작 규칙

1. spec, plan 두 문서 모두 존재해야 실행한다. 하나라도 없으면 오류 메시지와 함께 중단한다.
2. 완료/잔여 태스크는 사용자 입력을 우선으로 한다. AI 추론은 최소화한다.
3. `git diff --stat` 결과(변경 파일 목록 + 라인 통계)를 Scope Snapshot 섹션에 포함한다. 상세 diff 본문은 넣지 않는다.
4. git log는 보조 맥락으로만 사용하고, 내용을 요약할 때 과도하게 추론하지 않는다.
5. 구현 코드는 수정하지 않는다.
6. 산출물은 `docs/ai/handoffs/<feature-name>-handoff.md`에 저장한다.

## 출력 형식 (handoff 문서 섹션 순서)

1) Feature Summary
2) Scope Snapshot (In/Out + git diff --stat 요약)
3) Completed Tasks
4) Remaining Tasks
5) Risks & Open Decisions
6) Next Actions
