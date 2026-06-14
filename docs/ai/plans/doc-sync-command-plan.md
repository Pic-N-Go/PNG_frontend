# 구현 계획 — doc-sync-command

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/doc-sync-command.md`
- 관련 목업: N/A (앱 코드 변경 없음, Claude Code 파일만 생성)
- 완료 목표: `/png-doc-sync` 실행 시 4-section 리포트 출력 및 사용자 승인 후 문서 자동 수정.

## 2) 구현 전략

- 핵심 접근: `png-review` 패턴(git diff 기반 점검)과 `png-handoff` 패턴(사용자 승인 후 Write)을 결합. 고정 매핑 규칙은 SKILL.md에 테이블로 정의해 커맨드와 독립적으로 관리.
- 리스크: 고정 매핑 규칙이 불완전할 경우 Required/Recommended 분류 오류 발생 가능.
- 완화: SKILL.md에 매핑 테이블을 명시적으로 정의하고, 규칙에 없는 변경은 AI 추론이 아닌 "확인 필요" 플래그로 표시.

## 3) 작업 태스크

### Task 1 — SKILL.md 작성

- 대상 파일:
  - `.claude/skills/doc-sync-checker/SKILL.md` (신규)
- 변경 내용:
  - 목적, 입력 정의
  - 고정 매핑 규칙 테이블 (아래 기준):

    | 변경 종류 | Required | Recommended |
    |---|---|---|
    | 신규 `.claude/commands/*.md` | `docs/ai/README.md` 추가 커맨드 목록 등재 | `docs/ai/07-harness-self-audit-checklist.md` 항목 추가 여부 |
    | 신규 `.claude/skills/*/SKILL.md` | `docs/ai/README.md` 관련 커맨드 스킬 경로 등재 | — |
    | `.claude/commands/*.md` 수정 | `docs/ai/README.md` 해당 커맨드 설명 일치 여부 | `docs/ai/07-harness-self-audit-checklist.md` |
    | `CLAUDE.md` 수정 | `docs/ai/00-context.md` 동기화 여부 | `docs/ai-prompt-guide.md` |
    | `.github/CONVENTIONS.md` 수정 | `docs/ai/README.md` PR 규칙 참조 확인 | — |
    | `src/` 파일 수정 | 해당 feature spec/plan 업데이트 여부 | `docs/ai/03-pr-review-checklist.md` |

  - `src/` 무변경 시 코드-문서 매핑 체크 생략 규칙
  - Required / Recommended 판단 기준
  - 4-section 출력 포맷 정의
  - 승인 흐름 규칙 (제안 → 승인 대기 → Write)
- 완료 조건: 매핑 테이블, 4-section 출력 포맷, 승인 흐름 3가지가 모두 SKILL.md에 명시됨
- 검증 방법: 파일 Read로 내용 확인

### Task 2 — `png-doc-sync.md` 커맨드 작성

- 대상 파일:
  - `.claude/commands/png-doc-sync.md` (신규)
- 변경 내용:
  - `allowed-tools: Read, Write, Bash(git diff:*), Bash(git status:*), Bash(git ls-files:*), Bash(git branch:*), Bash(ls .claude:*), Bash(ls docs:*)`
  - Context 주입: `git diff --name-only HEAD`, `git ls-files --others --exclude-standard`, `git status`
  - `$ARGUMENTS` 처리: `--save` 플래그 여부 파싱
  - 실행 지침 7단계:
    1. SKILL.md Read
    2. Context에서 변경 파일 분류 (커맨드/스킬/src/docs 구분)
    3. `src/` 변경 유무 판단 → 없으면 코드-문서 매핑 생략 안내
    4. 고정 점검 문서 Read + 매핑 규칙 적용 → Required/Recommended 분류
    5. Broken references 탐지 (경로 존재 + README 미등재 커맨드)
    6. 4-section 리포트 출력 + 수정 제안
    7. 사용자 승인 시 Write 실행 / `--save` 플래그면 리포트 파일도 저장
- 완료 조건: allowed-tools 포함, 7단계 실행 지침 완비, 4-section 출력 포맷 명시
- 검증 방법: 실제 `/png-doc-sync` 실행 후 4-section 출력 확인

### Task 3 — `docs/ai/README.md` 업데이트

- 대상 파일:
  - `docs/ai/README.md`
- 변경 내용:
  - 팀 사용 순서에 `/png-pr` 직전 단계로 `/png-doc-sync` 추가 (예: 3.8단계)
  - 추가 커맨드 목록에 `/png-doc-sync` 항목 등재
- 완료 조건: 두 위치 모두 반영됨
- 검증 방법: 파일 Read

## 4) 검증 체크포인트

- [ ] Type check 통과 — N/A (코드 변경 없음)
- [ ] Lint 통과 — N/A
- [ ] 주요 사용자 시나리오 수동 검증:
  - 신규 커맨드 추가 케이스 → Required 탐지 확인
  - `src/` 무변경 케이스 → 생략 안내 확인
  - `--save` 플래그 케이스 → 리포트 파일 생성 확인
- [ ] 회귀 영향 점검: 기존 커맨드 동작에 영향 없음

## 5) 롤백 계획

- 영향 파일: 신규 파일 2개 + `docs/ai/README.md` 수정 1건
- 되돌림 방법: 신규 파일 2개 삭제, `git checkout docs/ai/README.md`
- 데이터 영향: 없음

## 6) PR 구성

- PR 제목: `docs: /png-doc-sync 커맨드 및 doc-sync-checker 스킬 추가`
- 변경 요약:
  - `/png-doc-sync` 커맨드 추가 (문서 동기화 점검 + 승인 후 자동 수정)
  - `.claude/skills/doc-sync-checker/SKILL.md` 추가 (고정 매핑 규칙 정의)
  - `docs/ai/README.md` 업데이트 (팀 사용 순서 + 커맨드 목록)
- 리뷰 포인트: 고정 매핑 규칙 테이블 완전성, 승인 흐름(제안→승인→Write) 동작
