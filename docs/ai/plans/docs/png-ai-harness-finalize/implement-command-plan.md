# 구현 계획 — implement-command

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/implement-command.md`
- 관련 목업: N/A (Claude Code 파일만 생성)
- 완료 목표: `/png-implement` 실행 시 plan 기반 Task를 step-by-step으로 구현하고 4-section 완료 보고를 출력한다.

## 2) 구현 전략

- 핵심 접근: `png-review`(단계별 기준 체크)와 `png-handoff`(사용자 입력 수집 + 승인 흐름) 패턴을 결합. SKILL.md에 구현 규칙 + Task 체크 기준을 정의하고, 커맨드는 plan 로딩 → Task 루프 → 검증 → 보고 흐름을 담당.
- 리스크: Task 루프가 multi-turn이라 긴 구현 세션에서 컨텍스트가 길어질 수 있음.
- 완화: 각 Task 시작 시 해당 Task의 대상 파일/변경 내용만 집중해서 Read, 전체 plan을 반복 Read하지 않음.

## 3) 작업 태스크

### Task 1 — SKILL.md 작성

- 대상 파일:
  - `.claude/skills/task-executor/SKILL.md` (신규)
- 변경 내용:
  - 목적, 입력 정의
  - 동작 규칙: Task 단위 실행 / plan 밖 작업 처리 / 검증 기준 / 보고 형식
  - CLAUDE.md 구현 규칙 준수 항목 명시 (NativeWind, @/ alias, 타입 정의 등)
  - 4-section 완료 보고 포맷 정의
  - Plan 밖 작업 / Plan 변경 시 승인 흐름 규칙
- 완료 조건: 동작 규칙 6개 이상, 4-section 보고 포맷, 승인 흐름 명시
- 검증 방법: 파일 Read로 내용 확인

### Task 2 — `png-implement.md` 커맨드 작성

- 대상 파일:
  - `.claude/commands/png-implement.md` (신규)
- 변경 내용:
  - `allowed-tools: Read, Write, Edit, Bash(pnpm exec tsc:*), Bash(pnpm lint:*), Bash(git diff:*), Bash(git status:*), Bash(ls docs/ai/plans:*)`
  - Context 주입: `git status`, `git diff HEAD`
  - 실행 지침 8단계:
    1. SKILL.md Read
    2. feature-name 확정 (`$ARGUMENTS` 또는 `docs/ai/plans/` 목록 선택)
    3. `docs/ai/plans/<feature-name>-plan.md` + `CLAUDE.md` Read
    4. plan 없으면 중단 + 안내
    5. Task 목록 표시 + Task 1부터 순차 시작
    6. 각 Task 루프: 대상 파일 Read → 코드 작성(Write/Edit) → tsc/lint 실행 → 수동 검증 TODO → 사용자 확인
    7. Plan 밖 작업 필요 시: plan 수정 + 구현 동시 제안 → 승인 시 plan Write + 코드 Write/Edit
    8. 완료 보고 4-section 출력 + /png-handoff 또는 /png-pr 안내
  - 출력 형식: 4-section
- 완료 조건: allowed-tools 포함, 8단계 실행 지침 완비, 4-section 보고 포맷 명시
- 검증 방법: 실제 `/png-implement` 실행 후 Task step-by-step 흐름 확인

### Task 3 — `docs/ai/README.md` 업데이트

- 대상 파일:
  - `docs/ai/README.md`
- 변경 내용:
  - 팀 사용 순서에 `/png-implement` 위치 명시 (step 3 구현 단계 보조 커맨드로)
  - 추가 커맨드 목록에 `/png-implement` 항목 등재
- 완료 조건: 두 위치 모두 반영됨
- 검증 방법: 파일 Read

## 4) 검증 체크포인트

- [ ] Type check 통과 — N/A (커맨드/스킬 파일만 생성)
- [ ] Lint 통과 — N/A
- [ ] 주요 시나리오 수동 검증:
  - 정상: plan 존재 → Task 1~N 순차 실행 → 4-section 보고
  - plan 없음: 오류 중단 확인
  - plan 밖 작업: 동시 제안 승인 흐름 확인
- [ ] 회귀 영향 점검: 기존 커맨드 동작에 영향 없음

## 5) 롤백 계획

- 영향 파일: 신규 파일 2개 + `docs/ai/README.md` 수정 1건
- 되돌림 방법: 신규 파일 2개 삭제, `git checkout docs/ai/README.md`
- 데이터 영향: 없음

## 6) PR 구성

- PR 제목: `docs: /png-implement 커맨드 및 task-executor 스킬 추가`
- 변경 요약:
  - `/png-implement` 커맨드 추가 (plan 기반 step-by-step 구현)
  - `.claude/skills/task-executor/SKILL.md` 추가
  - `docs/ai/README.md` 업데이트
- 리뷰 포인트: Plan 밖 작업 승인 흐름, tsc/lint 자동 실행 패턴
