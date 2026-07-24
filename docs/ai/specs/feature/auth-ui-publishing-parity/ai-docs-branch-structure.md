# 기능 스펙: ai-docs-branch-structure

## 1) 기능 정보

- 기능명: docs/ai plans·specs 브랜치 기반 폴더 구조 재편 + 스킬 파일 경로 업데이트
- 담당자: @yeni
- 관련 이슈: 없음
- 대상: 내부 AI 문서 인프라 (src 코드 변경 없음)
- 입력 문서: `docs/ai/task-ai-docs-branch-structure.md`

## 2) 문제와 목표

- 해결하려는 문제: `docs/ai/plans/`, `docs/ai/specs/` 파일이 브랜치 구분 없이 flat하게 쌓여 브랜치 간 혼재 위험
- 완료 기준(한 줄): plans·specs가 브랜치명 하위 폴더로 관리되고, 7개 커맨드 파일이 동적 경로를 사용

## 3) 범위

- 포함(In Scope):
  - 기존 plans·specs `.md` 파일(README 제외) → `<dir>/feature/auth-ui-publishing-parity/` 로 `git mv`
  - 7개 커맨드 파일 경로 패턴 수정 (`git branch --show-current` 기반)
  - `allowed-tools`에 `Bash(git branch:*)` / `Bash(mkdir:*)` 필요 시 추가
  - `docs/ai/plans/README.md`, `docs/ai/specs/README.md` 한 줄 추가

- 제외(Out of Scope):
  - `docs/ai/pr-drafts/` 구조 변경
  - `docs/ai/handoffs/` 구조 변경
  - `docs/ai/review-*.md` 이동

## 4) 수용 기준 (Acceptance Criteria)

- [ ] AC1: 기존 plans·specs 파일 10+10개가 `feature/auth-ui-publishing-parity/` 하위로 이동됨 (git 이력 보존)
- [ ] AC2: 7개 커맨드 파일이 `docs/ai/specs/<branch>/`, `docs/ai/plans/<branch>/` 경로를 사용
- [ ] AC3: 커맨드 파일이 `git branch --show-current`로 브랜치명을 동적으로 구함
- [ ] AC4: README 2개에 브랜치 기반 구조 안내 추가

## 5) 오픈 이슈 / 결정 필요

- 없음
