---
allowed-tools: Read, Write, Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git ls-files:*), Bash(git rev-parse:*), Bash(git push:*), Bash(gh pr create:*), Bash(rm -- docs/ai/pr-drafts/*), Bash(ls .claude/commands:*), Bash(ls .claude/skills:*)
description: PNG 프로젝트 PR 제목/본문 초안을 생성하고, 승인 시 현재 브랜치에 PR을 생성
---

## 참고 스킬

- `.claude/skills/pr-draft-writer/SKILL.md`

## Context

- PR 템플릿: `.github/pull_request_template.md`
- 현재 git 상태: !`git status`
- 변경 내용 (staged + unstaged): !`git diff HEAD`
- 최근 커밋 이력: !`git log --oneline -10`
- 현재 브랜치: !`git branch --show-current`
- 원격 추적 브랜치: !`git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>&1 || echo "(없음)"`

## 실행 지침

0. 사전 점검 (Preflight — 문서 동기화):
   > 문서 동기화 판단 기준은 `.claude/skills/doc-sync-checker/SKILL.md`를 단일 기준(Source of Truth)으로 따릅니다.
   - `.claude/skills/doc-sync-checker/SKILL.md`를 Read해 매핑 규칙을 확인합니다.
   - 변경 파일(`git diff --name-only HEAD` + untracked)과 매핑 규칙을 대조해 Required 문서 누락 항목을 탐지합니다.
   - Required 항목이 있으면 수정 내용을 사용자에게 제시하고 **승인을 받은 후에만** Write로 수정을 실행합니다.
   - 거부 시 preflight 결과만 기록하고 PR 초안 생성을 계속합니다.
   - 결과를 기록합니다: Required 항목 목록 또는 "None".
1. `.claude/skills/pr-draft-writer/SKILL.md`를 Read해 기준을 확인합니다.
2. `.github/pull_request_template.md`를 읽고 동일한 섹션 구조로 PR 제목/본문 초안을 작성합니다. 해당 없는 섹션(예: UI 변경 없을 때 스크린샷)은 삭제합니다.
3. 불확실한 정보는 `TODO:`로 명시합니다.
4. 작성한 제목과 본문 전체를 사용자에게 그대로 보여주고 승인 여부를 확인합니다. 이 시점까지는 어떤 파일도 생성/push하지 않습니다.
5. 사용자 응답에 따라 분기합니다.
   - **승인**: 원격 추적 브랜치가 없으면 `git push -u origin "<current-branch>"`, 있으면 로컬이 앞서 있는지 확인 후 필요 시 `git push`. 이후 승인된 본문을 `docs/ai/pr-drafts/<current-branch>-pr.md`(`/`는 `-`로 치환)에 Write로 저장하고, `gh pr create --title "<제목>" --body-file "docs/ai/pr-drafts/<정규화된-current-branch>-pr.md" --base main --head "<current-branch>"` 로 PR을 생성한 뒤 결과 URL을 보고합니다. 본문에 백틱·`$()`·따옴표·줄바꿈이 있어도 셸이 해석하지 못하도록 `--body`가 아닌 `--body-file`을 사용하고, 브랜치명도 따옴표로 감쌉니다.
   - **수정 요청**: 요청 반영 후 4번부터 다시 확인받습니다.
   - **보류(파일로만 남기기)**: 아래 규칙으로 파일 경로를 정해 Write로 저장하고 종료합니다 (PR 생성 없음).
     - `$ARGUMENTS`가 있으면: `../` 포함 시 거부, `/`는 `-`로 치환, `.md` 제거 후 `docs/ai/pr-drafts/<정규화된-이름>.md`
     - 없으면: `docs/ai/pr-drafts/<current-branch>-pr.md` (`/`는 `-`로 치환)
     - 삭제가 필요해지면 `/png-pr-clean <파일명 또는 경로>`를 안내합니다.
6. 승인 후 `gh pr create`가 성공했다면, 5번에서 `--body-file` 용으로 저장한 초안 파일과 이전 실행에서 보류로 남았던 동일 브랜치 초안 파일이 있으면 `rm -- docs/ai/pr-drafts/<해당 파일>` 로 정리합니다 (PR이 최신 기록이므로 중복 파일을 남기지 않음).

## 출력 형식

0) Doc Sync Result (Required / Recommended / None)
1) Draft Title
2) Draft Body (승인 요청용 전체 본문)
3) 승인 여부 확인 결과
4) (승인 시) 생성된 PR URL / (보류 시) 저장된 Draft File Path
5) Remaining TODOs
