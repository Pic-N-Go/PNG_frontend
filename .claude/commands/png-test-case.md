---
allowed-tools: Read, Write, Bash(git diff:*), Bash(git status:*), Bash(git ls-files:*), Bash(git branch:*), Bash(ls docs/ai/plans:*), Bash(pnpm exec tsc:*), Bash(pnpm lint:*), Bash(mkdir:*)
description: 변경사항 기준 테스트 케이스 체크리스트 생성 (Unit/Integration/Manual 타입 구분)
---

## 참고 스킬

- `.claude/skills/test-case-generator/SKILL.md`

## Context

- 현재 git 상태: !`git status`
- 변경 내용: !`git diff HEAD`
- Untracked 파일: !`git ls-files --others --exclude-standard`

## 실행 지침

1. `.claude/skills/test-case-generator/SKILL.md`를 Read해 케이스 생성 규칙과 보고 포맷을 확인합니다.
2. `$ARGUMENTS`를 파싱합니다.
   - feature-name: 플래그(`--run-checks`, `--save`)가 아닌 첫 번째 토큰
     (`../` 포함 시 즉시 거부, `/`는 `-`로 치환, `.md` 확장자 포함 시 제거)
   - `--run-checks`: tsc/lint 실제 실행 여부
   - `--save`: 케이스 파일 저장 여부
   - 예: `/png-test-case login-flow --run-checks --save` → feature-name=login-flow, 두 플래그 모두 활성
3. feature-name을 확정합니다.
   - feature-name이 있으면 그 값을 사용합니다.
   - 없으면 `git branch --show-current`로 브랜치명(`<branch>`)을 구해 `ls docs/ai/plans/<branch>/`로 목록을 표시하고 사용자에게 선택을 요청합니다.
4. `git branch --show-current`로 현재 브랜치명(`<branch>`)을 구한 뒤 plan과 spec을 Read합니다.
   - `docs/ai/plans/<branch>/<feature-name>-plan.md`
   - `docs/ai/specs/<branch>/<feature-name>.md`
   - plan 파일이 없으면: "**[주의] plan 연계 불가 — diff 기준으로만 케이스를 생성합니다**" 경고를 출력하고 계속 진행합니다.
   - spec 파일만 없으면: 경고 없이 생략하고 plan + diff 기준으로 진행합니다.
5. Context의 git diff와 untracked 파일을 확인합니다.
   - 변경사항이 없으면 "변경사항 없음 — 테스트 케이스를 생성할 대상이 없습니다"를 출력하고 중단합니다.
6. SKILL.md 규칙에 따라 테스트 케이스를 생성합니다.
   - Unit / Integration / Manual 타입 구분
   - 정상 / 경계 / 실패 시나리오 각 1개 이상 포함
   - 수동 확인 항목은 `TODO: <항목>` 형식으로 표시
   - plan 범위 밖 케이스는 "권장 추가" 섹션으로 분리
7. 체크리스트를 출력한 후 "코드 스니펫도 추가할까요?" 사용자 확인을 요청합니다.
   - 승인 시: Unit/Integration 케이스에 Jest 형태 스니펫 예시를 추가합니다.
   - 거부 시: 체크리스트를 최종 출력으로 사용합니다.
8. 플래그에 따라 추가 동작을 실행하고 4-section 보고를 출력합니다.
   - `--run-checks`: `pnpm exec tsc --noEmit` → `pnpm lint` 순으로 실행하고 결과를 3) 섹션에 포함합니다.
   - `--save`: step 7 결정 후 확정된 최종 체크리스트 기준으로 `mkdir -p docs/ai/test-cases`를 실행한 후 `docs/ai/test-cases/<feature-name>-test-cases.md`에 저장합니다.
   - 완료 후 `/png-qa create <feature-name>`, `/png-handoff`, `/png-pr`, `/png-test-case --run-checks` 다음 단계를 안내합니다.

## 출력 형식

1) 대상 변경 요약
2) 생성된 테스트 케이스 목록
3) 실행/검증 결과 (또는 실행 가이드)
4) 남은 리스크
