# Harness Self Audit Checklist

하네스 문서/커맨드 변경 후, 팀 배포 전에 아래 항목으로 셀프 점검합니다.

---

## Critical (흐름 중단 방지)

- [ ] Intake 수동 프롬프트(`docs/ai/06-claude-intake-starter-prompt.md`)가 아래 문서를 모두 읽도록 명시되어 있는가
  - `docs/ai/00-context.md`
  - `docs/ai/05-intake-workflow.md`
  - `docs/ai/01-feature-spec-template.md`
  - `docs/ai/02-implementation-plan-template.md`
- [ ] Intake 결과 산출물 경로가 일관적인가
  - `docs/ai/specs/<branch>/<feature-name>.md`
  - `docs/ai/plans/<branch>/<feature-name>-plan.md`
- [ ] 존재하지 않는 파일 경로를 참조하는 문서가 없는가
- [ ] `/png-handoff`가 spec/plan 두 문서 모두 존재할 때만 실행하고, 없으면 즉시 중단하는지
- [ ] `/png-handoff-clean`이 `docs/ai/handoffs/` 외부 경로를 거부하는지

---

## Major (품질/일관성)

- [ ] 동일 흐름의 출력 포맷 용어가 통일되어 있는가
  - 예: `Spec Draft Summary` / `Plan Draft Summary`
  - 대상: `.claude/commands/png-intake.md`, `docs/ai/06-claude-intake-starter-prompt.md`, `docs/ai/07-non-claude-quickstart.md`
- [ ] 팀 작업 순서의 단일 기준 문서가 명확한가
  - 기준: `docs/ai/README.md`
- [ ] 개인 보조 문서가 팀 표준 문서를 덮어쓰지 않는가
  - `docs/guide/dev/prompt-writing-guide.md`는 보조 역할만 수행
- [ ] 비클로드 시작 경로가 독립 문서로 명확히 제공되는가
  - 기준: `docs/ai/07-non-claude-quickstart.md`
- [ ] `docs/ai/00-context.md`와 `CLAUDE.md` 간 우선순위가 명시되어 있는가
  - 충돌 시 `CLAUDE.md` 우선
- [ ] 커밋 커맨드 문서가 컨벤션 기준 경로를 명시하는가
  - `.github/CONVENTIONS.md`
- [ ] handoff 문서 저장 경로가 `docs/ai/handoffs/<feature-name>-handoff.md` 규칙을 따르는지

---

## Minor (사용성/운영성)

- [ ] 템플릿 입력 필드에 최소 형식 예시가 있는가
  - 담당자, 관련 이슈 등
- [ ] 구현 계획 템플릿에 Task 개수 유연 사용 안내가 있는가
- [ ] `/png-intake`와 수동 프롬프트의 관계가 정확히 설명되어 있는가
  - `/png-intake` 기본, 수동은 대체 경로
- [ ] 문서 간 교차 참조(`참고 문서`)가 최신 상태인가

---

## 검증 실행 체크

- [ ] 비클로드 에이전트로 Intake 프롬프트 1회 실행
- [ ] 비클로드 시작 가이드(`docs/ai/07-non-claude-quickstart.md`) 순서대로 1회 리허설
- [ ] 클로드에서 `/png-intake` 1회 실행
- [ ] 두 실행 결과의 산출물 구조(`spec`/`plan`)가 동일한지 확인
- [ ] `/png-handoff` 1회 실행 — spec/plan 존재 케이스와 없는 케이스 각각 확인
- [ ] `/png-implement` 1회 실행 — Task 1개 이상 완료 + 중단 분기 확인
- [ ] `/png-test-case` 1회 실행 — 기본 / `--run-checks` / `--save` 중 최소 2개 케이스 확인
- [ ] `/png-qa` 1회 실행 — create → update → finalize 전체 흐름 확인
- [ ] PR 전 `docs/ai/03-pr-review-checklist.md`까지 통과

---

## 배포 판정

- [ ] Critical 항목 전부 통과
- [ ] Major 항목 전부 통과
- [ ] Minor 항목 중 미해결 사항은 PR 본문에 명시
- [ ] 최종 판정: 팀 배포 가능 / 보완 필요
