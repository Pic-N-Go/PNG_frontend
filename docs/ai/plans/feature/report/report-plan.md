# 신고 접수 및 관리자 처리 구현 계획

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/feature/report/report.md`
- 관련 도메인: `report`, `admin`
- 관련 목업: `src/components/ui/community/community-post.html`
- 완료 목표: 게시글·리뷰 신고 접수와 관리자 조회·처리를 실제 API로 연결한다.

## 2) 구현 전략

- 신고 사유와 생성 DTO는 `types/report.ts`에서 공통 관리한다.
- 게시글과 리뷰는 `PostReportSheet`를 재사용하고 각 화면에서는 대상 ID만 전달한다.
- 관리자 신고 UI는 대형 대시보드 화면에서 `AdminReportTab`으로 분리한다.
- API 함수는 `src/api`, 서버 상태는 `src/hooks`에 둔다.
- 관리자 처리 후 신고 쿼리 전체를 무효화해 상태 간 목록 불일치를 방지한다.
- 삭제 메모는 DELETE 요청 본문으로 전달하며 백엔드 계약과 함께 유지한다.

## 3) 작업 태스크

### Task 1 - 신고 타입과 API 계약

- 대상: `src/types/report.ts`, `src/types/admin.ts`, `src/api/report.ts`, `src/api/admin.ts`
- 내용: 생성·목록·상세·처리 DTO와 게시글·리뷰·관리자 API 정의
- 완료 조건: API 함수에 UI 상태나 훅 의존성이 없다.

### Task 2 - TanStack Query 훅

- 대상: `src/hooks/useReport.ts`, `src/hooks/useAdmin.ts`
- 내용: 신고 생성, 관리자 목록·상세, 기각·삭제 mutation과 캐시 무효화
- 완료 조건: 인증 토큰은 Zustand에서 읽고 서버 상태는 Query로 관리한다.

### Task 3 - 사용자 신고 UI

- 대상: `PostReportSheet`, `PostDetailScreen`, `ReviewActionSheet`, `ReviewMenuButton`, `ReviewTab`, `SpotDetailScreen`
- 내용: 사유 선택 → 상세 입력 애니메이션, 게시글·리뷰 신고 진입점과 토스트 연결
- 완료 조건: 중복 제출을 차단하고 성공 전에는 입력 상태를 유지한다.

### Task 4 - 관리자 신고 UI

- 대상: `AdminReportTab`, `AdminDashboardScreen`
- 내용: 균등 필터, 10개 페이징, 상세 모달, 처리 메모 모달, 기각·삭제
- 완료 조건: 로딩·빈 상태·오류·처리 중 상태와 접근성 레이블을 제공한다.

### Task 5 - 검증 및 문서 동기화

- TypeScript와 ESLint 검사
- 금지 폰트·비표준 글자 크기·상대경로·`StyleSheet.create()` 확인
- 기능 스펙과 구현 계획을 실제 최종 동작에 맞춰 기록

## 4) 검증 체크포인트

- [x] TypeScript 검사 통과
- [x] 변경 파일 ESLint 통과
- [x] API/Hook/UI 계층 분리 확인
- [x] 디자인 토큰과 Pretendard 폰트 규칙 정적 검토
- [ ] iOS·Android 실기기 또는 시뮬레이터 수동 확인
- [ ] 360dp·430dp 화면 너비 수동 확인

## 5) 롤백 계획

- 영향 파일: `src/api/report.ts`, `src/api/admin.ts`, 관련 타입·훅·신고 UI와 관리자 탭
- 되돌림 방법: 신고 기능 변경 커밋을 revert한다.
- 데이터 영향: 프론트 롤백은 이미 저장된 신고 데이터에 영향을 주지 않는다. 삭제 처리 자체는 복구되지 않는다.

## 6) PR 구성

- PR 제목 예시: `feat: 게시글·리뷰 신고 및 관리자 처리 기능 연동`
- 변경 요약: 사용자 신고 API 연결, 관리자 통합 목록·상세·처리, 처리 메모 지원
- 리뷰 요청 포인트: DELETE 요청 본문 호환성, 같은 대상의 다중 신고 처리, 모바일 키보드 레이아웃
