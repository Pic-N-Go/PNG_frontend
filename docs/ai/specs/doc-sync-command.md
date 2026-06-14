# 기능 스펙 — doc-sync-command

## 1) 기능 정보

- 기능명: `/png-doc-sync` 커맨드 + `doc-sync-checker` 스킬
- 담당자: @yeni
- 관련 이슈: 없음
- 대상 플랫폼: N/A (Claude Code CLI 도구)

## 2) 문제와 목표

- 해결하려는 문제: 코드나 커맨드/스킬 변경 후 관련 문서(README, docs/ai, 체크리스트) 업데이트가 누락되기 쉬움.
- 사용자 가치: 변경 파일 기준으로 업데이트 필요 문서를 자동 제안하고, 승인 시 실제 수정까지 적용해 문서 부채를 줄인다.
- 완료 기준(한 줄): `/png-doc-sync` 실행 시 4-section 리포트를 출력하고, 승인 시 관련 문서를 자동 수정한다.

## 3) 범위

- 포함(In Scope):
  - `.claude/commands/png-doc-sync.md` 커맨드 신규 생성
  - `.claude/skills/doc-sync-checker/SKILL.md` 스킬 신규 생성
  - 고정 점검 문서 5개: `docs/ai/README.md`, `docs/ai/07-harness-self-audit-checklist.md`, `docs/ai-prompt-guide.md`, `CLAUDE.md`, `.github/CONVENTIONS.md`
  - 변경된 파일이 속한 feature의 관련 `docs/ai/specs/`, `docs/ai/plans/` 파일도 점검 대상 포함
  - 고정 매핑 규칙 정의 (어떤 변경이 어떤 문서 업데이트를 트리거하는지)
  - Broken references 탐지: 문서 내 파일 경로 존재 여부 + `docs/ai/README.md` 미등재 커맨드/스킬
  - `src/` 무변경 시 "코드-문서 동기화 점검 생략 가능" 안내
  - `$ARGUMENTS --save` 플래그 시 `docs/ai/doc-sync-reports/<branch>-sync.md` 리포트 저장
  - Proposed Doc Patch Plan 제안 → 사용자 승인 → 실제 문서 자동 수정
  - `docs/ai/README.md` 팀 사용 순서 업데이트 (`/png-pr` 전 단계 삽입)

- 제외(Out of Scope):
  - 커맨드 description 문구와 실제 파일 내용의 의미적 비교
  - 자동 커밋/푸시
  - doc-sync-clean 전용 커맨드 (`--save` 방식이므로 디렉토리 관리 불필요)
  - 비Claude 도구용 프롬프트(`06-claude-intake-starter-prompt.md`) 동기화 체크

## 4) 사용자 시나리오

- 시나리오 A (신규 커맨드 추가 후 실행):
  - Given: `.claude/commands/png-new.md` 신규 추가, `docs/ai/README.md` 추가 커맨드 목록에 미등재.
  - When: `/png-doc-sync` 실행
  - Then: Docs To Update — Required에 `docs/ai/README.md` 항목 표시. 승인 시 자동 수정.

- 시나리오 B (`src/` 변경 없음):
  - Given: `.claude/commands/` 파일만 수정, `src/` 변경 없음.
  - When: `/png-doc-sync` 실행
  - Then: "코드-문서 동기화 점검 생략 가능" 안내, 커맨드 관련 문서 점검만 수행.

- 시나리오 C (리포트 저장):
  - Given: 여러 파일 변경.
  - When: `/png-doc-sync --save` 실행
  - Then: 4-section 리포트 출력 + `docs/ai/doc-sync-reports/<current-branch>-sync.md` 파일 생성.

- 시나리오 D (Broken Reference 발견):
  - Given: `docs/ai/README.md`에 `.claude/commands/png-old.md` 경로 참조, 실제 파일 삭제됨.
  - When: `/png-doc-sync` 실행
  - Then: Missing Links or Broken References 섹션에 해당 경로 목록화.

## 5) UI/UX 요구사항

N/A — CLI 도구 (앱 코드 변경 없음)

## 6) 데이터/API 요구사항

N/A — 외부 API 없음

## 7) 상태 관리

N/A

## 8) 기술 제약 체크

- [ ] NativeWind `className`만 사용 — N/A
- [ ] `StyleSheet.create()` 미사용 — N/A
- [ ] `@/` alias 사용 — N/A
- [ ] 타입 정의 명확 — N/A
- [ ] 디자인 토큰 준수 — N/A

## 9) 수용 기준 (Acceptance Criteria)

- [ ] AC1: `/png-doc-sync` 실행 시 Changed Files Summary · Docs To Update · Missing Links or Broken References · Proposed Doc Patch Plan 4개 섹션이 출력된다.
- [ ] AC2: `src/` 변경이 없으면 "코드-문서 동기화 점검 생략 가능" 안내가 포함된다.
- [ ] AC3: 신규 `.claude/commands/` 또는 `.claude/skills/` 파일이 `docs/ai/README.md` 추가 커맨드 목록에 없으면 Docs To Update — Required로 표시된다.
- [ ] AC4: 점검 대상 문서에서 존재하지 않는 파일 경로가 발견되면 Missing Links 섹션에 목록화된다.
- [ ] AC5: `$ARGUMENTS --save` 플래그가 없으면 `docs/ai/doc-sync-reports/` 파일이 생성되지 않는다.
- [ ] AC6: Proposed Doc Patch Plan 제안 후 사용자 승인 없이 파일이 수정되지 않는다.

## 10) 테스트 시나리오

- 정상 케이스: 신규 커맨드 추가 → Required 탐지 → 승인 → `docs/ai/README.md` 자동 수정 확인
- 경계 케이스: `src/` 변경 없음 → 생략 안내 출력, 코드-문서 매핑 체크 미실행
- 실패 케이스: `--save` 없이 실행 → 리포트 파일 미생성 확인

## 11) 오픈 이슈 / 결정 필요

- [결정 완료] 고정 매핑 규칙: 현재 6개 트리거로 시작. 향후 확장 후보는 SKILL.md의 TODO 섹션에 별도 관리.
- [결정 완료] `--save` 리포트 저장 위치 `docs/ai/doc-sync-reports/`는 `.gitignore` 처리 (로컬 리포트 용도).

---

## 작성 시 참고 문서

- 구현 규칙: `CLAUDE.md`
- AI 협업 표준: `docs/ai/README.md`
- 유사 커맨드 참조: `.claude/commands/png-review.md`, `.claude/commands/png-handoff.md`
