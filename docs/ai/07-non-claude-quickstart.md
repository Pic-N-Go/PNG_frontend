# Non-Claude Quickstart

ChatGPT / Gemini / Copilot / Codex 등 **Claude Code가 아닌 AI**를 사용할 때의 시작 가이드입니다.

> Claude Code 사용자는 `/png-intake` 커맨드로 자동 진행됩니다. 이 문서는 **수동으로 동일한 플로우를 따르는 방법**을 설명합니다.

---

## 전체 플로우

```
1. 브랜치 생성
      ↓
2. AI에게 프로젝트 컨텍스트 전달  ← 이 문서의 핵심
      ↓
3. Intake (요구사항 정제 + spec/plan 작성)
      ↓
4. 구현
      ↓
5. 커밋 & PR
```

---

## Step 1 — 브랜치 생성

작업 전에 브랜치를 먼저 생성합니다. 브랜치명은 이후 산출물 경로에 그대로 사용됩니다.

```bash
git checkout -b feature/<작업명>
# 예: git checkout -b feature/login-screen
```

브랜치명 컨벤션 → `.github/CONVENTIONS.md` 참고

---

## Step 2 — AI 대화 첫 턴: 컨텍스트 전달

새 대화를 시작하면 AI는 이 프로젝트를 전혀 모릅니다.  
**첫 턴에 아래 프롬프트를 그대로 복붙**하고, 지정된 파일 내용을 함께 첨부하거나 붙여넣습니다.

```
아래 문서들을 읽고 프로젝트 규칙을 파악해줘. 파악이 끝나면 "준비 완료"라고만 말해.
코드 수정은 아직 하지 마.

--- CLAUDE.md ---
[CLAUDE.md 파일 내용 전체 붙여넣기]

--- docs/ai/00-context.md ---
[00-context.md 파일 내용 전체 붙여넣기]
```

> **파일 내용 붙여넣는 방법**
> - ChatGPT/Gemini: 파일을 직접 첨부하거나, 내용을 복사해서 붙여넣기
> - Copilot (VS Code): 파일을 열어둔 상태에서 `#파일명`으로 참조
> - Codex: 레포 디렉터리를 연결하면 파일 경로만 언급해도 읽음

---

## Step 3 — Intake (요구사항 정제)

컨텍스트 전달이 완료되면 아래 프롬프트로 Intake를 시작합니다.

> `<branch>` = Step 1에서 생성한 브랜치명 (예: `feature/login-screen`)  
> `<feature-name>` = 작업 이름, 소문자 kebab-case (예: `login-screen`)

```
코드 수정은 하지 말고 Intake(요구사항 정제)만 먼저 진행해줘.

추가로 아래 문서도 읽어줘:
- docs/ai/05-intake-workflow.md
- docs/ai/01-feature-spec-template.md
- docs/ai/02-implementation-plan-template.md
[UI 작업이면] - docs/guide/dev/ui-publishing.md

내가 만들 기능:
[자연어로 기능 설명]

요청:
1) Clarifying Questions (5~8개, 우선순위 순)
2) Draft Scope — In Scope / Out of Scope
3) Spec Draft (수용 기준 AC 3개 이상)
4) Plan Draft (Task 단위 분해)
5) Open Decisions

산출물 저장 경로 (브랜치명 그대로 사용):
- docs/ai/specs/<branch>/<feature-name>.md
- docs/ai/plans/<branch>/<feature-name>-plan.md

구현 코드는 내가 승인하기 전까지 작성하지 않음.
```

Intake 결과를 확인한 뒤 수정이 필요하면 피드백 → AI가 반영 → 재확인.  
**"이대로 진행해줘"** 라고 하면 구현 단계로 넘어갑니다.

---

## Step 4 — 구현

Intake 승인 후 아래 프롬프트로 구현을 시작합니다.

```
이제 구현 단계로 진행해줘.

아래 문서를 기준으로 작업해:
- docs/ai/00-context.md
- docs/ai/specs/<branch>/<feature-name>.md
- docs/ai/plans/<branch>/<feature-name>-plan.md

요청:
- plan의 Task 순서대로 구현
- 각 Task 완료 후 변경 파일 목록 보고
- 전체 완료 후 검증 결과 보고
  - tsc 결과:
  - lint 결과:
  - 수동 테스트 항목:
  - 남은 리스크:
```

---

## Step 5 — 커밋 & PR

구현 완료 후:

1. **커밋 메시지 형식** → `.github/CONVENTIONS.md` 참고
2. **PR 전 체크리스트** → `docs/ai/03-pr-review-checklist.md` 확인

```
커밋 메시지 초안을 작성해줘.
.github/CONVENTIONS.md의 형식을 따라야 해.
```

3. **UI 작업이 있었다면** — 퍼블리싱 파일 진행 상태(`scripts/filelist-data.json`)도 갱신

```
이번에 구현한 게 src/components/ui/ 아래 어떤 mockup 파일에 대응하는지 확인해서,
scripts/filelist-data.json에서 해당 파일의 uiStatus를 완료로 갱신하고 date를 오늘 날짜로 넣어줘.
API 연동은 아직 안 했으면 apiStatus는 미시작으로 유지해줘.
수정 후 pnpm filelist를 실행해서 src/html/filelist.html을 재생성해줘.
```

4. **PR 제목/본문 초안 작성** — 커밋 완료 후 아래 프롬프트로 요청

```text
.github/pull_request_template.md 를 읽고 같은 섹션 구조로 PR 제목/본문 초안을 작성해줘.
- 해당 없는 섹션(예: UI 변경 없으면 스크린샷)은 빈 칸으로 남기지 말고 섹션째로 삭제해줘.
- 불확실한 정보(테스트 결과, CI 통과 여부 등)는 TODO: 로 표시해줘.
- 작성한 제목과 본문 전체를 그대로 보여주고, 내가 승인하기 전까지는 PR을 만들거나 push하지 마.
```

5. **승인 후 PR 생성** — 사용하는 AI가 셸 명령을 실행할 수 있다면(Codex 등) 아래처럼 이어서 요청, 아니라면 아래 명령을 직접 터미널에 실행

```text
승인했으니 이제 진행해줘.
필요하면 git push -u origin "<branch>" 로 브랜치를 올리고,
승인한 본문을 파일(예: pr-body.md)로 저장한 뒤
gh pr create --title "<위에서 승인한 제목>" --body-file pr-body.md --base main --head "<branch>"
로 PR을 생성해줘. (본문에 백틱·따옴표가 있어도 안전하도록 --body 대신 --body-file 사용)
```

---

## 자주 하는 실수

| 실수 | 올바른 방법 |
|---|---|
| 컨텍스트 없이 바로 기능 요청 | Step 2 컨텍스트 전달 먼저 |
| Intake 없이 바로 코드 생성 | spec/plan 승인 후 구현 시작 |
| 산출물 경로를 임의로 지정 | `docs/ai/specs/<branch>/`, `docs/ai/plans/<branch>/` 규칙 준수 |
| `feat/` 브랜치명 사용 | `feature/` 접두사 사용 |

---

## 관련 문서

- 프로젝트 규칙: `CLAUDE.md`
- AI 워크플로우 개요: `docs/ai/00-context.md`
- Intake 절차 상세: `docs/ai/05-intake-workflow.md`
- 스펙 템플릿: `docs/ai/01-feature-spec-template.md`
- 계획 템플릿: `docs/ai/02-implementation-plan-template.md`
- PR 체크리스트: `docs/ai/03-pr-review-checklist.md`
- Claude Code 사용자: `docs/ai/06-claude-intake-starter-prompt.md`
