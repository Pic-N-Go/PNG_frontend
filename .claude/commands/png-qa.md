---
allowed-tools: Read, Write, Bash(git diff:*), Bash(git status:*), Bash(git ls-files:*), Bash(ls docs/ai/test-cases:*), Bash(ls docs/ai/plans:*), Bash(mkdir:*)
description: QA 세션 생성/업데이트/판정 운영 (create / update / finalize)
---

## 참고 스킬

- `.claude/skills/qa-session-manager/SKILL.md`

## Context

- 현재 git 상태: !`git status`
- 변경 내용: !`git diff HEAD`
- Untracked 파일: !`git ls-files --others --exclude-standard`

## 실행 지침

1. `.claude/skills/qa-session-manager/SKILL.md`를 Read해 모드 정의, 상태 규칙, 판정 기준, 보고 포맷을 확인합니다.
2. `$ARGUMENTS`를 파싱합니다.
   - 첫 번째 토큰: 모드 (`create` / `update` / `finalize`)
     - 모드가 없거나 세 가지 외 값이면 "모드를 지정해주세요: `/png-qa create|update|finalize <feature-name>`"를 출력하고 중단합니다.
   - 두 번째 토큰: feature-name (플래그 제외)
     (`../` 포함 시 즉시 거부, `/`는 `-`로 치환, `.md` 확장자 포함 시 제거)
   - `--save`: QA 보고 파일 저장 여부
   - 예: `/png-qa create login-flow --save` → mode=create, feature-name=login-flow, --save 활성
3. feature-name을 확정합니다.
   - feature-name이 있으면 그 값을 사용합니다.
   - 없으면 `ls docs/ai/plans/`로 목록을 표시하고 사용자에게 선택을 요청합니다.
4. 모드별로 실행합니다.

   **create 모드**
   a. `ls docs/ai/test-cases/`로 `<feature-name>-test-cases.md` 존재 여부를 확인합니다.
   b. 파일이 있으면 Read해 체크리스트를 로드합니다.
   c. 없으면 Context의 git diff와 untracked 파일을 기반으로 최소 체크리스트를 생성합니다. SKILL.md에 정의된 안내 메시지를 세션 첫 줄에 표기합니다.
   d. QA 세션 초안(4-section 보고 골격)을 출력합니다.

   **update 모드**
   a. `docs/ai/test-cases/<feature-name>-test-cases.md` 또는 기존 QA 보고(`docs/ai/qa-reports/<feature-name>-qa.md`)를 Read합니다.
      두 파일이 모두 없으면: "test-cases·qa-reports 파일이 없습니다 — 먼저 `/png-qa create <feature-name>`을 실행하세요"를 출력하고 중단합니다.
   b. 각 항목의 상태(PASS/FAIL/BLOCKED/NOT RUN)를 사용자에게 입력받아 기록합니다.
   c. FAIL·BLOCKED 항목은 SKILL.md 재현 정보 4개 필드(재현 단계·기대 결과·실제 결과·영향 범위)를 필수로 입력받습니다. 미입력 시 해당 항목 업데이트를 완료하지 않습니다.
   d. FAIL → 결함, BLOCKED → 블로커로 Defects & Blockers 섹션에 자동 분리합니다.
   e. plan 범위 밖 이슈는 "추가 확인 필요" 섹션에 분리합니다.
   f. 업데이트된 4-section 보고를 출력합니다.

   **finalize 모드**
   a. 기존 QA 보고(`docs/ai/qa-reports/<feature-name>-qa.md`) 또는 현재 세션 update 결과를 기반으로 지표를 집계합니다.
   b. SKILL.md 판정 기준에 따라 Go / Conditional Go / No-Go를 판정 제안합니다.
   c. Conditional Go 판정 시 후속 수정 항목을 조건으로 명시합니다.
   d. "위 판정에 동의하시나요? (최종 확인)" 사용자 확인을 요청합니다.
   e. 확정된 판정을 포함한 4-section 보고를 출력합니다.

5. `--save` 플래그가 있으면:
   - `mkdir -p docs/ai/qa-reports`를 실행합니다.
   - `docs/ai/qa-reports/<feature-name>-qa.md`에 4-section 보고를 저장합니다.
6. 완료 후 `/png-pr`, `/png-handoff` 다음 단계를 안내합니다.

## 출력 형식

1) QA Session Summary
2) Test Execution Status
3) Defects & Blockers
4) Final QA Decision & Risks
