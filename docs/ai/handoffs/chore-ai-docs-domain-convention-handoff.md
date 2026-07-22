# Handoff — chore/ai-docs-domain-convention

> 이 작업은 별도 spec/plan 문서 없이 대화(conversation) 기반으로 진행된 애드혹 하네스 정리입니다. `docs/ai/specs`·`docs/ai/plans` 자체의 폴더 컨벤션을 다루는 메타 작업이라 일반 기능 spec→plan 파이프라인을 생략했습니다.

## 1) Feature Summary

`docs/ai/specs`·`docs/ai/plans`의 브랜치 폴더 컨벤션을 실제 브랜치 네이밍(`.github/CONVENTIONS.md`)에 맞게 정리하고, 스펙/플랜에 도메인별 조회가 가능한 `관련 도메인` 메타 필드를 도입했습니다. 정리 과정에서 발견한 미사용·오네이밍 API 파일(`src/api/notification.ts`)도 함께 정리했습니다.

## 2) Scope Snapshot

**In Scope**
- `docs/ai/specs/`, `docs/ai/plans/` 브랜치 폴더 컨벤션 정정 (`feat/` → `feature/`, 평탄화, `main/` 예외 명문화)
- `docs/guide/api/README.md` 인덱스 누락 보완
- `01`/`02` 템플릿에 `관련 도메인`(필수) 필드 신설 + 기존 6쌍 백필 + `03` 체크리스트 항목 추가
- `src/api/notification.ts` vs `notifications.ts` 정리(단수형 관례 통일)

**Out of Scope**
- 기존 스펙/플랜 전체(19+20개)의 `관련 도메인` 일괄 백필 — 신규/수정 문서부터 적용하기로 함
- `fix/`, `refactor/` 등 다른 브랜치 타입의 실제 예시 폴더 생성 — 현재는 `feature/`·`chore/`·`docs/`·`main/`만 실존

**변경 파일 (`git diff --stat main HEAD`)**

```
32 files changed, 67 insertions(+), 46 deletions(-)
docs/ai/01-feature-spec-template.md, 02-implementation-plan-template.md, 03-pr-review-checklist.md
docs/ai/specs/README.md, docs/ai/plans/README.md
docs/ai/specs/feature/*, docs/ai/plans/feature/* (feat/ → feature/ 이동 9쌍 + 평탄화 2건 + kakao-login plan 2건)
docs/ai/specs/main/*.md, docs/ai/plans/main/*.md (관련 도메인 백필)
docs/guide/api/README.md
src/api/notification.ts, src/api/notifications.ts(삭제), src/hooks/usePushNotifications.ts
```

상세 내용은 `git diff main HEAD` 참조.

## 3) Completed Tasks

- specs/plans `feat/` → `feature/` 정정 (auth-ui-publishing-parity, course-v2)
- `feature-home-screen` → `feature/home-screen` 평탄화 (specs, plans)
- 날짜-prefix 카카오 로그인 plan 2건 → `feature/kakao-login-ios|android/` 폴더로 이동
- specs/plans README 2개에 `main/` 예외 케이스 + 브랜치 타입 일반화 문구 추가
- `docs/guide/api/README.md`에 `auth-integration.md` 인덱스 추가
- 템플릿 2개에 `관련 도메인`(필수) 필드 신설, 파일명만으론 도메인이 안 드러나는 6쌍(스펙+플랜) 백필
- `03-pr-review-checklist.md`에 도메인 필드 체크 항목 추가 (신규/수정 문서 한정으로 범위 명시)
- code-reviewer 서브에이전트 리뷰 반영: `feat/` 잔여 문구 주석 처리, 도메인 예시(`travel`/`courses`) 함정 정정, README 일반화 문구 보강
- `src/api/notification.ts`(미사용 스텁) 삭제 → `notifications.ts`를 `notification.ts`로 리네임, export/consumer 동기화
- `tsc --noEmit`, `pnpm lint` 클린 확인

## 4) Remaining Tasks

- 기존 스펙/플랜 문서 중 아직 `관련 도메인` 필드가 없는 나머지(auth-quality-fix 등 파일명으로 도메인이 명확한 것들, chore/docs 폴더 전체)는 의도적으로 미백필 — 팀에서 필요하다고 판단되면 별도로 채우기
- `fix/`, `refactor/` 등 브랜치 타입은 아직 실제 예시 폴더가 없음 — 해당 타입 브랜치에서 첫 스펙/플랜이 생기면 컨벤션대로 잘 따라가는지 확인 필요

## 5) Risks & Open Decisions

- **체크리스트 항목의 실효성**: `03-pr-review-checklist.md`의 `관련 도메인` 체크가 "신규/수정 문서 한정"이라고 명시했지만, 리뷰어가 이 범위 문구를 놓치면 오래된 문서까지 걸고넘어질 수 있음 — 팀 내 공유 필요
- **`courses` vs `travel` 네이밍 불일치**: `src/api/travel.ts`는 빈 스텁이고 실제 여행 코스 로직은 `courses.ts`에 있음. 이번에 도메인 필드 가이드에서는 우회했지만, 근본적으로 `travel.ts`를 정리(삭제 또는 실구현)할지는 별도 논의 필요
- `docs/md-files-update`라는 임시 브랜치가 로컬에 있었으나 고유 커밋 없어 삭제함(참고용 기록)

## 6) Next Actions

- 팀원: 새 스펙/플랜 작성 시 `docs/ai/specs/README.md`·`docs/ai/plans/README.md`(브랜치 폴더 규칙), `01`/`02` 템플릿(관련 도메인 필드) 참고
- PR 리뷰 시 `03-pr-review-checklist.md`의 새 체크 항목("신규/수정 문서 한정") 기준으로만 판단
- `src/api/travel.ts` 스텁 처리 방향은 별도 이슈로 논의 권장
