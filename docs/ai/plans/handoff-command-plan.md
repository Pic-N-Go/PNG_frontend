# 구현 계획 — handoff-command

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/handoff-command.md`
- 관련 목업: N/A (앱 코드 변경 없음, Claude Code 파일만 생성)
- 완료 목표: `/png-handoff`, `/png-handoff-clean` 커맨드와 스킬 파일이 완성되고, handoff 문서가 실제로 생성된다.

## 2) 구현 전략

- 핵심 접근: `png-pr` / `png-pr-clean` 패턴을 그대로 재사용. 경로는 `docs/ai/handoffs/`로 변경, 신규 개념(spec 선택, 사용자 입력 수집, git 컨텍스트 병합)만 추가.
- 리스크: 완료/잔여 태스크 입력이 multi-turn이라 커맨드 흐름이 끊길 수 있음.
- 완화: 실행 지침에 "입력받을 항목을 한 번에 질문"하도록 명시해 round-trip 최소화.

## 3) 작업 태스크

### Task 1 — SKILL.md 작성

- 대상 파일:
  - `.claude/skills/handoff-summary-writer/SKILL.md` (신규)
- 변경 내용: 목적, 입력, 동작 규칙(spec/plan 필수 검증, 사용자 입력 우선, git 보조 사용, 코드 미수정), 출력 형식(6개 섹션) 정의
- 완료 조건: 파일이 존재하고 6개 출력 섹션이 명시됨
- 검증 방법: 파일 Read로 내용 확인

### Task 2 — `png-handoff.md` 커맨드 작성

- 대상 파일:
  - `.claude/commands/png-handoff.md` (신규)
- 변경 내용:
  - `allowed-tools: Read, Write, Bash(git diff:*), Bash(git log:*), Bash(ls docs/ai/specs:*)`
  - Context 주입: `git diff HEAD`, `git log --oneline -20`, `ls docs/ai/specs/`
  - 실행 지침 6단계:
    1. SKILL.md Read
    2. feature-name 확정 (`$ARGUMENTS` 또는 목록 선택)
    3. spec/plan 존재 검증 (없으면 중단)
    4. 완료/잔여 태스크·리스크 사용자 입력 수집
    5. 6개 섹션 handoff 문서 생성 (`docs/ai/handoffs/<feature-name>-handoff.md`)
    6. 삭제 필요 시 `/png-handoff-clean` 안내
  - 출력 형식: 6개 섹션 명시
- 완료 조건: allowed-tools 포함, 실행 지침 6단계 완비, 출력 형식 명시
- 검증 방법: 실제 `/png-handoff` 실행 후 handoff 문서 생성 확인

### Task 3 — `png-handoff-clean.md` 커맨드 작성

- 대상 파일:
  - `.claude/commands/png-handoff-clean.md` (신규)
- 변경 내용: `png-pr-clean.md`와 동일 패턴, 경로만 `docs/ai/handoffs/`로 변경
  - `allowed-tools: Read, Bash(ls docs/ai/handoffs:*), Bash(rm docs/ai/handoffs/*)`
  - 실행 지침: 경로 검증(`../` 거부), 파일명·경로 정규화, `rm -- <경로>` 형태 삭제
- 완료 조건: 경로 제한 패턴 포함, 안전 규칙 명시
- 검증 방법: 파일 Read로 내용 확인

### Task 4 — `docs/ai/handoffs/README.md` 생성

- 대상 파일:
  - `docs/ai/handoffs/README.md` (신규)
- 변경 내용: 디렉토리 역할 설명, 파일 명명 규칙(`<feature-name>-handoff.md`), 생성/삭제 커맨드 안내
- 완료 조건: README 존재, `docs/ai/pr-drafts/README.md`와 동일 구조
- 검증 방법: 파일 Read

### Task 5 — `docs/ai/README.md` 업데이트

- 대상 파일:
  - `docs/ai/README.md`
- 변경 내용: "추가 커맨드" 목록에 `/png-handoff`, `/png-handoff-clean` 항목 추가
- 완료 조건: 두 커맨드가 README에 설명과 함께 등재됨
- 검증 방법: 파일 Read

## 4) 검증 체크포인트

- [ ] Type check 통과 — N/A (코드 변경 없음)
- [ ] Lint 통과 — N/A
- [ ] 주요 사용자 시나리오 수동 검증: `/png-handoff` 실행 후 `docs/ai/handoffs/` 에 문서가 생성되는지 확인
- [ ] 회귀 영향 점검: 기존 커맨드(`png-intake`, `png-plan`, `png-review`, `png-pr`) 동작에 영향 없음

## 5) 롤백 계획

- 영향 파일: 신규 파일 5개 (`.claude/skills/`, `.claude/commands/`, `docs/ai/handoffs/`)
- 되돌림 방법: 신규 파일 5개 삭제
- 데이터 영향: `docs/ai/README.md` 수정 1건 — `git checkout docs/ai/README.md`로 복원

## 6) PR 구성

- PR 제목: `docs: /png-handoff 커맨드 및 handoff-summary-writer 스킬 추가`
- 변경 요약:
  - `/png-handoff`, `/png-handoff-clean` 커맨드 추가
  - `.claude/skills/handoff-summary-writer/SKILL.md` 추가
  - `docs/ai/handoffs/` 디렉토리 및 README 추가
- 리뷰 포인트: spec/plan 없을 때 중단 동작, 사용자 입력 수집 흐름, allowed-tools 경로 제한
