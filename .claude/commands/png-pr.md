---
allowed-tools: Read, Write, Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git ls-files:*), Bash(ls .claude/commands:*), Bash(ls .claude/skills:*)
description: PNG 프로젝트 PR 제목/본문 초안을 템플릿 형식으로 파일 생성
---

## 참고 스킬

- `.claude/skills/pr-draft-writer/SKILL.md`

## Context

- PR 템플릿: `.github/pull_request_template.md`
- 현재 git 상태: !`git status`
- 변경 내용 (staged + unstaged): !`git diff HEAD`
- 최근 커밋 이력: !`git log --oneline -10`
- 현재 브랜치: !`git branch --show-current`

## 실행 지침

0. 사전 점검 (Preflight — 문서 동기화):
   > 문서 동기화 판단 기준은 `.claude/skills/doc-sync-checker/SKILL.md`를 단일 기준(Source of Truth)으로 따릅니다.
   - `.claude/skills/doc-sync-checker/SKILL.md`를 Read해 매핑 규칙을 확인합니다.
   - 변경 파일(`git diff --name-only HEAD` + untracked)과 매핑 규칙을 대조해 Required 문서 누락 항목을 탐지합니다.
   - Required 항목이 있으면 수정 내용을 사용자에게 제시하고 **승인을 받은 후에만** Write로 수정을 실행합니다.
   - 거부 시 preflight 결과만 기록하고 PR 초안 생성을 계속합니다.
   - 결과를 기록합니다: Required 항목 목록 또는 "None".
1. `.claude/skills/pr-draft-writer/SKILL.md`를 Read해 기준을 확인합니다.
2. `.github/pull_request_template.md`를 읽고 동일한 섹션 구조로 PR 초안을 작성합니다.
3. 파일 경로를 결정합니다.
   - `$ARGUMENTS`가 있으면 아래 정규화 규칙을 적용합니다.
     - `../`가 포함된 경우: 즉시 거부하고 사용자에게 알립니다.
     - `/`는 `-`로 치환합니다.
     - `.md` 확장자가 포함된 경우 제거합니다.
     - 최종 경로: `docs/ai/pr-drafts/<정규화된-이름>.md`
   - 없으면: `docs/ai/pr-drafts/<current-branch>-pr.md` (`/`는 `-`로 치환)
4. 불확실한 정보는 `TODO:`로 명시합니다.
5. 실제 PR 생성(`gh pr create`)은 하지 않고, 파일 생성으로 종료합니다.
6. 생성 후 삭제가 필요하면 `/png-pr-clean <파일명 또는 경로>`를 안내합니다.

## 출력 형식

0) Doc Sync Result (Required / Recommended / None)  
1) Draft Title  
2) Draft File Path  
3) Filled Sections Summary  
4) Remaining TODOs
