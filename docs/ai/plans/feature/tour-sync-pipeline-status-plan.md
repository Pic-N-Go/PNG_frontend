# 구현 계획 — 관광정보 동기화 파이프라인 상태 표시

## 1) 입력 스펙

- 스펙: `docs/ai/specs/feature/tour-sync-pipeline-status.md`
- 관련 도메인: admin, spot

## 2) 구현 전략

- 기존 전체·지역·샘플 mutation은 유지한다.
- 상태 응답 타입만 백엔드 계약에 맞게 확장하고 기존 TanStack Query 폴링을 재사용한다.
- 단계별 표현은 관리자 전용 컴포넌트로 분리해 대형 `AdminDashboardScreen`의 복잡도를 줄인다.
- 백엔드 구버전 응답에는 기존 단일 진행률 UI를 폴백으로 유지한다.

## 3) 작업 태스크

### Task 1 — 상태 응답 타입 확장

- `src/types/admin.ts`
- 단계 상태와 단계별 응답, 작업 ID 및 전체 상태 타입 추가

### Task 2 — API 응답 파싱 보강

- `src/api/admin.ts`
- `any` 없이 공통 응답 래퍼를 해제하도록 정리

### Task 3 — 단계별 상태 카드 구현

- `src/components/admin/TourSyncPipelineStatusCard.tsx`
- 단계별 아이콘·상태·진행률·오류·재조회 UI 구현

### Task 4 — 관리자 화면 연결

- `src/screens/admin/AdminDashboardScreen.tsx`
- 신규 상태 카드를 기존 상태 조회 훅에 연결하고 구버전 UI를 폴백으로 유지

## 4) 검증

- [ ] `pnpm exec tsc --noEmit`
- [ ] `pnpm lint`
- [ ] `git diff --check`
- [ ] 샘플 동기화 진행·완료 상태 수동 확인

## 5) 롤백

- 신규 상태 카드 연결을 제거하면 기존 단일 진행률 UI로 즉시 복귀할 수 있다.
- 서버 데이터 변경이나 추가 mutation은 없으므로 데이터 롤백은 필요하지 않다.
