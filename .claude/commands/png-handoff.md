---
allowed-tools: Read, Write, Bash(git diff:*), Bash(git log:*), Bash(git ls-files:*), Bash(ls docs/ai/specs:*)
description: 구현 완료 후 팀원 인수인계(handoff) 문서 생성
---

## 참고 스킬

- `.claude/skills/handoff-summary-writer/SKILL.md`

## Context

- 변경 파일 요약: !`git diff --stat HEAD`
- Untracked 파일: !`git ls-files --others --exclude-standard`
- 최근 커밋 이력: !`git log --oneline -20`
- 현재 스펙 목록: !`ls docs/ai/specs/`

## 실행 지침

1. `.claude/skills/handoff-summary-writer/SKILL.md`를 Read해 기준을 확인합니다.
2. feature-name을 확정합니다.
   - `$ARGUMENTS`가 있으면 아래 규칙으로 정규화한 뒤 feature-name으로 사용합니다.
     - `../`가 포함된 경우: 즉시 거부하고 사용자에게 알립니다.
     - `/`는 `-`로 치환합니다.
     - `.md` 확장자가 포함된 경우 제거합니다.
   - 없으면 Context의 스펙 목록을 보여주고 사용자에게 선택을 요청합니다.
3. `docs/ai/specs/<feature-name>.md`와 `docs/ai/plans/<feature-name>-plan.md`를 Read합니다.
   - 둘 중 하나라도 없으면 즉시 중단하고 어떤 파일이 없는지 알립니다.
4. 아래 항목을 한 번에 사용자에게 요청합니다.
   - 완료된 태스크 목록 (plan 기준, 간략히)
   - 남은 태스크 목록
   - 알려진 리스크 또는 오픈 이슈 (없으면 "없음" 입력 가능)
5. 수집된 정보와 git 컨텍스트를 기반으로 handoff 문서를 생성합니다.
   - 저장 경로: `docs/ai/handoffs/<feature-name>-handoff.md`
   - Scope Snapshot 섹션에 `git diff --stat` 요약을 포함합니다.
   - untracked 파일이 있으면 Scope Snapshot에 목록을 함께 반영합니다.
   - 상세 diff 본문은 제외하고, "상세 내용은 `git diff HEAD` 참조" 문구를 추가합니다.
6. 구현 코드는 수정하지 않고 문서 생성으로 마무리합니다.
7. 삭제가 필요하면 `/png-handoff-clean <파일명>`을 안내합니다.

## 출력 형식

1) Handoff File Path
2) Sections Summary (6개 섹션이 어떻게 채워졌는지)
3) Remaining TODOs
