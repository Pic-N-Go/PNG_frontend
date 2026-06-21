# 구현 계획 — test-case-command

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/test-case-command.md`
- 관련 목업: N/A (Claude Code 파일만 생성)
- 완료 목표: `/png-test-case` 실행 시 변경사항 기반 테스트 케이스 체크리스트를 타입별로 출력하고, 4-section 보고를 제공한다.

## 2) 구현 전략

- 핵심 접근: `png-implement`(타입 분류 + 사용자 확인 흐름)와 `png-doc-sync`(플래그 파싱 + 저장 패턴) 결합. SKILL.md에 케이스 생성 규칙과 타입 분류 기준을 정의하고, 커맨드는 diff 로딩 → 케이스 생성 → 검증 → 보고 흐름을 담당.
- 리스크: plan 없을 때 diff만으로 케이스를 생성하면 관련 없는 케이스가 포함될 수 있음.
- 완화: "plan 연계 불가" 경고 + SKILL.md에 diff 기반 케이스 생성 시 관련성 판단 기준 명시.

## 3) 작업 태스크

### Task 1 — SKILL.md 작성

- 대상 파일:
  - `.claude/skills/test-case-generator/SKILL.md` (신규)
- 변경 내용:
  - 목적, 입력 정의 (plan/spec/diff 우선순위)
  - 케이스 생성 규칙: 정상/경계/실패 × Unit/Integration/Manual 매트릭스
  - plan 없을 때 처리 규칙 ("plan 연계 불가" 경고 + diff 기준 진행)
  - 자동 검증 분리 표기 규칙 (tsc/lint 별도 섹션)
  - 코드 스니펫 추가 흐름 (체크리스트 출력 후 사용자 확인)
  - plan 범위 밖 케이스 "권장 추가" 처리 규칙
  - 4-section 보고 포맷 정의
- 완료 조건: 케이스 생성 규칙 5개 이상, 4-section 보고 포맷, 코드 스니펫 흐름, plan 없음 처리 명시
- 검증 방법: 파일 Read로 내용 확인

### Task 2 — `png-test-case.md` 커맨드 작성

- 대상 파일:
  - `.claude/commands/png-test-case.md` (신규)
- 변경 내용:
  - `allowed-tools: Read, Write, Bash(git diff:*), Bash(git status:*), Bash(git ls-files:*), Bash(ls docs/ai/plans:*), Bash(pnpm exec tsc:*), Bash(pnpm lint:*), Bash(mkdir:*)`
  - Context 주입: git status, git diff HEAD, git ls-files --others --exclude-standard
  - 실행 지침 8단계:
    1. SKILL.md Read
    2. `$ARGUMENTS` 파싱 (feature-name + `--run-checks` + `--save` 플래그 분리)
    3. feature-name 확정 (인자 있으면 사용, 없으면 `ls docs/ai/plans/` 목록 선택)
    4. plan + spec Read (없으면 "plan 연계 불가" 경고 후 diff 기준으로 계속)
    5. git diff 없으면 "변경사항 없음" 안내 후 중단
    6. 케이스 생성 (Unit/Integration/Manual 타입 구분, 정상/경계/실패 포함)
    7. 체크리스트 출력 후 "코드 스니펫도 추가할까요?" 사용자 확인
    8. `--run-checks` 시 tsc/lint 실행, `--save` 시 파일 저장, 4-section 보고 출력
  - 출력 형식: 4-section
- 완료 조건: allowed-tools 포함, 8단계 실행 지침 완비, 4-section 보고 포맷 명시
- 검증 방법: 실제 `/png-test-case` 실행 흐름 확인

### Task 3 — `docs/ai/README.md` 업데이트

- 대상 파일:
  - `docs/ai/README.md`
- 변경 내용:
  - 팀 사용 순서 step 3.4 추가: `(선택) /png-test-case로 변경사항 기반 테스트 케이스 생성`
  - 추가 커맨드 목록에 `/png-test-case` 항목 등재 (`/png-implement` 다음)
- 완료 조건: 두 위치 모두 반영됨
- 검증 방법: 파일 Read

### Task 4 — `png-implement.md` step 8 수정

- 대상 파일:
  - `.claude/commands/png-implement.md`
- 변경 내용:
  - step 8 완료 안내에 `/png-test-case` 추가 (`/png-handoff`, `/png-pr`와 함께 3개 옵션 나열)
- 완료 조건: step 8에 `/png-test-case` 포함
- 검증 방법: 파일 Read

## 4) 검증 체크포인트

- [ ] Type check 통과 — N/A (커맨드/스킬 파일만 생성)
- [ ] Lint 통과 — N/A
- [ ] 주요 시나리오 수동 검증:
  - 정상: plan 존재 → 케이스 생성 → 4-section 보고 출력
  - 경계: plan 없음 → 경고 포함 케이스 생성 확인
  - 경계: `--run-checks` → tsc/lint 결과 포함 확인
  - 경계: `--save` → 파일 생성 확인
- [ ] 회귀 영향 점검: `png-implement.md` step 8 수정 후 기존 흐름 정상 여부

## 5) 롤백 계획

- 영향 파일: 신규 파일 2개 + `docs/ai/README.md` 수정 + `.claude/commands/png-implement.md` 수정
- 되돌림 방법: 신규 파일 2개 삭제, `git checkout docs/ai/README.md .claude/commands/png-implement.md`
- 데이터 영향: 없음

## 6) PR 구성

- PR 제목: `docs: /png-test-case 커맨드 및 test-case-generator 스킬 추가`
- 변경 요약:
  - `/png-test-case` 커맨드 추가 (변경사항 기반 테스트 케이스 체크리스트 생성)
  - `.claude/skills/test-case-generator/SKILL.md` 추가
  - `docs/ai/README.md` + `png-implement.md` 업데이트
- 리뷰 포인트: plan 없을 때 처리 흐름, `--run-checks` 플래그 동작, 코드 스니펫 추가 흐름
