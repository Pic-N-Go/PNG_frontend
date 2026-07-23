# 기능 스펙 템플릿

아래 템플릿을 복사해서 `docs/ai/specs/<branch>/<feature-name>.md`로 저장해 사용합니다.

---

## 1) 기능 정보

- 기능명:
- 담당자: (예: `@yeni` 또는 `홍길동`)
- 관련 이슈: (예: `#123`, 없으면 `없음`)
- 관련 도메인 (필수): **실제 구현이 있는** `src/api/` 파일명 기준 (예: `auth`/`spot`/`courses`/`community`/`mypage`/`search`/`wishlist`/`notification` — `travel.ts`는 빈 스텁이므로 여행 코스 관련은 `courses` 사용), 복수 가능, 코드 도메인과 무관하면 `common`, 해당 없으면 `없음`
- 대상 플랫폼: iOS / Android

## 2) 문제와 목표

- 해결하려는 문제:
- 사용자 가치:
- 완료 기준(한 줄):

## 3) 범위

- 포함(In Scope):
  - 
- 제외(Out of Scope):
  - 

## 4) 사용자 시나리오

- 시나리오 A:
  - Given:
  - When:
  - Then:
- 시나리오 B:
  - Given:
  - When:
  - Then:

## 5) UI/UX 요구사항

- 참조 목업 파일:
  - `src/components/ui/...`
- 화면 전환 규칙:
- 빈 상태/에러 상태:
- 로딩 상태:

## 6) 데이터/API 요구사항

- 사용 API:
  - `src/api/...` 함수명:
- 요청/응답 핵심 필드:
- 실패 처리 방식:
- 캐싱/무효화 전략(TanStack Query):

## 7) 상태 관리

- 서버 상태:
- 클라이언트 상태(Zustand):
- 영속화 필요 여부:

## 8) 기술 제약 체크

- [ ] NativeWind `className`만 사용
- [ ] `StyleSheet.create()` 미사용
- [ ] `@/` alias 사용
- [ ] 타입 정의 명확
- [ ] 디자인 토큰 준수 (`#E31B59`, 52px 버튼 등)

## 9) 수용 기준 (Acceptance Criteria)

- [ ] AC1:
- [ ] AC2:
- [ ] AC3:

## 10) 테스트 시나리오

- 정상 케이스:
- 경계 케이스:
- 실패 케이스:

## 11) 오픈 이슈 / 결정 필요

- 

---

## 작성 시 참고 문서

- 화면 구조/네비게이션: `docs/guide/dev/ui-publishing.md`
- 구현 규칙/디자인 제약: `CLAUDE.md`
- 프론트 구현 기준: `docs/guide/dev/development-guide.md`
- 기기/스케일링 기준: `docs/guide/dev/device-support.md`
