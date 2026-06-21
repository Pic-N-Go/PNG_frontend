# 기능 스펙 — qa-command

## 1) 기능 정보

- 기능명: `/png-qa` 커맨드 + `qa-session-manager` 스킬
- 담당자: @yeni
- 관련 이슈: 없음
- 대상 플랫폼: N/A (Claude Code CLI 도구)

## 2) 문제와 목표

- 해결하려는 문제: QA 결과가 산발적으로 관리되고, 최종 Go/No-Go 판정 근거가 불명확함. test-case 체크리스트와 QA 실행 이력이 연결되지 않아 품질 추적이 어렵다.
- 사용자 가치: `/png-test-case` 산출물 또는 변경사항 기준으로 QA 세션을 구조적으로 운영하고, FAIL/BLOCKED 이슈를 일관된 포맷으로 기록하며, Go/No-Go 판정까지 팀 단일 기준으로 관리한다.
- 완료 기준(한 줄): `/png-qa create/update/finalize` 실행 시 QA 세션 운영 전 과정을 4-section 보고로 제공한다.

## 3) 범위

### 포함(In Scope)

- `.claude/commands/png-qa.md` 커맨드 신규 생성
- `.claude/skills/qa-session-manager/SKILL.md` 스킬 신규 생성
- 3-mode 운영:
  - `create <feature-name>`: test-case 문서 로드 또는 git diff 기준 최소 체크리스트 생성
  - `update <feature-name>`: 항목별 PASS/FAIL/BLOCKED/NOT RUN 상태 + 재현 정보 기록
  - `finalize <feature-name>`: 지표 요약 + AI 판정 제안 → 사용자 최종 확인
- FAIL + BLOCKED 항목 자동 분리: FAIL → 결함, BLOCKED → 블로커 (Defects & Blockers 섹션)
- FAIL/BLOCKED 항목 재현 정보 필수 입력: 재현 단계, 기대 결과, 실제 결과, 영향 범위
- Go / Conditional Go / No-Go 판정: AI 제안 + 사용자 최종 확인
- `--save` 플래그 → `docs/ai/qa-reports/<feature-name>-qa.md` 저장 (git 추적 포함)
- 4-section 보고 출력 (QA Session Summary / Test Execution Status / Defects & Blockers / Final QA Decision & Risks)
- `docs/ai/README.md` 업데이트
- `.claude/commands/png-test-case.md` 완료 안내에 `/png-qa create` 추가

### 제외(Out of Scope)

- 구현 코드 수정
- 자동 테스트 실행 (시뮬레이터·자동화 도구)
- 이슈 트래커(Jira, Linear) 자동 등록
- QA 문서 버전 이력 관리 (복수 revision 비교)
- 복수 feature 동시 QA 운영

## 4) 사용자 시나리오

- 시나리오 A (test-case 있는 경우 create):
  - Given: `docs/ai/test-cases/login-flow-test-cases.md` 존재
  - When: `/png-qa create login-flow` 실행
  - Then: test-case 체크리스트를 로드해 QA 세션 초안을 출력. `--save` 시 `docs/ai/qa-reports/login-flow-qa.md` 생성.

- 시나리오 B (test-case 없는 경우 create):
  - Given: test-case 문서 없음, git diff 변경사항 있음
  - When: `/png-qa create login-flow` 실행
  - Then: "test-case 문서가 없어 diff 기준 최소 체크리스트를 생성했습니다" 안내 후 자동 생성 및 출력.

- 시나리오 C (update — FAIL 항목):
  - Given: QA 세션 진행 중, 항목 하나 FAIL 발생
  - When: `/png-qa update login-flow` 실행 후 FAIL 항목 기록
  - Then: 재현 단계·기대 결과·실제 결과·영향 범위 입력 필수. 완료 후 Defects & Blockers 섹션에 결함으로 자동 분리.

- 시나리오 D (finalize — AI 판정):
  - Given: 모든 항목 상태 기록 완료
  - When: `/png-qa finalize login-flow` 실행
  - Then: 지표 요약(총 케이스/실행/PASS/FAIL/BLOCKED) + AI Go/Conditional Go/No-Go 제안 출력 → 사용자 최종 확인.

- 시나리오 E (--save):
  - Given: finalize 또는 update 실행 완료
  - When: `--save` 플래그 포함 실행
  - Then: `docs/ai/qa-reports/login-flow-qa.md` 파일 저장.

## 5) UI/UX 요구사항

N/A — CLI 도구

## 6) 데이터/API 요구사항

N/A

## 7) 상태 관리

N/A

## 8) 기술 제약 체크

- [ ] NativeWind `className`만 사용 — N/A (CLI 도구)
- [ ] `StyleSheet.create()` 미사용 — N/A (CLI 도구)
- [ ] `@/` alias 사용 — N/A (CLI 도구)
- [ ] 타입 정의 명확 — N/A (CLI 도구)
- [ ] 디자인 토큰 준수 — N/A (CLI 도구)

## 9) 수용 기준 (Acceptance Criteria)

- [ ] AC1: `create` 모드에서 test-case 문서가 있으면 로드하고, 없으면 git diff 기준 최소 체크리스트를 자동 생성한다. 최소 체크리스트 생성 시 안내 메시지를 출력한다.
- [ ] AC2: `update` 모드에서 항목별 PASS/FAIL/BLOCKED/NOT RUN 상태를 기록한다. FAIL·BLOCKED 항목은 재현 단계·기대 결과·실제 결과·영향 범위 입력이 필수다.
- [ ] AC3: FAIL 항목은 "결함"으로, BLOCKED 항목은 "블로커"로 구분해 Defects & Blockers 섹션에 자동 분리한다.
- [ ] AC4: `finalize` 모드에서 지표 요약(총 케이스/실행/PASS/FAIL/BLOCKED)과 함께 AI가 Go/Conditional Go/No-Go를 판정 제안하고, 사용자 최종 확인을 요청한다.
- [ ] AC5: `--save` 플래그 시 `docs/ai/qa-reports/<feature-name>-qa.md` 파일을 저장한다.
- [ ] AC6: 4-section 보고(QA Session Summary / Test Execution Status / Defects & Blockers / Final QA Decision & Risks)를 출력한다.
- [ ] AC7: plan 범위 밖 이슈는 "추가 확인 필요" 섹션으로 분리한다.

## 10) 테스트 시나리오

- 정상 케이스: test-case 있음 → `create` → 체크리스트 로드 → `update` → `finalize` → 4-section 보고 출력
- 경계 케이스: test-case 없음 → `create` → diff 기준 최소 체크리스트 생성 안내 확인
- 경계 케이스: `update` 시 FAIL 항목 → 재현 정보 없이 진행 시 입력 요구 확인
- 경계 케이스: `finalize` → AI 판정 제안 → 사용자 확인 흐름 동작 확인
- 정상 케이스: `--save` 플래그 → `docs/ai/qa-reports/` 파일 생성 확인

## 11) 오픈 이슈 / 결정 필요

- [결정 완료] QA 운영 방식: 모드 구분 (`create` / `update` / `finalize` 첫 번째 인자)
- [결정 완료] Go/No-Go 판정 주체: AI 제안 + 사용자 최종 확인
- [결정 완료] 치명 이슈 분리 기준: FAIL(결함) + BLOCKED(블로커) 모두 분리
- [결정 완료] test-case 없을 때: git diff 기준 최소 체크리스트 자동 생성
- [결정 완료] qa-reports/ git 추적: 포함 (팀 공유 아티팩트)
- [결정 완료] png-test-case 연계: `/png-test-case` 완료 안내에 `/png-qa create` 추가

---

## 작성 시 참고 문서

- 구현 규칙: `CLAUDE.md`
- AI 협업 표준: `docs/ai/README.md`
- 유사 커맨드 참조: `.claude/commands/png-test-case.md`, `.claude/commands/png-implement.md`
