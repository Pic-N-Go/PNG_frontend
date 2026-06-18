# Task Executor Skill

`docs/ai/plans/<feature-name>-plan.md`의 Task Breakdown을 단일 기준으로 삼아 코드를 step-by-step으로 구현하는 스킬입니다.

## 목적

- plan의 Task Breakdown을 단일 기준으로 삼아 구현 범위를 고정한다.
- Task 단위 실행 + 자동 검증 + 사용자 확인으로 구현 품질을 일관되게 유지한다.
- Plan 밖 작업은 승인 없이 진행하지 않는다.

## 입력

- `docs/ai/plans/<feature-name>-plan.md` (Task Breakdown 기준 — 필수)
- `docs/ai/specs/<feature-name>.md` (설계 맥락 강화용)
- `CLAUDE.md` (구현 규칙: NativeWind, @/ alias, 타입 정의 등)

## 동작 규칙

1. plan과 spec 두 문서를 모두 Read한 뒤 구현을 시작한다.
2. Task 목록을 표시하고 시작 Task 번호를 확인한다. (기본값: 1, 사용자 변경 가능)
3. 각 Task 실행 순서:
   a. 대상 파일이 있으면 Read한다 (기존 파일인 경우).
   b. CLAUDE.md 구현 규칙을 준수해 코드를 작성한다 (Write/Edit).
   c. `pnpm exec tsc --noEmit`를 실행한다. 오류 시 즉시 수정 후 재실행.
   d. `pnpm lint`를 실행한다. 오류 시 즉시 수정 후 재실행.
   e. 수동 검증 항목은 `TODO: <항목>` 형식으로 표시하고 완료 보고에 포함한다.
   f. "Task N 완료. 다음 Task로 진행할까요?" 사용자 확인을 받는다.
4. Plan에 없는 파일 변경이 필요하면: 변경 이유 + plan 수정 내용 + 구현 내용을 동시에 제안한다. 승인 시에만 plan Write + 코드 Write/Edit를 실행한다. 거부 시 현재 Task 범위 내에서 재접근한다.
5. Plan의 접근 방식 변경이 필요하면: 대안 접근 + plan Task 수정 내용을 동시에 제안한다. 승인 시에만 plan Write + 수정된 방식으로 구현한다.
6. 사용자가 중단을 요청하면: 변경 파일을 그대로 유지하고, 완료 보고에 중단 시점 Task, 변경 파일 목록, `git restore` 제안을 포함한다.
7. 각 Task 완료 후 CLAUDE.md 위반 사항(StyleSheet, 상대경로 import, any 타입, 디자인 토큰)을 자체 점검한다.

## CLAUDE.md 핵심 준수 항목

- NativeWind `className`만 사용 (`StyleSheet.create()` 금지)
- `@/` alias 사용 (상대경로 `../../` 금지)
- 타입 누락 / `any` 남용 금지
- API 로직을 screen 컴포넌트에 하드코딩 금지
- 디자인 토큰 준수 (`#E31B59`, 52px 버튼, Pretendard 폰트 등)

## 출력 형식 (4-section 완료 보고)

```
1) Changed Files Summary
   - <파일 경로> — <1줄 요약>

2) Task Completion Status
   - Task 1: ✓ / ✗ / △ (부분 완료)

3) Verification Results
   - tsc: 통과 / 실패 상세
   - lint: 통과 / 실패 상세
   - TODO 수동 검증 항목: <목록 또는 None>

4) Remaining Risks
   - <미완료 Task, 열린 TODO, 잠재적 리스크 목록 또는 None>
```

## 중단 보고 추가 항목

중단 시 완료 보고에 아래를 추가한다.

- 중단 시점: Task N
- 변경된 파일 목록
- 되돌리려면: `git restore <파일>` 또는 `git restore .`
