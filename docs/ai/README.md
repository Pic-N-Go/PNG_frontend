# AI 협업 하네스 가이드 (프론트엔드)

이 폴더는 **AI 도구가 달라도 동일한 결과 품질**을 내기 위한 팀 공용 문서 세트입니다.

핵심 원칙은 간단합니다.

1. 먼저 스펙을 고정한다.
2. 구현 계획을 태스크 단위로 쪼갠다.
3. 구현 후 체크리스트로 검증한다.

---

## 문서 구성 — 핵심 템플릿

- `docs/ai/00-context.md`
  - 프로젝트 공통 제약, 아키텍처, 화면 구현 규칙
- `docs/ai/01-feature-spec-template.md`
  - 기능 스펙 템플릿 (요구사항 고정)
- `docs/ai/02-implementation-plan-template.md`
  - 구현 계획 템플릿 (파일 단위 태스크)
- `docs/ai/03-pr-review-checklist.md`
  - PR 품질 체크리스트
- `docs/ai/04-agent-handoff-prompt-template.md`
  - AI 도구별 핸드오프 프롬프트 템플릿

## 문서 구성 — 워크플로우 가이드

- `docs/ai/05-intake-workflow.md`
  - Intake 절차 상세 (질문 기준, 산출물 규칙)
- `docs/ai/06-claude-intake-starter-prompt.md`
  - Claude용 Intake 수동 시작 프롬프트 (기본 경로는 `/png-intake`)
- `docs/ai/07-non-claude-quickstart.md`
  - 비Claude AI 도구 사용자용 빠른 시작 가이드
- `docs/ai/07-harness-self-audit-checklist.md`
  - 하네스 변경 후 팀 배포 전 셀프 점검 체크리스트

---

## 팀 사용 순서 (권장)

### 공통 (모든 AI)

0. 요구사항이 모호하면 `05-intake-workflow.md`로 Intake(정제)부터 수행
1. 기능 시작 전에 `01-feature-spec-template.md`를 복사해 스펙 작성
2. 스펙 확정 후 `02-implementation-plan-template.md`로 작업 계획 작성

### Claude Code 사용자 전용

3. (선택) `/png-implement`로 plan Task 기준 step-by-step 구현
4. (선택) `/png-test-case`로 변경사항 기반 테스트 케이스 생성
5. (선택) `/png-qa`로 QA 세션 운영 (create → update → finalize)
6. (선택) `/png-handoff`로 팀원 인수인계 문서 생성 (사람 대상 인수인계, AI 핸드오프와 별개)
7. `/png-pr` 실행 (doc-sync 자동 포함). 커맨드·스킬 변경 후 PR 없이 문서만 정리할 때는 `/png-doc-sync` 사용
8. PR 생성 전 `03-pr-review-checklist.md`를 모두 통과

### 비Claude 사용자

3. 각자 사용하는 AI에 `04-agent-handoff-prompt-template.md` 템플릿으로 전달 (구현 시작용 핸드오프)

단계별 상세 안내 → `docs/ai/07-non-claude-quickstart.md`

---

## Claude 빠른 시작 (선택)

클로드 사용자는 채팅창에 `/png-intake`만 입력해 Intake를 빠르게 시작할 수 있습니다.

- 커맨드 파일: `.claude/commands/png-intake.md`
- 스킬 파일: `.claude/skills/requirements-refiner/SKILL.md`

`/png-intake` 사용이 기본 경로이고, 아래 문서는 수동 대체 경로입니다.

- `docs/ai/06-claude-intake-starter-prompt.md`

권장 흐름:

1. 프롬프트 복붙 후 기능 자연어 설명 입력
2. Clarifying Questions에 답변
3. 생성된 `spec`/`plan` 검토 후 구현 단계로 진행

추가 커맨드:

- `/png-review`: 현재 변경사항을 팀 기준(`CLAUDE.md`, `docs/ai/03-pr-review-checklist.md`)으로 점검
  - 커맨드 파일: `.claude/commands/png-review.md`
  - 스킬 파일: `.claude/skills/review-standards/SKILL.md`
- `/png-commit`: 변경사항을 분석해 한국어 커밋 메시지 제안 후 커밋
  - 커맨드 파일: `.claude/commands/png-commit.md`
  - 스킬 파일: `.claude/skills/git-message-helper/SKILL.md`
- `/png-plan`: 확정된 스펙 기반으로 구현 계획(`plan`) 생성/보정
  - 커맨드 파일: `.claude/commands/png-plan.md`
  - 스킬 파일: `.claude/skills/plan-generator/SKILL.md`
- `/png-implement`: plan Task Breakdown 기준으로 step-by-step 코드 구현
  - 커맨드 파일: `.claude/commands/png-implement.md`
  - 스킬 파일: `.claude/skills/task-executor/SKILL.md`
- `/png-test-case`: 변경사항 기반 테스트 케이스 체크리스트 생성 (Unit/Integration/Manual)
  - 커맨드 파일: `.claude/commands/png-test-case.md`
  - 스킬 파일: `.claude/skills/test-case-generator/SKILL.md`
- `/png-qa`: QA 세션 생성/업데이트/판정 운영 (create / update / finalize)
  - 커맨드 파일: `.claude/commands/png-qa.md`
  - 스킬 파일: `.claude/skills/qa-session-manager/SKILL.md`
- `/png-doc-sync`: 변경 파일 기준으로 업데이트 필요 문서 점검 및 승인 후 자동 수정
  - 커맨드 파일: `.claude/commands/png-doc-sync.md`
  - 스킬 파일: `.claude/skills/doc-sync-checker/SKILL.md`
- `/png-pr`: PR 제목/본문 초안 파일 생성 (자동 PR 생성 없음)
  - 실행 시 `doc-sync-checker` 매핑 규칙으로 Required 누락 항목을 사용자 승인 후 수정, 이후 초안 생성
  - 커맨드 파일: `.claude/commands/png-pr.md`
  - 스킬 파일: `.claude/skills/pr-draft-writer/SKILL.md`
- `/png-pr-clean`: `docs/ai/pr-drafts/`의 PR 초안 파일 삭제
  - 커맨드 파일: `.claude/commands/png-pr-clean.md`
- `/png-handoff`: 구현 완료 후 팀원 인수인계용 handoff 문서 생성
  - 커맨드 파일: `.claude/commands/png-handoff.md`
  - 스킬 파일: `.claude/skills/handoff-summary-writer/SKILL.md`
- `/png-handoff-clean`: `docs/ai/handoffs/`의 handoff 문서 삭제
  - 커맨드 파일: `.claude/commands/png-handoff-clean.md`

---

## 운영 규칙

- AI 도구는 자유롭게 선택하되, **문서 포맷은 통일**합니다.
- 구현 중 요구사항이 바뀌면 코드보다 먼저 스펙 문서를 업데이트합니다.
- PR 리뷰는 코드만 보지 말고 스펙/계획/체크리스트 충족 여부를 함께 확인합니다.

---

## 참고 문서 (단일 기준)

- 구현 규칙/디자인 제약: `CLAUDE.md`
- 화면 구조/목업 흐름: `docs/ui-publishing.md`
- 프론트 개발 기준: `docs/development-guide.md`
- 개인 프롬프트 작성 보조: `docs/ai-prompt-guide.md`
- 비클로드 시작 가이드: `docs/ai/07-non-claude-quickstart.md`
- 브랜치/PR 규칙: `.github/CONVENTIONS.md`
- GitHub 자동화 동작: `docs/github-actions-guide.md`
- 하네스 셀프 점검: `docs/ai/07-harness-self-audit-checklist.md`
