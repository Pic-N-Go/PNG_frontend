# Doc Sync Checker Skill

변경 파일 기준으로 업데이트 필요 문서를 점검하고, 승인 시 실제 수정까지 적용하는 스킬입니다.

## 목적

- 코드/커맨드/스킬 변경 후 관련 문서 누락을 자동 탐지한다.
- Required / Recommended로 업데이트 필요 문서를 분류해 제안한다.
- 사용자 승인 후에만 실제 파일을 수정한다.

## 입력

- `git diff --name-only HEAD` (변경 파일 목록)
- `git ls-files --others --exclude-standard` (untracked 파일)
- 고정 점검 문서: `docs/ai/README.md`, `docs/ai/08-harness-self-audit-checklist.md`, `docs/guide/dev/prompt-writing-guide.md`, `CLAUDE.md`, `.github/CONVENTIONS.md`
- 변경 feature 관련 `docs/ai/specs/`, `docs/ai/plans/` 파일 (해당 시)

## 고정 매핑 규칙

| 변경 종류 | Required | Recommended |
|---|---|---|
| 신규 `.claude/commands/*.md` | `docs/ai/README.md` 추가 커맨드 목록 등재 여부 | `docs/ai/08-harness-self-audit-checklist.md` 항목 추가 여부 |
| 신규 `.claude/skills/*/SKILL.md` | `docs/ai/README.md` 관련 커맨드 스킬 경로 등재 여부 | — |
| `.claude/commands/*.md` 수정 | `docs/ai/README.md` 해당 커맨드 설명 일치 여부 | `docs/ai/08-harness-self-audit-checklist.md` |
| `CLAUDE.md` 수정 | `docs/ai/00-context.md` 동기화 여부 | `docs/guide/dev/prompt-writing-guide.md` 제약 조건 업데이트 여부 |
| `.github/CONVENTIONS.md` 수정 | `docs/ai/README.md` PR 규칙 참조 확인 | — |
| `src/` 파일 수정 | 해당 feature spec/plan 업데이트 여부 | `docs/ai/03-pr-review-checklist.md` 통과 여부 |

## 동작 규칙

1. `src/` 변경이 없으면 6번 행(src/ 매핑)을 생략하고 출력에 "코드-문서 동기화 점검 생략 가능" 안내를 포함한다.
2. 매핑 규칙에 해당하는 문서를 Read해 실제 누락 여부를 확인한다.
3. `ls .claude/commands/`와 `ls .claude/skills/` 결과를 `docs/ai/README.md` 추가 커맨드 목록과 대조해 미등재 항목을 탐지한다.
4. 점검 문서 내 파일 경로 참조(`.claude/`, `docs/` 등)가 실제 존재하는지 확인한다.
5. 구현 코드는 수정하지 않는다.
6. 문서 수정은 사용자 승인 후에만 실행한다.

## 출력 형식 (4-section)

1) Changed Files Summary — 변경 파일을 커맨드/스킬/src/docs로 분류
2) Docs To Update — Required / Recommended 분류, 각 항목에 구체적 수정 내용 명시
3) Missing Links or Broken References — 존재하지 않는 경로, 미등재 커맨드/스킬 목록
4) Proposed Doc Patch Plan — 수정 내용 초안 → 사용자 승인 요청

## 승인 흐름

1. 4-section 리포트 출력 후 "위 수정 사항을 적용할까요?" 승인 요청.
2. 승인 시 Write로 문서 수정 실행 후 변경 파일 목록 보고.
3. 거부 시 리포트만 출력하고 종료.

---

## TODO — 향후 확장 후보 매핑 규칙

현재 구현에 포함하지 않음. 필요 시 위 매핑 테이블에 추가:

- `docs/guide/dev/ui-publishing.md` 수정 → `docs/ai/00-context.md` 화면 규칙 동기화 여부
- `src/screens/` 신규 파일 → 해당 feature spec 문서 자동 매칭 여부
- `.github/pull_request_template.md` 수정 → `docs/ai/03-pr-review-checklist.md` 동기화 여부
