---
allowed-tools: Read, Write
description: PNG 프로젝트 스펙을 기반으로 구현 계획(plan) 생성 또는 보정
---

## 참고 스킬

- `.claude/skills/plan-generator/SKILL.md`

## 실행 지침

아래 순서대로 `spec -> plan` 생성만 수행합니다.

0. `.claude/skills/plan-generator/SKILL.md`를 Read해 기준을 확인합니다.
1. 다음 문서를 읽고 제약을 반영합니다.
   - `docs/ai/00-context.md`
   - `docs/ai/01-feature-spec-template.md`
   - `docs/ai/02-implementation-plan-template.md`
   - `docs/ai/03-pr-review-checklist.md`
2. feature-name을 확정합니다.
   - `$ARGUMENTS`가 있으면 아래 정규화 규칙을 적용합니다.
     - `../`가 포함된 경우: 즉시 거부하고 사용자에게 알립니다.
     - `/`는 `-`로 치환합니다.
     - `.md` 확장자가 포함된 경우 제거합니다.
   - 없으면 사용자에게 feature-name을 요청한 뒤 확정합니다.
   - 정규화된 feature-name으로 스펙을 Read합니다: `docs/ai/specs/<feature-name>.md`
3. 스펙 기준으로 plan 초안을 생성/보정합니다.
4. 확정된 feature-name으로 산출물을 작성합니다.
   - 저장 경로: `docs/ai/plans/<feature-name>-plan.md`
5. 구현 코드는 작성하지 않고 plan 검토 요청으로 마무리합니다.

## 출력 형식

1) Spec Summary  
2) 구현 전략 (핵심 접근 / 리스크 / 완화)  
3) Task Breakdown (30~90분 단위)  
4) Verification Plan  
5) Risks & Rollback  
6) PR 구성 (제목 컨벤션 / 변경 요약 / 리뷰 포인트)  
7) Plan File Path

각 Task 항목은 아래 4가지를 반드시 포함합니다.

- 대상 파일
- 변경 내용
- 완료 조건
- 검증 방법
