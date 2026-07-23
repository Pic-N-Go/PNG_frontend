# 구현 계획: ai-docs-branch-structure

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/ai-docs-branch-structure.md`
- 작업 문서: `docs/ai/task-ai-docs-branch-structure.md`
- 완료 목표: plans·specs 브랜치 폴더 이동 + 7개 커맨드 파일 경로 동적화

## 2) 구현 전략

- 핵심 접근: `git mv`로 이력 보존 이동 → 커맨드 파일 Edit → README 업데이트
- 리스크: 커맨드 파일 경로 패턴이 각 파일마다 다를 수 있음 → 각 파일 Read 후 수정
- 리스크 완화: 수정 전 파일 내용 확인, 경로 참조를 하나씩 교체

## 3) 작업 태스크

### Task 1 — 기존 plans·specs 파일 git mv

- 대상: `docs/ai/plans/*.md` (README 제외), `docs/ai/specs/*.md` (README 제외)
- 변경 내용: (※ 아래는 당시 실행 기록이며 `feat/`는 이후 `feature/`로 재편됨 — 최신 컨벤션은 `docs/ai/specs/README.md` 참고)
  - `mkdir -p docs/ai/plans/feat/auth-ui-publishing-parity`
  - `mkdir -p docs/ai/specs/feat/auth-ui-publishing-parity`
  - 각 파일 `git mv` → 하위 폴더로 이동
- 완료 조건: plans 10개, specs 10개 이동 완료
- 검증 방법: `git status` 확인

### Task 2 — png-intake.md + png-plan.md 경로 수정

- 대상 파일: `.claude/commands/png-intake.md`, `.claude/commands/png-plan.md`
- 변경 내용:
  - spec/plan 경로를 `docs/ai/specs/<branch>/`, `docs/ai/plans/<branch>/` 로 수정
  - 파일 생성·읽기 전 `git branch --show-current` 실행 지침 추가
  - `allowed-tools`에 `Bash(mkdir:*)` 추가 (없으면)
- 완료 조건: 경로 참조가 브랜치 기반으로 수정됨
- 검증 방법: 수정 후 경로 참조 문자열 검색으로 확인

### Task 3 — png-implement.md + png-test-case.md 경로 수정

- 대상 파일: `.claude/commands/png-implement.md`, `.claude/commands/png-test-case.md`
- 변경 내용: 동일 패턴 적용, `Bash(git branch:*)` 추가 (없으면)
- 완료 조건: 경로 참조 브랜치 기반으로 수정
- 검증 방법: 수정 후 경로 참조 확인

### Task 4 — png-handoff.md + png-doc-sync.md + png-qa.md 경로 수정

- 대상 파일: `.claude/commands/png-handoff.md`, `.claude/commands/png-doc-sync.md`, `.claude/commands/png-qa.md`
- 변경 내용: 동일 패턴 적용, `Bash(git branch:*)` 추가 (없으면)
- 완료 조건: 경로 참조 브랜치 기반으로 수정
- 검증 방법: 수정 후 경로 참조 확인

### Task 5 — README 업데이트

- 대상 파일: `docs/ai/plans/README.md`, `docs/ai/specs/README.md`
- 변경 내용: 브랜치 기반 하위 폴더 구조로 변경됨을 한 줄 추가
- 완료 조건: README에 구조 안내 추가
- 검증 방법: 파일 내용 확인

## 4) 검증 체크포인트

- [ ] `git status`로 plans·specs 이동 확인
- [ ] 커맨드 파일 내 `docs/ai/specs/<feature-name>.md` 패턴이 남아있지 않음
- [ ] 커맨드 파일 내 `git branch --show-current` 사용 확인

## 5) 롤백 계획

- 영향 파일: `.claude/commands/` 7개, `docs/ai/plans/`, `docs/ai/specs/` 이동 파일
- 되돌림: `git restore .claude/commands/` + `git mv` 역방향 또는 `git reset HEAD~1`
- 데이터 영향: 없음 (`git mv` 로 이력 보존)

## 6) PR 구성

- PR 제목: `chore(ai-docs): plans·specs 브랜치 기반 폴더 구조 재편`
- 변경 요약: docs/ai plans·specs를 브랜치명 하위 폴더로 재구성, 7개 커맨드 파일 동적 경로 적용
