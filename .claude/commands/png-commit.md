---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*)
description: PNG 프로젝트 변경사항을 분석해 한국어 커밋 메시지 제안 후 커밋
---

## 참고 스킬

- `.claude/skills/git-message-helper/SKILL.md`

## Context

- 커밋/PR 컨벤션 문서: `.github/CONVENTIONS.md`
- 현재 git 상태: !`git status`
- 변경 내용 (staged + unstaged): !`git diff HEAD`
- 현재 브랜치: !`git branch --show-current`
- 최근 커밋 이력: !`git log --oneline -10`

## 진행 순서

1. 변경사항을 분석해 커밋 메시지 초안을 **제안만** 한다 (커밋 X)
2. 사용자에게 아래 형식으로 확인을 요청한다:

```
커밋 메시지 초안:
  feat: (작업 내용)

이대로 커밋할까요? 수정이 필요하면 알려주세요.
```

3. 사용자가 승인하면 그때 `git add .` + `git commit` 실행
4. push는 하지 않는다
5. `.env`, `.env.local` 등 민감한 파일은 절대 포함하지 않는다
