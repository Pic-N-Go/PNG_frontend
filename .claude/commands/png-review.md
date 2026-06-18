---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git ls-files:*), Read
description: PNG 프로젝트 변경사항을 팀 규칙 기준으로 리뷰
---

## 참고 스킬

- `.claude/skills/review-standards/SKILL.md`

## Context

- 현재 git 상태: !`git status`
- 변경 내용 (staged + unstaged): !`git diff HEAD`
- 신규 파일 목록 (untracked): !`git ls-files --others --exclude-standard`
- 최근 커밋 이력: !`git log --oneline -10`

## 리뷰 기준 문서

- `CLAUDE.md`
- `docs/ai/03-pr-review-checklist.md`
- `.github/CONVENTIONS.md`
- `docs/ui-publishing.md` (UI 변경 시)
- `docs/device-support.md` (레이아웃 변경 시)

## 실행 지침

0. `.claude/skills/review-standards/SKILL.md`를 Read해 심각도 기준을 확인합니다.
1. 변경사항을 기준 문서와 대조해 이슈를 찾습니다.
2. 감상평보다 리스크 중심으로 작성합니다.
3. 각 이슈에 파일 경로, 리스크, 수정 제안을 포함합니다.
4. 이슈가 없으면 "주요 이슈 없음"과 잔여 테스트 공백을 보고합니다.
5. `$ARGUMENTS`가 있으면 해당 파일/관점만을 리뷰 범위로 한정합니다. 없으면 전체 diff와 untracked 파일 전체를 대상으로 합니다.
6. untracked 파일이 있으면 Read 도구로 내용을 확인한 후 리뷰에 포함합니다.

## 출력 형식

1) Critical  
2) Major  
3) Minor  
4) Open Questions  
5) Quick Wins  
6) Final Assessment (배포 가능/보완 필요)

각 이슈 항목은 아래 4가지를 반드시 포함합니다.

- 파일 경로
- 문제 설명
- 실제 리스크
- 수정 제안
