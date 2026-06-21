# 기능 스펙 — handoff-command

## 1) 기능 정보

- 기능명: `/png-handoff` 커맨드 + `handoff-summary-writer` 스킬
- 담당자: @yeni
- 관련 이슈: 없음
- 대상 플랫폼: N/A (Claude Code CLI 도구)

## 2) 문제와 목표

- 해결하려는 문제: 작업 인수인계 시 현재 상태·남은 작업·리스크가 spec, plan, git 여러 곳에 흩어져 있어 인수인계 시간이 길어짐.
- 사용자 가치: spec + plan + git 컨텍스트를 기반으로 표준 형식의 handoff 문서를 자동 생성해 인수인계 비용을 줄인다.
- 완료 기준(한 줄): `/png-handoff`로 6개 섹션이 포함된 handoff 문서가 `docs/ai/handoffs/`에 생성된다.

## 3) 범위

- 포함(In Scope):
  - `.claude/commands/png-handoff.md` 커맨드 신규 생성
  - `.claude/skills/handoff-summary-writer/SKILL.md` 스킬 신규 생성
  - `.claude/commands/png-handoff-clean.md` 커맨드 신규 생성
  - `docs/ai/handoffs/<feature-name>-handoff.md` 문서 생성
  - `docs/ai/handoffs/README.md` 디렉토리 가이드 신규 생성
  - `docs/ai/README.md` 커맨드 목록 업데이트
  - feature-name 미전달 시 `docs/ai/specs/` 목록 제시 후 선택
  - spec 또는 plan 없으면 오류 메시지와 함께 즉시 중단

- 제외(Out of Scope):
  - AI 에이전트 핸드오프 (기존 `04-agent-handoff-prompt-template.md` 담당)
  - 태스크 완료 여부 자동 감지 (plan 체크박스 파싱, git 추론 없음)
  - handoff 문서 자동 커밋/푸시
  - 복수 feature 동시 handoff

## 4) 사용자 시나리오

- 시나리오 A (인자 없이 실행):
  - Given: `docs/ai/specs/login-flow.md`가 존재한다.
  - When: `/png-handoff` 실행
  - Then: 스펙 목록을 보여주고 feature-name 선택을 요청한다. 선택 후 완료/잔여/리스크를 입력받고 `docs/ai/handoffs/login-flow-handoff.md`를 생성한다.

- 시나리오 B (인자 있이 실행):
  - Given: `docs/ai/specs/login-flow.md`와 `docs/ai/plans/login-flow-plan.md`가 모두 존재한다.
  - When: `/png-handoff login-flow` 실행
  - Then: 바로 spec/plan을 로드하고 완료/잔여/리스크 입력을 요청한 뒤 handoff 문서를 생성한다.

- 시나리오 C (spec 또는 plan 없음):
  - Given: `docs/ai/specs/auth.md`는 있지만 `docs/ai/plans/auth-plan.md`가 없다.
  - When: `/png-handoff auth` 실행
  - Then: plan 문서가 없다고 오류 메시지를 출력하고 중단한다.

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

- [ ] AC1: `/png-handoff` 실행 시 `docs/ai/specs/` 파일 목록을 보여주고 feature-name을 확인한다. `$ARGUMENTS`가 있으면 목록 생략.
- [ ] AC2: spec 또는 plan 문서 중 하나라도 없으면 오류 메시지와 함께 즉시 중단한다.
- [ ] AC3: 사용자가 완료/잔여 태스크와 리스크를 입력하면 그 내용이 handoff 문서 3~5번 섹션에 반영된다.
- [ ] AC4: 생성된 `docs/ai/handoffs/<feature-name>-handoff.md`에 Feature Summary · Scope Snapshot · Completed Tasks · Remaining Tasks · Risks & Open Decisions · Next Actions 6개 섹션이 모두 포함된다.
- [ ] AC5: `/png-handoff-clean` 실행 시 `docs/ai/handoffs/` 경로 밖 파일은 삭제하지 않는다.

## 10) 테스트 시나리오

- 정상 케이스: spec/plan 모두 존재, 인자 있음/없음 양쪽 → handoff 문서 정상 생성
- 경계 케이스: spec은 있고 plan이 없는 경우 → 오류 메시지 출력 후 중단
- 실패 케이스: `../` 포함된 인자로 `/png-handoff-clean` 실행 → 거부

## 11) 오픈 이슈 / 결정 필요

- [결정 완료] git diff 포함 수준: `git diff --stat` 결과(변경 파일 목록 + 1줄 통계)를 Scope Snapshot에 자동 포함. 상세 diff 본문은 제외하고 "상세 내용은 `git diff HEAD` 참조" 문구 추가.
- [결정 완료] `docs/ai/README.md` 권장 흐름: 3단계(구현 완료)와 4단계(PR 생성 전) 사이에 3.5단계(선택)로 삽입.

---

## 작성 시 참고 문서

- 구현 규칙: `CLAUDE.md`
- AI 협업 표준: `docs/ai/README.md`
- 유사 커맨드 참조: `.claude/commands/png-pr.md`, `.claude/commands/png-plan.md`
