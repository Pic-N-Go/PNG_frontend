---
allowed-tools: Read, Write, Bash(git diff:*), Bash(git status:*), Bash(git ls-files:*), Bash(git branch:*), Bash(ls .claude/commands:*), Bash(ls .claude/skills:*), Bash(mkdir:*)
description: 변경 파일 기준으로 업데이트 필요 문서를 점검하고, 승인 시 자동 수정
---

## 참고 스킬

- `.claude/skills/doc-sync-checker/SKILL.md`

## Context

- 변경 파일 목록: !`git diff --name-only HEAD`
- Untracked 파일: !`git ls-files --others --exclude-standard`
- 현재 git 상태: !`git status`

## 실행 지침

1. `.claude/skills/doc-sync-checker/SKILL.md`를 Read해 매핑 규칙과 출력 포맷을 확인합니다.
2. Context의 변경 파일을 분류합니다.
   - `.claude/commands/` — 커맨드 변경
   - `.claude/skills/` — 스킬 변경
   - `src/` — 앱 코드 변경
   - `docs/`, `*.md` — 문서 변경
3. `src/` 변경이 없으면 src 매핑 규칙 행을 생략하고 "코드-문서 동기화 점검 생략 가능" 안내를 출력에 포함합니다.
4. 고정 점검 문서를 Read합니다.
   - 필수: `docs/ai/README.md`, `docs/ai/08-harness-self-audit-checklist.md`, `docs/ai-prompt-guide.md`, `CLAUDE.md`, `.github/CONVENTIONS.md`
   - 변경 파일에 feature 관련 spec/plan이 있으면 `git branch --show-current`로 브랜치명(`<branch>`)을 구해 해당 `docs/ai/specs/<branch>/`, `docs/ai/plans/<branch>/` 파일도 Read합니다.
5. `ls .claude/commands/`와 `ls .claude/skills/` 결과를 `docs/ai/README.md` 추가 커맨드 목록과 대조해 미등재 항목을 탐지합니다.
6. 매핑 규칙을 적용해 Required / Recommended 문서를 분류하고, 점검 문서 내 파일 경로 참조가 실제 존재하는지 확인합니다.
7. 4-section 리포트를 출력하고 수정 제안과 함께 사용자 승인을 요청합니다.
   - 승인 시 Write로 수정 실행 후 변경 파일 목록을 보고합니다.
   - `$ARGUMENTS`에 `--save`가 포함된 경우: 현재 브랜치명(`git branch --show-current`)을 확인하고, 브랜치명의 `/`를 `-`로 치환해 파일명을 생성합니다 (예: `feature/login` → `feature-login-sync.md`). Write 전에 `mkdir -p docs/ai/doc-sync-reports`를 실행해 디렉토리를 생성한 후 `docs/ai/doc-sync-reports/<sanitized-branch>-sync.md`에 리포트를 저장합니다. (`docs/ai/doc-sync-reports/`는 `.gitignore`에 포함되어 git 추적되지 않습니다 — 로컬 보관 전용)

## 출력 형식

1) Changed Files Summary
2) Docs To Update (Required / Recommended)
3) Missing Links or Broken References
4) Proposed Doc Patch Plan
