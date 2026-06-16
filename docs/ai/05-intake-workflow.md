# Intake 워크플로우 (요구사항 정제 0단계)

이 문서는 개발자가 자연어로 설명한 요구사항을 AI가 구현 가능한 스펙으로 정제하는 절차입니다.

팀 원칙:

- 어떤 AI를 쓰든 산출물은 동일 포맷(`docs/ai/specs`, `docs/ai/plans`)으로 남긴다.
- 클로드 사용자는 이 과정을 더 빠르게 시작할 수 있다.

---

## 언제 실행하나

- 요구사항이 아직 모호한 상태에서 기능을 시작할 때
- 범위(In/Out Scope)가 합의되지 않았을 때
- API/상태/UI 중 무엇이 바뀌는지 명확하지 않을 때

---

## 입력(개발자가 제공)

아래 4가지만 먼저 주면 시작 가능합니다.

1. 하고 싶은 기능 한 줄 설명
2. 왜 필요한지(문제/목표)
3. 참고 화면/파일(있으면)
4. 완료 기준(대략)

---

## AI가 해야 할 일 (Intake 단계)

1. 누락 정보를 확인하는 질문 5~8개 생성
2. 모호한 요구를 명시적 조건으로 변환
3. 범위(In Scope / Out of Scope) 제안
4. `docs/ai/specs/<feature-name>.md` 초안 생성
5. `docs/ai/plans/<feature-name>-plan.md` 초안 생성
6. 구현 시작 전 승인 요청

> Intake 단계에서는 코드를 수정하지 않습니다.
> Claude Code 사용자는 `/png-intake`로 Intake 이후 구현·커밋·PR 초안까지 자동으로 이어서 실행합니다. 이 문서는 Intake 단계의 산출물 기준만 정의합니다.

---

## 완료 기준

- 스펙 문서에 수용 기준(AC)이 최소 3개 이상 존재
- 계획 문서에 태스크와 검증 방법이 존재
- 오픈 이슈/결정 필요 항목이 분리되어 존재

---

## 관련 문서

- 팀 표준: `docs/ai/README.md`
- 스펙 템플릿: `docs/ai/01-feature-spec-template.md`
- 계획 템플릿: `docs/ai/02-implementation-plan-template.md`
- PR 체크리스트: `docs/ai/03-pr-review-checklist.md`
- 클로드 빠른 시작 프롬프트: `docs/ai/06-claude-intake-starter-prompt.md`
