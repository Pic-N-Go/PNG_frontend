# 기능 스펙 — implement-command

## 1) 기능 정보

- 기능명: `/png-implement` 커맨드 + `task-executor` 스킬
- 담당자: @yeni
- 관련 이슈: 없음
- 대상 플랫폼: N/A (Claude Code CLI 도구)

## 2) 문제와 목표

- 해결하려는 문제: 구현 중 plan 범위를 벗어난 작업이 승인 없이 진행되거나, Task 완료 여부를 체계적으로 확인하지 못해 구현 품질이 들쭉날쭉해짐.
- 사용자 가치: plan의 Task Breakdown을 단일 기준으로 삼아 Task 단위 step-by-step으로 구현을 진행하고, 각 Task마다 자동 검증 + 사용자 확인을 거쳐 완료 보고까지 일관된 흐름으로 제공한다.
- 완료 기준(한 줄): `/png-implement` 실행 시 plan 기반 Task를 순차 구현하고, 4-section 완료 보고를 출력한다.

## 3) 범위

- 포함(In Scope):
  - `.claude/commands/png-implement.md` 커맨드 신규 생성
  - `.claude/skills/task-executor/SKILL.md` 스킬 신규 생성
  - Task 단위 step-by-step 실행: 각 Task 완료 후 사용자 확인 → 다음 Task
  - Plan 밖 작업 필요 시: plan 수정 제안 + 구현 진행 승인을 동시에 요청, 둘 다 승인 시에만 진행
  - 자동 검증: `pnpm exec tsc --noEmit`, `pnpm lint` 각 Task 완료 후 실행
  - 수동 검증 항목은 `TODO: <항목>` 형식으로 표시 후 완료 보고에 포함
  - feature-name: `$ARGUMENTS` 전달 또는 `docs/ai/plans/` 목록 선택
  - Plan 변경 필요 시: plan 수정 + 구현 동시 승인 요청
  - 완료 보고 4-section: 변경 파일 요약 / Task별 완료 여부 / 검증 결과 / 남은 리스크
  - 완료 후 `/png-handoff` 또는 `/png-pr` 실행 안내
  - `docs/ai/README.md` 추가 커맨드 목록 업데이트

- 제외(Out of Scope):
  - plan 파일 자동 생성 (`/png-plan` 담당)
  - 자동 커밋/푸시
  - 복수 feature 동시 구현
  - UI/수동 확인 항목 자동 실행 (시뮬레이터 실행 등)
  - 중단 시 git restore 자동 실행 (제안만 제공, 자동 실행 없음)

## 4) 사용자 시나리오

- 시나리오 A (정상 흐름):
  - Given: `docs/ai/plans/login-flow-plan.md`에 Task 1~3이 정의되어 있다.
  - When: `/png-implement login-flow` 실행
  - Then: Task 목록을 보여주고 Task 1부터 순차 구현. 각 Task 완료 후 tsc/lint 실행 및 사용자 확인. 전체 완료 후 4-section 보고 출력.

- 시나리오 B (plan 밖 작업 필요):
  - Given: Task 2 구현 중 plan에 없는 `src/utils/auth.ts` 수정이 필요함.
  - When: 해당 변경 필요 시점
  - Then: 변경 이유와 내용 + plan 수정 제안을 동시에 제시. 승인 시 plan 업데이트 + 구현 진행. 거부 시 현재 Task 범위 내에서 재접근.

- 시나리오 C (plan 변경 필요):
  - Given: Task 3 수행 중 당초 접근 방식이 비효율적임을 발견.
  - When: 대안 접근 방식 필요 시점
  - Then: 대안 접근 + plan Task 3 수정 내용을 함께 제안. 승인 시 plan 수정 + 수정된 접근으로 구현.

- 시나리오 D (feature-name 미전달):
  - Given: `docs/ai/plans/`에 파일이 여러 개 존재.
  - When: `/png-implement` 실행 (인자 없음)
  - Then: plan 파일 목록을 보여주고 사용자 선택 요청.

## 5) UI/UX 요구사항

N/A — CLI 도구

## 6) 데이터/API 요구사항

N/A

## 7) 상태 관리

N/A

## 8) 기술 제약 체크

- [ ] NativeWind `className`만 사용 — 구현 대상 코드에 적용
- [ ] `StyleSheet.create()` 미사용 — 구현 대상 코드에 적용
- [ ] `@/` alias 사용 — 구현 대상 코드에 적용
- [ ] 타입 정의 명확 — 구현 대상 코드에 적용
- [ ] 디자인 토큰 준수 — 구현 대상 코드에 적용

## 9) 수용 기준 (Acceptance Criteria)

- [ ] AC1: plan 파일을 로드해 Task 목록을 표시하고, Task 1부터 순차 구현을 시작한다.
- [ ] AC2: 각 Task 완료 후 "다음 Task로 진행할까요?" 사용자 확인을 받는다. 거부 시 중단하고 현재까지 보고한다.
- [ ] AC3: Plan에 없는 파일 변경이 필요하면 plan 수정 제안 + 구현 승인을 동시에 요청하고, 승인 없이는 해당 변경을 실행하지 않는다.
- [ ] AC4: 각 Task 완료 후 `pnpm exec tsc --noEmit`와 `pnpm lint`를 자동 실행하고, 수동 검증 항목은 `TODO: <항목>` 형식으로 표시한다.
- [ ] AC5: 완료 보고에 변경 파일 요약 / Task별 완료 여부 / 검증 결과 / 남은 리스크 4개 섹션이 포함된다.
- [ ] AC6: 완료 후 `/png-handoff` 또는 `/png-pr` 실행 안내를 제공한다.

## 10) 테스트 시나리오

- 정상 케이스: plan 존재, 전체 Task 순차 실행 → 4-section 완료 보고 출력
- 경계 케이스: 중간 Task에서 사용자 거부 → 현재까지 완료된 Task 목록 + 보고 출력
- 경계 케이스: Task 3부터 시작 입력 → Task 1~2 건너뛰고 Task 3부터 실행 확인
- 실패 케이스: plan 파일 없음 → 오류 메시지 출력 후 중단

## 11) 오픈 이슈 / 결정 필요

- [결정 완료] 중단(abort) 처리: 변경 파일은 그대로 유지. 중단 보고에 `git restore` 제안 포함.
- [결정 완료] Spec 참조 여부: plan + spec 둘 다 Read해 각 Task의 맥락을 강화.
- [결정 완료] Task 시작점 선택: 실행 전 "몇 번 Task부터 시작할까요?" 확인 (기본값 1).

---

## 작성 시 참고 문서

- 구현 규칙: `CLAUDE.md`
- AI 협업 표준: `docs/ai/README.md`
- 유사 커맨드 참조: `.claude/commands/png-plan.md`, `.claude/commands/png-review.md`
