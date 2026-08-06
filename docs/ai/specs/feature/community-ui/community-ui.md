# 기능 스펙 — 커뮤니티 화면 UI 구현

## 1) 기능 정보

- 기능명: 커뮤니티 화면 UI 구현 (피드/게시글/작성/콘테스트/프로필, API 연동 제외)
- 담당자: `@Lucy`
- 관련 이슈: 없음
- 관련 도메인 (필수): `community`
- 대상 플랫폼: iOS / Android

## 2) 문제와 목표

- 해결하려는 문제: `src/components/ui/community/` 6개 목업(퍼블리싱 완료)에 대응하는 실제 화면이 대부분 빈 placeholder(`CommunityFeedScreen`/`CommunityWriteScreen`/`ContestScreen` 6줄 스텁)이거나 아예 없음(게시글 상세, 유저 프로필, 콘테스트 결과).
- 사용자 가치: 커뮤니티 탭(피드→게시글 상세→작성, 콘테스트, 유저 프로필) 전체 플로우를 목업과 동일하게 조작 가능하게 해 QA/디자인 검토를 API 개발과 병렬 진행.
- 완료 기준(한 줄): 6개 목업(`community-feed`, `community-post`, `community-write`, `contest-all-entries`, `contest-result`, `user-profile`)의 모든 상태·모달·시트가 로컬 mock 데이터로 목업과 1:1 동일하게 동작하되, 네트워크 호출은 없음.

## 3) 범위

- 포함(In Scope):
  - **`community-feed.html`** → `CommunityFeedScreen` (탭 루트, 네비게이션 헤더 없음)
    - 세그먼트 3종(게시글 · 갤러리 · 콘테스트), 게시글 피드 검색 인라인 확장(`search-overlay`)
    - 콘테스트 세그먼트 내부 서브탭 3종(진행중 · 내 출품 · 지난): 진행중(히어로 280px·1위 카드·2~7위 통일 그리드·28px 원형 투표 버튼·라이트박스), 내 출품(컴팩트 배너·캡션 수정 시트·출품 취소 모달·출품하기 시트, 빈 상태 포함), 지난(2열 그리드 카드)
      - 2026-08-06 시안 변경: 투표는 낙관적 업데이트이고 **확인 모달·undo 스낵바 없음**(되돌리기 미지원). 2·3위 개별 카드와 4~7위 그리드가 하나의 통일 카드 그리드로 합쳐짐
    - 진행중 탭 `출품작 N개 모두 보기` → `ContestAllEntriesScreen`(push): 정렬 3종(최신순 기본·득표순·랜덤)·무한스크롤·28px 원형 투표 버튼·로딩 스켈레톤/빈/에러 상태
    - 작성 버튼 → `CommunityWriteScreen`, 게시글 유저명 → `UserProfileScreen`, 지난 콘테스트 카드 → `ContestResultScreen`
  - **`community-post.html`** → `PostDetailScreen` (push, 헤더 있음)
    - `⋯` 액션시트(내 글/남 글 분기), 삭제 확인 모달, 신고 사유 시트, 완료 토스트 2종
    - 히어로 확대 → 라이트박스(layer 1) → `(i)` → EXIF 상세(layer 2, 라이트박스 위 중첩) — EXIF 닫으면 라이트박스 유지, 라이트박스 닫으면 둘 다 닫힘
  - **`community-write.html`** → `CommunityWriteScreen` (push)
    - 사진 첨부/갤러리, 위치 선택 시트, 카메라·렌즈 선택 시트(kind 분기)
  - **`contest-result.html`** → `ContestResultScreen` (push, 풀스크린 목적지 — 시트 아님, 공유/딥링크 대상)
  - **`user-profile.html`** → `UserProfileScreen` (push)
    - 탭 3종(게시글 · 콘테스트 · 방문한 스팟), 팔로우 토글, 메시지 버튼(BETA 뱃지 + disabled)
  - 타입 정의: `src/types/community.ts` (현재 주석 한 줄뿐)
  - API 함수 시그니처만 정의: `src/api/community.ts` (실제 호출은 없음, 함수 자리와 파라미터/응답 타입만)
  - 공통 컴포넌트 재사용: `src/components/common/BottomSheet.tsx`, `Chip.tsx`, `StarRating.tsx`, `InitialAvatar.tsx`, `Skeleton.tsx`, `OptionSheet.tsx` — 부족하면 동일 원칙(2회 이상 실사용)으로 추가
  - 네비게이션: `CommunityStack`에 `PostDetail`, `ContestResult`, `UserProfile` 라우트 추가 (기존 `ContestScreen` 스텁은 콘테스트 세그먼트가 `CommunityFeedScreen` 내부 상태로 흡수되므로 `ContestResultScreen`으로 재정의 — 아래 오픈 이슈 참고)
- 제외(Out of Scope):
  - 실제 API 연동/TanStack Query 훅 연결 (`src/api/community.ts`, `src/hooks/useCommunity.ts`의 실제 구현은 후속 이슈)
  - 콘테스트 투표수/좋아요/북마크 등 서버 반영 — 로컬 state로 optimistic 토글만
  - 딥링크 실제 실행(`contest-result` 공유), 실제 이미지 업로드(`expo-image-picker`로 로컬 URI 선택까지만)
  - 팔로우/메시지(BETA) 실제 기능 — 스타일과 disabled 상태만
  - 알림/푸시 연동

## 4) 사용자 시나리오

- 시나리오 A: 피드 → 게시글 상세 → 라이트박스 → EXIF
  - Given: `CommunityFeedScreen` 게시글 세그먼트에 있음
  - When: 게시글 카드를 탭해 상세로 진입 후 히어로 이미지를 탭 → `(i)` 탭
  - Then: 상세 push → 라이트박스(layer 1) 오픈 → EXIF(layer 2)가 라이트박스 위에 겹쳐 열림. EXIF 닫기는 라이트박스만 남기고, 라이트박스 닫기는 둘 다 닫음
- 시나리오 B: 게시글 삭제
  - Given: 내가 쓴 게시글 상세 화면
  - When: `⋯` → 액션시트(내 글용) → 삭제 → 확인 모달에서 확인
  - Then: 삭제 완료 토스트 노출 후 피드로 돌아감(mock에서는 목록에서 제거)
  - 시나리오 A: [[spot-detail-api-remaining-work]]와 무관, 독립 시나리오
- 시나리오 C: 콘테스트 투표
  - Given: 콘테스트 세그먼트 · 진행중 서브탭, 남은 표 3장
  - When: 포디움/리스트에서 사진 투표 → 확인 모달 확인
  - Then: 투표 반영 + undo 스낵바 노출, 스낵바 기간 내 실행취소 시 취소 모달 없이 즉시 되돌림, 남은 표 0이면 이후 투표 시 취소 모달만 노출
- 시나리오 D: 내 출품 캡션 수정 / 출품 취소
  - Given: 내 출품 서브탭, 출품 사진 있음(`hasEntry=true`)
  - When: 캡션 수정 시트에서 텍스트 변경 후 저장 / 또는 출품 취소 모달에서 확인
  - Then: 캡션 즉시 반영 / 출품 취소 시 빈 상태(`hasEntry=false`, 출품하기 시트 유도)로 전환
- 시나리오 E: 유저 프로필 탭 전환 + 팔로우
  - Given: `UserProfileScreen`, 게시글 탭
  - When: 콘테스트/방문한 스팟 탭으로 전환, 팔로우 버튼 토글
  - Then: 각 탭 데이터가 mock 기준으로 전환, 팔로우 상태(`isFollowing`) 로컬 토글 + 텍스트/스타일 변경

## 5) UI/UX 요구사항

- 참조 목업 파일:
  - `src/components/ui/community/community-feed.html`
  - `src/components/ui/community/community-post.html`
  - `src/components/ui/community/community-write.html`
  - `src/components/ui/community/contest-all-entries.html`
  - `src/components/ui/community/contest-result.html`
  - `src/components/ui/community/user-profile.html`
- 참고 자료(구현 패턴 참고용, 소스 오브 트루스 아님): `~/Desktop/png-community-ui/phase1~4` — 동일 화면을 더 세분화한 HTML+RN(`.native.jsx`) 변환 샘플. **주의**: 해당 샘플은 인라인 `style` 객체 방식(`StyleSheet.create()`류)이라 이 프로젝트의 NativeWind `className` 규칙과 충돌 — 구조/아이콘 매핑/상태 분기 로직만 참고하고 스타일은 전부 `className`으로 재작성.
- 화면 전환 규칙: `docs/guide/dev/ui-publishing.md`의 community 섹션(피드/상세/작성/콘테스트결과/프로필 흐름) 그대로 따름. `community-post`/`community-write`/`contest-all-entries`/`contest-result`/`user-profile`은 push 스택 화면이라 하단 탭바 미포함.
- 빈 상태/에러 상태: 내 출품 빈 상태(`2h-empty` 상당), 콘테스트 지난 목록 빈 상태 — 목업 기준. API 에러 상태는 이번 스코프 제외(로컬 mock만 다룸).
- 로딩 상태: 이번 스코프는 로컬 mock 즉시 렌더 기준이라 스켈레톤은 필요한 곳(사진 그리드 등)에만 최소 적용, 강제하지 않음.

## 6) 데이터/API 요구사항

- 사용 API:
  - `src/api/community.ts` 함수명: 실제 정의는 후속 이슈. 이번 스코프에선 화면이 필요로 하는 함수 시그니처(예: `fetchCommunityFeed`, `fetchPostDetail`, `createPost`, `fetchContestActive`, `voteContestPhoto`, `fetchUserProfile` 등)만 타입과 함께 자리를 잡아둠(호출 X)
- 요청/응답 핵심 필드: `src/types/community.ts`에 화면 표시용 타입으로 확정 (Task 1에서 목업 기준 필드 도출)
- 실패 처리 방식: 이번 스코프 제외
- 캐싱/무효화 전략(TanStack Query): 이번 스코프 제외, `src/hooks/useCommunity.ts`는 다음 이슈에서 연결

## 7) 상태 관리

- 서버 상태: 이번 스코프에서는 없음 (로컬 mock 상수)
- 클라이언트 상태(Zustand): 불필요 — 화면 내부 `useState`로 충분(피드 세그먼트/서브탭, 시트/모달 visible, 투표 남은 횟수, 팔로우 토글 등 화면 로컬 상태)
- 영속화 필요 여부: 없음

## 8) 기술 제약 체크

- [ ] NativeWind `className`만 사용
- [ ] `StyleSheet.create()` 미사용
- [ ] `@/` alias 사용
- [ ] 타입 정의 명확 (`any` 금지)
- [ ] 디자인 토큰 준수 (`#E31B59`, 52px 버튼, `layout.ts` 폰트 상수)
- [ ] 아이콘은 `lucide-react-native` 통일 (레퍼런스 아이콘 매핑표 활용, `@tabler/icons-react-native` 신규 사용 지양)

## 9) 수용 기준 (Acceptance Criteria)

- [ ] AC1: `CommunityFeedScreen`에서 게시글/갤러리/콘테스트 세그먼트 전환 및 검색 인라인 확장이 목업과 동일
- [ ] AC2: 콘테스트 세그먼트의 진행중/내 출품/지난 서브탭과 각 상태(투표 확인/취소 모달, undo 스낵바, 캡션 시트, 출품 취소 모달, 출품하기 시트, 빈 상태)가 모두 동작
- [ ] AC3: `PostDetailScreen`의 액션시트(내 글/남 글 분기)·삭제 확인·신고 시트·토스트 2종·라이트박스+EXIF 중첩 오픈/클로즈 규칙 정확히 동작
- [ ] AC4: `CommunityWriteScreen`에서 사진 첨부(`expo-image-picker`), 위치 시트, 카메라/렌즈 시트가 목업과 동일
- [ ] AC5: `ContestResultScreen`이 풀스크린 push 화면으로 목업과 동일 렌더링
- [ ] AC6: `UserProfileScreen`의 탭 3종 전환 + 팔로우 토글 + 메시지 BETA disabled 스타일
- [ ] AC7: `pnpm exec tsc --noEmit`, `pnpm lint` 통과
- [ ] AC8: 360~430dp(iPhone SE ~ 15 Pro Max) 반응형 확인

## 10) 테스트 시나리오

- 정상 케이스: 시나리오 A~E 전체 수동 확인
- 경계 케이스: 콘테스트 투표 남은 횟수 0에서 추가 투표 시도, 내 출품 빈 상태 ↔ 출품 완료 전환, 라이트박스+EXIF 중첩 닫기 순서
- 실패 케이스: 이번 스코프 제외(mock만 다룸이라 실패 케이스 없음)

## 11) 오픈 이슈 / 결정 필요

- **`ContestScreen` 스텁 처리**: 현재 `CommunityStack`에 `Contest`가 독립 라우트로 등록돼 있으나, 목업상 콘테스트는 `community-feed.html`의 세그먼트(내부 상태)이지 별도 push 화면이 아님. 이번 스펙은 콘테스트 세그먼트를 `CommunityFeedScreen`에 흡수하고, 기존 `ContestScreen.tsx`/`Contest` 라우트는 삭제하는 대신 `contest-result.html`이 요구하는 실제 push 화면인 `ContestResultScreen`으로 재정의하는 방향을 기본안으로 제안. 이견 있으면 plan 검토 시 조정.
- 갤러리 세그먼트(`community-feed.html`의 두 번째 세그먼트, 사진 그리드)는 목업에 마크업이 있는지 Task 착수 시 재확인 필요 — 있으면 범위에 포함, 실질적으로 빈 자리표시면 제외하고 오픈 이슈로 유지.
