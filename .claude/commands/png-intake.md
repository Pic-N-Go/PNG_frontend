---
allowed-tools: Read, Write, Edit, Bash(pnpm exec tsc:*), Bash(pnpm lint:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git restore:*), Bash(git branch:*), Bash(git ls-files:*), Bash(git rev-parse:*), Bash(git push:*), Bash(gh pr create:*), Bash(rm -- docs/ai/pr-drafts/*), Bash(ls docs/ai/plans:*), Bash(ls docs/ai/specs:*), Bash(ls .claude/commands:*), Bash(ls .claude/skills:*), Bash(mkdir:*)
description: 요구사항 정제 → 구현 → 커밋 → PR까지 한 체인으로 실행 (PR 생성 직전 승인)
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
   - `docs/guide/dev/ui-publishing.md` (UI 관련 기능이면 읽습니다)
2. 사용자의 자연어 설명을 바탕으로 질문 5~8개를 우선순위 순서로 제시합니다.
3. 답변을 반영해 `In Scope / Out of Scope`, `AC`, `Open Decisions`를 정리합니다.
4. feature-name을 소문자 kebab-case로 확정합니다.
5. `git branch --show-current`로 현재 브랜치명(`<branch>`)을 구하고, 아래 디렉터리가 없으면 생성합니다.
   - `mkdir -p docs/ai/specs/<branch> docs/ai/plans/<branch>`
6. 다음 산출물을 작성합니다.
   - `docs/ai/specs/<branch>/<feature-name>.md`
   - `docs/ai/plans/<branch>/<feature-name>-plan.md`
6. Spec Summary + Task Breakdown을 출력한 뒤 **반드시 멈추고** 아래 문구를 출력합니다.

   > **"spec/plan을 확인해 주세요. 이대로 구현을 시작할까요? 수정이 필요하면 알려주세요."**

   - 수정 요청 시: spec/plan을 수정하고 7번을 반복합니다.
   - 승인("응", "ㅇㅇ", "시작", "go", "yes" 등) 시: Phase 2로 자동 진행합니다.

---

### Phase 2 — 구현 (Phase 1 승인 직후 자동 시작)

사용자가 별도 명령을 입력하지 않아도 승인 즉시 아래를 실행합니다.

8. `docs/ai/plans/<branch>/<feature-name>-plan.md`의 Task 목록을 표시합니다. (`<branch>`는 `git branch --show-current` 결과)
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
14. 커밋 메시지 초안을 작성해 아래 형식으로 출력하고 **반드시 멈춥니다.**

    아래 메시지로 커밋할까요? 수정이 필요하면 알려주세요.

    ```
    <type>(<scope>): <실제 작성한 커밋 제목>
    ```

    - 수정 요청 시: 메시지를 수정한 뒤 위 형식으로 **새 메시지를 다시 출력하고 사용자의 명시적 승인을 기다립니다.**
      수정 요청 자체는 승인이 아닙니다. 절대 자동으로 커밋하지 않습니다.
    - 승인("응", "ㅇㅇ", "yes", "go", "시작" 등) 시: `git add` (변경된 파일만, .env 제외) + `git commit` 실행 후 Phase 4로 자동 진행합니다.
    - Phase 3 이후 중단을 요청하면: 커밋은 이미 완료된 상태입니다. PR 생성은 언제든 `/png-pr`로 별도 실행할 수 있습니다.

---

### Phase 4 — PR 생성 (커밋 완료 직후 자동 시작)

사용자가 별도 명령을 입력하지 않아도 자동 실행하되, PR 생성 직전(16번)에는 반드시 멈춰서 승인을 받습니다.

15. 문서 동기화 점검 (doc-sync):
    - `.claude/skills/doc-sync-checker/SKILL.md` 매핑 규칙에 따라 Required 누락 항목을 탐지합니다.
    - Required 항목이 있으면 수정 내용을 제시하고 **승인을 받은 후에만** 수정합니다.
    - 없으면 바로 다음 단계로 진행합니다.
15-1. 퍼블리싱 파일 진행 상태 갱신 (UI 관련 기능인 경우):
    - 이번 작업이 `src/components/ui/` 아래 특정 mockup 파일(들)을 RN으로 구현한 것이면, `scripts/filelist-data.json`에서 해당 파일 항목의 `uiStatus`를 확인합니다.
    - `완료` 상태가 아니면 `완료`로 갱신하고 `date`를 오늘 날짜로 기입합니다 (API 연동이 남아있으면 `apiStatus`는 `미시작` 유지, 필요 시 `note`에 남은 범위 기록).
    - 어떤 mockup 파일에 대응하는지 불확실하면 사용자에게 확인 후 진행합니다.
    - 변경했다면 `pnpm filelist`를 실행해 `src/html/filelist.html`을 재생성합니다.
    - UI 관련 기능이 아니면(백엔드 연동, 설정 변경 등) 이 단계를 생략합니다.
16. `.claude/skills/pr-draft-writer/SKILL.md` 규칙에 따라 `.github/pull_request_template.md` 형식으로 PR 제목/본문 초안을 작성합니다.
    - 해당 없는 섹션은 삭제하고, 불확실한 정보는 `TODO:` 로 명시합니다.
    - 작성한 제목/본문 전체를 사용자에게 보여주고 **반드시 멈춰서** 승인 여부를 확인합니다.
    - **승인** 시: 원격 추적 브랜치가 없으면 `git push -u origin "<branch>"`, 있으면 필요 시 `git push`. 이후 승인된 본문을 `docs/ai/pr-drafts/<branch>-pr.md` 에 저장하고 `gh pr create --title "<제목>" --body-file "docs/ai/pr-drafts/<branch>-pr.md" --base main --head "<branch>"` 로 PR을 생성합니다(본문에 백틱·`$()`가 있어도 안전하도록 `--body` 대신 `--body-file` 사용, 브랜치명은 따옴표로 감쌈). 생성 성공 후 임시 초안 파일은 삭제합니다.
    - **수정 요청** 시: 반영 후 다시 보여주고 승인을 기다립니다.
    - **보류** 시: `docs/ai/pr-drafts/<feature-name>-pr.md` 로 저장만 하고 PR은 생성하지 않습니다.

---

### Phase 5 — 완료 안내 (자동 출력)

17. 아래 형식으로 최종 요약을 출력합니다.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 완료: <feature-name>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
변경 파일  | (목록)
커밋       | <커밋 메시지>
PR         | (승인 시) <PR URL> / (보류 시) docs/ai/pr-drafts/<feature-name>-pr.md
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
| filelist 대응 mockup 파일 불확실 | Phase 4 15-1단계 | 사용자 응답 대기 |
| PR 생성 승인 | Phase 4 16단계 | 사용자 응답 대기 |
| tsc/lint 오류 2회 초과 | Phase 2 각 Task | 사용자 응답 대기 |
| 사용자 중단 요청 | Phase 2 중 언제든 | 중단 지점·파일 목록·restore 명령어 안내 |
| 그 외 모든 Task 전환 | Phase 2 Task 간 | 자동 진행 (대기 없음) |
