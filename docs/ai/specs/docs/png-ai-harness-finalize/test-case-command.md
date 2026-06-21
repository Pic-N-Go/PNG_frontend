# 기능 스펙 — test-case-command

## 1) 기능 정보

- 기능명: `/png-test-case` 커맨드 + `test-case-generator` 스킬
- 담당자: @yeni
- 관련 이슈: 없음
- 대상 플랫폼: N/A (Claude Code CLI 도구)

## 2) 문제와 목표

- 해결하려는 문제: 구현 후 테스트 케이스가 산발적으로 관리되거나 누락됨. 어떤 케이스를 어떤 방식으로 검증해야 하는지 체계가 없음.
- 사용자 가치: git diff + plan/spec을 기준으로 정상/경계/실패 케이스를 자동 정리하고, Unit/Integration/Manual 타입을 구분해 일관된 테스트 체크리스트를 제공한다.
- 완료 기준(한 줄): `/png-test-case` 실행 시 변경사항 기반 테스트 케이스 체크리스트를 타입별로 출력하고, 4-section 보고를 제공한다.

## 3) 범위

- 포함(In Scope):
  - `.claude/commands/png-test-case.md` 커맨드 신규 생성
  - `.claude/skills/test-case-generator/SKILL.md` 스킬 신규 생성
  - git diff + untracked + plan/spec 기준 테스트 케이스 생성
  - plan 없이도 git diff만으로 케이스 생성 ("plan 연계 불가" 경고 포함)
  - 테스트 타입 구분: Unit / Integration / Manual
  - 자동 검증(tsc/lint) 별도 섹션 분리 표기
  - `--run-checks` 플래그 시 tsc/lint 실제 실행 후 결과 보고에 포함
  - 수동 확인 항목 `TODO: <항목>` 형식
  - 체크리스트 형태 기본 출력, 코드 스니펫 추가 여부 사용자 확인
  - plan 범위 밖 테스트는 "권장 추가" 섹션으로 분리 후 승인 요청
  - `--save` 플래그 시 `docs/ai/test-cases/<feature-name>-test-cases.md` 저장
  - 4-section 완료 보고
  - `/png-implement` step 8에 `/png-test-case` 실행 안내 추가
  - `docs/ai/README.md` 업데이트

- 제외(Out of Scope):
  - 테스트 코드 자동 실행 (프레임워크 미설정)
  - 구현 코드 수정
  - 복수 feature 동시 케이스 생성
  - 테스트 프레임워크 설치/설정
  - 테스트 결과 자동 추적

## 4) 사용자 시나리오

- 시나리오 A (plan 있는 경우):
  - Given: `docs/ai/plans/login-flow-plan.md`과 `docs/ai/specs/login-flow.md` 존재, git diff에 관련 변경사항 있음.
  - When: `/png-test-case login-flow` 실행
  - Then: plan + spec + diff 기준으로 Unit/Integration/Manual 케이스 생성, 체크리스트 출력. 이후 "코드 스니펫도 추가할까요?" 사용자 확인.

- 시나리오 B (plan 없는 경우):
  - Given: plan 없음, git diff에 변경사항 있음.
  - When: `/png-test-case` 실행 (plan 없는 feature-name 또는 인자 없음)
  - Then: "plan 연계 불가" 경고 출력 후 diff 기준으로 케이스 생성 계속.

- 시나리오 C (--run-checks):
  - Given: 변경사항 있음, plan 있음.
  - When: `/png-test-case login-flow --run-checks` 실행
  - Then: 체크리스트 생성 + tsc/lint 실행 → 3) 실행/검증 결과 섹션에 tsc/lint 결과 포함.

- 시나리오 D (--save):
  - Given: 케이스 생성 완료.
  - When: `/png-test-case login-flow --save` 실행
  - Then: `docs/ai/test-cases/login-flow-test-cases.md` 파일 저장.

- 시나리오 E (변경사항 없음):
  - Given: git diff 없음, untracked 없음.
  - When: `/png-test-case` 실행
  - Then: "변경사항 없음" 안내 후 중단.

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

- [ ] AC1: 정상/경계/실패 시나리오를 각 1개 이상 포함한 케이스 목록을 생성한다.
- [ ] AC2: 각 케이스에 Unit / Integration / Manual 타입 레이블을 부여한다.
- [ ] AC3: 자동 검증(tsc/lint)은 별도 섹션으로 분리 표기한다. `--run-checks` 플래그 시 실제 실행 결과를 보고에 포함한다.
- [ ] AC4: 수동 확인 항목은 `TODO: <항목>` 형식으로 표시한다.
- [ ] AC5: plan 범위 밖 테스트는 "권장 추가" 섹션으로 분리하고, 승인 없이는 체크리스트에 포함하지 않는다.
- [ ] AC6: `--save` 플래그 시 `docs/ai/test-cases/<feature-name>-test-cases.md` 파일을 생성한다.
- [ ] AC7: 4-section 보고(대상 변경 요약 / 테스트 케이스 목록 / 실행·검증 결과 / 남은 리스크)를 출력한다.

## 10) 테스트 시나리오

- 정상 케이스: plan + spec 존재 → Unit/Integration/Manual 케이스 생성 → 4-section 보고 출력
- 경계 케이스: plan 없음 → "plan 연계 불가" 경고 포함 후 diff 기준 케이스 생성 확인
- 경계 케이스: `--run-checks` 플래그 → tsc/lint 결과가 3) 섹션에 포함 확인
- 경계 케이스: `--save` 플래그 → `docs/ai/test-cases/` 파일 생성 확인
- 실패 케이스: git diff 없음 → "변경사항 없음" 안내 후 중단 확인

## 11) 오픈 이슈 / 결정 필요

- [결정 완료] `docs/ai/test-cases/` 저장 파일은 git 추적 포함 (.gitignore 추가 안 함).
- [결정 완료] 코드 스니펫 추가 트리거: 체크리스트 출력 후 "코드 스니펫도 추가할까요?" 사용자 확인 방식.

---

## 작성 시 참고 문서

- 구현 규칙: `CLAUDE.md`
- AI 협업 표준: `docs/ai/README.md`
- 유사 커맨드 참조: `.claude/commands/png-implement.md`, `.claude/commands/png-doc-sync.md`
