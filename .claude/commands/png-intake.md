---
allowed-tools: Read, Write, Edit, Bash(pnpm exec tsc:*), Bash(pnpm lint:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git restore:*), Bash(git branch:*), Bash(git ls-files:*), Bash(ls docs/ai/plans:*), Bash(ls docs/ai/specs:*), Bash(ls .claude/commands:*), Bash(ls .claude/skills:*)
description: 요구사항 정제 → 구현 → 커밋 → PR 초안까지 한 체인으로 실행
---

## 참고 스킬

- `.claude/skills/requirements-refiner/SKILL.md`
- `.claude/skills/task-executor/SKILL.md`
- `.claude/skills/git-message-helper/SKILL.md`
- `.claude/skills/pr-draft-writer/SKILL.md`
- `.claude/skills/doc-sync-checker/SKILL.md`

## 실행 지침

### Phase 1 — Intake (요구사항 정제)

0. 위 스킬 파일 5개를 모두 Read해 각 동작 규칙을 확인합니다.
1. 다음 문서를 읽고 프로젝트 제약을 반영합니다.
   - `docs/ai/00-context.md`
   - `docs/ai/05-intake-workflow.md`
   - `docs/ai/01-feature-spec-template.md`
   - `docs/ai/02-implementation-plan-template.md`
   - `CLAUDE.md`
   - `docs/ui-publishing.md` (UI 관련 기능이면 읽습니다)
2. 사용자의 자연어 설명을 바탕으로 질문 5~8개를 우선순위 순서로 제시합니다.
3. 답변을 반영해 `In Scope / Out of Scope`, `AC`, `Open Decisions`를 정리합니다.
4. feature-name을 소문자 kebab-case로 확정합니다.
5. 다음 산출물을 작성합니다.
   - `docs/ai/specs/<feature-name>.md`
   - `docs/ai/plans/<feature-name>-plan.md`
6. Spec Summary + Task Breakdown을 출력한 뒤 **반드시 멈추고** 아래 문구를 출력합니다.

   > **"spec/plan을 확인해 주세요. 이대로 구현을 시작할까요? 수정이 필요하면 알려주세요."**

   - 수정 요청 시: spec/plan을 수정하고 6번을 반복합니다.
   - 승인("응", "ㅇㅇ", "시작", "go", "yes" 등) 시: Phase 2로 자동 진행합니다.

---

### Phase 2 — 구현 (Phase 1 승인 직후 자동 시작)

사용자가 별도 명령을 입력하지 않아도 승인 즉시 아래를 실행합니다.

7. `docs/ai/plans/<feature-name>-plan.md`의 Task 목록을 표시합니다.
8. Task 1부터 순차 실행합니다. 각 Task마다:
   - 대상 파일이 있으면 Read합니다.
   - CLAUDE.md 규칙을 준수해 코드를 Write/Edit합니다.
   - `pnpm exec tsc --noEmit` 실행 → 오류 시 즉시 수정합니다.
   - `pnpm lint` 실행 → 오류 시 즉시 수정합니다.
   - CLAUDE.md 자체 점검: StyleSheet.create() 금지 · @/ alias · 디자인 토큰 · any 타입.
   - tsc/lint 오류가 **해당 Task 내에서** 2회 수정 후에도 남으면 오류 내용을 출력하고 **사용자 응답을 기다립니다.** (2회 카운트는 Task 단위로 초기화)
   - `✅ Task N 완료 — [변경 파일명]` 을 출력하고 **사용자 확인 없이** 다음 Task로 자동 진행합니다.
9. 사용자가 중단을 요청하면:
   - 변경 파일을 그대로 유지합니다.
   - 중단 Task 번호, 변경 파일 목록, 각 파일의 `git restore <파일>` 명령어를 안내합니다.
   - "재시작은 `/png-implement <feature-name>` 으로 해당 Task 번호부터 가능합니다." 를 안내합니다.
10. Plan에 없는 파일 변경이 필요한 경우:
    - 이유와 변경 내용을 제안하고 **사용자 승인을 기다립니다.** (이 지점만 멈춥니다)
    - 승인 시: plan 파일 수정 + 코드 작성을 동시에 진행합니다.
    - 거부 시: 현재 Task 범위 내에서 재접근합니다.
11. 전체 Task 완료 후 Changed Files Summary를 출력하고 Phase 3으로 자동 진행합니다.

---

### Phase 3 — 커밋 (Phase 2 완료 직후 자동 시작)

사용자가 별도 명령을 입력하지 않아도 자동 실행합니다.

12. `git status` + `git diff HEAD`로 변경 사항을 확인합니다.
13. `.github/CONVENTIONS.md`를 읽고 커밋 타입·포맷 규칙을 확인합니다.
14. 커밋 메시지 초안을 작성해 아래 형식으로 제안하고 **반드시 멈춥니다.**

    > **커밋 메시지 초안:**
    > `<type>(<scope>): <제목>`
    >
    > **"이대로 커밋할까요? 수정이 필요하면 알려주세요."**

    - 수정 요청 시: 메시지를 수정하고 14번을 반복합니다.
    - 승인 시: `git add` (변경된 파일만, .env 제외) + `git commit` 실행 후 Phase 4로 자동 진행합니다.
    - Phase 3 이후 중단을 요청하면: 커밋은 이미 완료된 상태입니다. PR 초안은 언제든 `/png-pr`로 별도 실행할 수 있습니다.

---

### Phase 4 — PR 초안 (커밋 완료 직후 자동 시작)

사용자가 별도 명령을 입력하지 않아도 자동 실행합니다.

15. 문서 동기화 점검 (doc-sync):
    - `.claude/skills/doc-sync-checker/SKILL.md` 매핑 규칙에 따라 Required 누락 항목을 탐지합니다.
    - Required 항목이 있으면 수정 내용을 제시하고 **승인을 받은 후에만** 수정합니다.
    - 없으면 바로 다음 단계로 진행합니다.
16. `.github/pull_request_template.md`를 읽고 PR 초안을 작성합니다.
    - 저장 경로: `docs/ai/pr-drafts/<feature-name>-pr.md`
    - 불확실한 정보는 `TODO:` 로 명시합니다.
    - 실제 `gh pr create` 는 실행하지 않습니다.

---

### Phase 5 — 완료 안내 (자동 출력)

17. 아래 형식으로 최종 요약을 출력합니다.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 완료: <feature-name>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
변경 파일  | (목록)
커밋       | <커밋 메시지>
PR 초안    | docs/ai/pr-drafts/<feature-name>-pr.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

선택 가능한 다음 단계:
  /png-test-case   테스트 케이스 체크리스트
  /png-qa          QA 세션 운영
  /png-review      코드 품질 점검
  /png-handoff     팀원 인수인계 문서
```

---

## 확인 게이트 요약

| 게이트 | 조건 | 동작 |
|---|---|---|
| spec/plan 승인 | Phase 1 완료 후 | 사용자 응답 대기 |
| plan 외 파일 변경 | Phase 2 중 예외 발생 시 | 사용자 응답 대기 |
| 커밋 메시지 승인 | Phase 3 | 사용자 응답 대기 |
| doc-sync Required | Phase 4 중 누락 발견 시 | 사용자 응답 대기 |
| tsc/lint 오류 2회 초과 | Phase 2 각 Task | 사용자 응답 대기 |
| 사용자 중단 요청 | Phase 2 중 언제든 | 중단 지점·파일 목록·restore 명령어 안내 |
| 그 외 모든 Task 전환 | Phase 2 Task 간 | 자동 진행 (대기 없음) |
