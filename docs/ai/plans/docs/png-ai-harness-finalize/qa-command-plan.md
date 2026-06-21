# 구현 계획 — qa-command

## 메타

- 기능명: `/png-qa` 커맨드 + `qa-session-manager` 스킬
- 스펙 문서: `docs/ai/specs/qa-command.md`
- 작성일: 2026-06-14
- 담당자: @yeni

---

## Task Breakdown

### Task 1 — `.claude/skills/qa-session-manager/SKILL.md` 생성

**파일**: `.claude/skills/qa-session-manager/SKILL.md`
**작업**: 신규 생성

포함 내용:
- 스킬 목적 (QA 세션 운영 규칙, 판정 기준, 4-section 보고 포맷)
- 3-mode 운영 규칙 (create / update / finalize)
- 입력 우선순위: `docs/ai/test-cases/<feature-name>-test-cases.md` > git diff
  - test-case 없으면: "test-case 문서가 없어 diff 기준 최소 체크리스트를 생성했습니다" 안내
- 상태 정의: PASS / FAIL / BLOCKED / NOT RUN
- 자동 분리 기준: FAIL → 결함, BLOCKED → 블로커 (Defects & Blockers 섹션)
- 재현 정보 필수 필드: 재현 단계, 기대 결과, 실제 결과, 영향 범위
- Go / Conditional Go / No-Go 판정 기준:
  - Go: 블로커 0, 미실행 항목 없음
  - Conditional Go: FAIL 또는 미실행 있으나 블로커 없음, 조건 명시
  - No-Go: 블로커 1개 이상
- 4-section 완료 보고 포맷 (code fence 포함)
- plan 범위 밖 이슈 처리: "추가 확인 필요" 섹션으로 분리

---

### Task 2 — `.claude/commands/png-qa.md` 생성

**파일**: `.claude/commands/png-qa.md`
**작업**: 신규 생성

포함 내용:
- frontmatter: `allowed-tools`, `description`
  - allowed-tools: `Read`, `Write`, `Bash(git diff:*)`, `Bash(git status:*)`, `Bash(git ls-files:*)`, `Bash(ls docs/ai/test-cases:*)`, `Bash(ls docs/ai/plans:*)`, `Bash(mkdir:*)`
- Context 주입: git status, git diff HEAD, git ls-files --others --exclude-standard
- 참고 스킬: `.claude/skills/qa-session-manager/SKILL.md`
- 실행 지침:
  1. SKILL.md Read
  2. `$ARGUMENTS` 파싱: 첫 번째 인자 = 모드(create/update/finalize), 두 번째 인자 = feature-name, `--save` 플래그
  3. feature-name 확정 (없으면 `ls docs/ai/plans/` 목록 표시 후 요청)
  4. 모드별 분기 실행
  5. `--save` 시 `mkdir -p docs/ai/qa-reports` 후 파일 저장
  6. 4-section 보고 출력
  7. 완료 후 다음 단계 안내 (`/png-pr`, `/png-handoff`)

---

### Task 3 — `docs/ai/README.md` 업데이트

**파일**: `docs/ai/README.md`
**작업**: 수정

- 팀 사용 순서에 step 3.5 추가:
  `(선택) /png-qa로 QA 세션 운영 — Claude Code 사용자 전용`
  (step 3.4 `/png-test-case` 바로 다음)
- 추가 커맨드 목록에 `/png-qa` 항목 등재:
  ```
  - `/png-qa`: QA 세션 생성/업데이트/판정 (create / update / finalize)
    - 커맨드 파일: `.claude/commands/png-qa.md`
    - 스킬 파일: `.claude/skills/qa-session-manager/SKILL.md`
  ```

---

### Task 4 — `.claude/commands/png-test-case.md` 완료 안내 수정

**파일**: `.claude/commands/png-test-case.md`
**작업**: 수정

- step 8 완료 안내 마지막 줄에 `/png-qa create <feature-name>` 추가
  (기존: `/png-handoff`, `/png-pr`, `/png-test-case --run-checks`)
