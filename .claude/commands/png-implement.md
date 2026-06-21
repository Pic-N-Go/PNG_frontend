---
allowed-tools: Read, Write, Edit, Bash(pnpm exec tsc:*), Bash(pnpm lint:*), Bash(git diff:*), Bash(git status:*), Bash(git branch:*), Bash(ls docs/ai/plans:*)
description: plan Task Breakdown 기준으로 step-by-step 코드 구현
---

## 참고 스킬

- `.claude/skills/task-executor/SKILL.md`

## Context

- 현재 git 상태: !`git status`
- 변경 내용: !`git diff HEAD`

## 실행 지침

1. `.claude/skills/task-executor/SKILL.md`를 Read해 동작 규칙과 보고 포맷을 확인합니다.
2. feature-name을 확정합니다.
   - `$ARGUMENTS`가 있으면 그 값을 feature-name으로 사용합니다.
     (`../` 포함 시 즉시 거부, `/`는 `-`로 치환, `.md` 확장자 포함 시 제거)
   - 없으면 `git branch --show-current`로 브랜치명(`<branch>`)을 구해 `ls docs/ai/plans/<branch>/`로 목록을 표시하고 사용자에게 선택을 요청합니다.
3. `git branch --show-current`로 현재 브랜치명(`<branch>`)을 구한 뒤 아래 문서를 Read합니다.
   - `docs/ai/plans/<branch>/<feature-name>-plan.md` (필수)
   - `docs/ai/specs/<branch>/<feature-name>.md` (필수)
   - `CLAUDE.md`
   - plan 또는 spec 파일이 없으면 즉시 중단하고 어떤 파일이 없는지 알립니다.
4. Task 목록을 표시하고 시작 Task 번호를 확인합니다.
   - 기본값은 1이며, 사용자가 다른 번호를 입력할 수 있습니다.
5. 지정된 Task부터 순차 실행합니다.
   각 Task마다:
   a. 대상 파일이 있으면 Read합니다.
   b. CLAUDE.md 규칙을 준수해 코드를 작성합니다 (Write/Edit).
   c. `pnpm exec tsc --noEmit`를 실행합니다. 오류 시 즉시 수정합니다.
   d. `pnpm lint`를 실행합니다. 오류 시 즉시 수정합니다.
   e. 수동 검증 항목은 `TODO: <항목>` 형식으로 표시합니다.
   f. CLAUDE.md 위반 사항(StyleSheet.create() 사용 여부, 상대경로 import, any 타입, 디자인 토큰)을 자체 점검합니다.
   g. `✅ Task N 완료 — [변경 파일명]` 을 출력하고 **사용자 확인 없이** 다음 Task로 자동 진행합니다.
      사용자가 중단을 요청하면 step 7 중단 흐름으로 이동합니다.
6. Plan에 없는 파일 변경이 필요하면:
   - 변경 이유, plan 수정 내용, 구현 내용을 동시에 제안합니다.
   - 승인 시에만 plan Write + 코드 Write/Edit를 실행합니다.
   - 거부 시 현재 Task 범위 내에서 재접근합니다.
7. 사용자가 중단을 요청하면:
   - 변경 파일을 그대로 유지합니다.
   - 중단 시점 Task, 변경 파일 목록, `git restore` 명령어를 안내합니다.
8. 전체 완료 후 4-section 보고를 출력하고 `/png-test-case`, `/png-handoff`, `/png-pr` 실행을 안내합니다.

## 출력 형식

1) Changed Files Summary
2) Task Completion Status
3) Verification Results
4) Remaining Risks
