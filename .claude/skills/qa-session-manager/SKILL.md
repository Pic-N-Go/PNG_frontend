# QA Session Manager Skill

feature 기준 QA 세션을 생성·업데이트·판정하는 스킬입니다.

## 목적

- test-case 체크리스트 또는 git diff 기반으로 QA 세션을 구조적으로 운영한다.
- PASS/FAIL/BLOCKED/NOT RUN 상태와 재현 정보를 일관된 포맷으로 기록한다.
- 지표 기반 Go / Conditional Go / No-Go 판정을 제안하고 사용자 확인을 받는다.

## 모드 정의

- `create <feature-name>`: QA 세션 초안 생성
- `update <feature-name>`: 항목별 상태 및 재현 정보 기록
- `finalize <feature-name>`: 지표 요약 + 판정 제안 + 사용자 확인

## 입력 우선순위

1. `docs/ai/test-cases/<feature-name>-test-cases.md` (있으면 반드시 로드)
2. `git diff HEAD` + untracked 파일 (test-case 없을 때 최소 체크리스트 자동 생성)

test-case 문서가 없으면: "**[안내] test-case 문서가 없어 diff 기준 최소 체크리스트를 생성했습니다**"를 세션 첫 줄에 표기한다.

## 상태 정의

| 상태 | 의미 |
|---|---|
| `PASS` | 기대 결과와 일치 |
| `FAIL` | 기대 결과와 불일치 — 재현 정보 기록 필수 |
| `BLOCKED` | 선행 조건 미충족으로 실행 불가 — 재현 정보 기록 필수 |
| `NOT RUN` | 미실행 |

## 자동 분리 규칙

- `FAIL` 항목 → **결함(Defect)** 으로 Defects & Blockers 섹션에 기록
- `BLOCKED` 항목 → **블로커(Blocker)** 로 Defects & Blockers 섹션에 기록
- plan 범위 밖 이슈 → "추가 확인 필요" 섹션으로 분리 (본 섹션에 포함하지 않음)

## 재현 정보 필수 필드 (FAIL/BLOCKED 항목)

FAIL·BLOCKED 항목은 아래 4개 필드를 반드시 기록한다. 미입력 시 업데이트를 완료하지 않는다.

```
- 재현 단계: <순서대로 기술>
- 기대 결과: <무엇이 일어나야 했는가>
- 실제 결과: <무엇이 실제로 일어났는가>
- 영향 범위: <어느 화면/기능/사용자에게 영향>
```

## Go / Conditional Go / No-Go 판정 기준

| 판정 | 조건 |
|---|---|
| **Go** | 블로커 0, FAIL 0, NOT RUN 0 |
| **Conditional Go** | 블로커 0, FAIL 또는 NOT RUN 존재 — 조건(후속 수정 항목)을 명시 |
| **No-Go** | 블로커 1개 이상 |

판정 제안 후 반드시 "위 판정에 동의하시나요? (최종 확인)" 사용자 확인을 요청한다.

## 4-section 완료 보고 포맷

```
1) QA Session Summary
   - feature: <feature-name>
   - 총 케이스: N / 실행: N / PASS: N / FAIL: N / BLOCKED: N / NOT RUN: N
   - test-case 소스: <파일 경로 또는 "diff 기준 최소 체크리스트">

2) Test Execution Status
   ### Unit
   - [PASS]     <케이스 설명>
   - [FAIL]     <케이스 설명>
   - [BLOCKED]  <케이스 설명>
   - [NOT RUN]  <케이스 설명>

   ### Integration
   ...

   ### Manual
   ...

3) Defects & Blockers
   ### 결함 (FAIL)
   - <케이스 설명>
     - 재현 단계: ...
     - 기대 결과: ...
     - 실제 결과: ...
     - 영향 범위: ...

   ### 블로커 (BLOCKED)
   - <케이스 설명>
     - 재현 단계: ...
     - 기대 결과: ...
     - 실제 결과: ...
     - 영향 범위: ...

   ### 추가 확인 필요 (plan 범위 밖)
   - <이슈 설명>

4) Final QA Decision & Risks
   판정 제안: Go / Conditional Go / No-Go
   근거: <판정 기준과 지표 요약>
   Conditional Go 조건: <후속 수정 항목 목록 (해당 없으면 생략)>
   남은 리스크: <미검증 항목, 회귀 가능성 등 (없으면 None)>
```
