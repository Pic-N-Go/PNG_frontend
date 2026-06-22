# 기능 담당 현황

> 파일 작업 전 본 문서에서 담당자를 확인하세요.
> 상태 변경 시 PR description에 명시하거나 본 문서를 직접 업데이트합니다.

## 담당자

| 이름 | GitHub |
|------|--------|
| 소영재 | - |
| 박예은 | - |
| 이예인 | - |
| 모정민 | - |

---

## 화면별 담당

### 인증 · 온보딩 — `src/screens/auth/`

| 화면 | 주요 기능 | 담당자 | 상태 | 파일 |
|------|-----------|--------|------|------|
| 스플래시 | 로고 애니메이션, 자동 로그인 체크, 강제 업데이트 확인 | 소영재 | 미시작 | `SplashScreen.tsx` |
| 로그인 | 이메일 로그인, 카카오/Apple 소셜 로그인, 자동 로그인 | 소영재 | 미시작 | `LoginScreen.tsx` |
| 회원가입 | 이메일 인증, 닉네임 설정, 관심 카테고리 선택, 약관 동의 | 소영재 | 미시작 | `SignupScreen.tsx` |
| 온보딩 | 앱 소개 슬라이드, 위치/알림 권한 요청 | 박예은 | 미시작 | `OnboardingScreen.tsx` |

### 홈 · 지도 — `src/screens/home/`

| 화면 | 주요 기능 | 담당자 | 상태 | 파일 |
|------|-----------|--------|------|------|
| 홈 화면 | 오늘의 출사 배너, 카테고리 필터, 인기 스팟, 출사 캘린더 | 박예은 | 미시작 | `HomeScreen.tsx` |
| 지도 | 지도 확장형 3단계, 핀 표시, 채팅 뱃지, 위시리스트 핀 | 박예은 | 미시작 | `MapScreen.tsx` |

### 검색 — `src/screens/search/`

| 화면 | 주요 기능 | 담당자 | 상태 | 파일 |
|------|-----------|--------|------|------|
| 검색 결과 | 통합 검색, 최근 검색어, 필터, 리스트/지도 전환 | 이예인 | 미시작 | `SearchResultScreen.tsx` |

### 스팟 — `src/screens/spot/`

| 화면 | 주요 기능 | 담당자 | 상태 | 파일 |
|------|-----------|--------|------|------|
| 스팟 상세 - 정보 탭 | 포토제닉 지수, 편의 정보, 촬영 체크리스트, 북마크 | 박예은 | 미시작 | `SpotDetailScreen.tsx` |
| 스팟 상세 - 사진 탭 | 사진 갤러리, 풀스크린 뷰, EXIF 정보 | 소영재 | 미시작 | `SpotDetailScreen.tsx` |
| 스팟 상세 - 채팅 탭 | 실시간 채팅, LIVE 뱃지, 참여 인원, 사진 공유 | 소영재 | 미시작 | `SpotDetailScreen.tsx` |
| 스팟 등록 | 3단계 등록 (사진/위치/정보), EXIF 파싱, 검토 | 소영재 | 미시작 | `SpotRegisterScreen.tsx` |
| 스팟 리뷰 작성 | 별점, 방문 시간대, 텍스트, 사진 첨부 | 박예은 | 미시작 | `ReviewWriteScreen.tsx` |
| 사진 상세 뷰 | 풀스크린, 핀치 줌, EXIF 오버레이, 저장/공유 | 소영재 | 미시작 | `PhotoDetailScreen.tsx` |

> `SpotDetailScreen.tsx`는 탭 구조 1개 파일로 관리. 탭별 내용은 내부 컴포넌트로 분리 권장.

### 바텀시트 — `src/components/`

| 화면 | 주요 기능 | 담당자 | 상태 | 파일 |
|------|-----------|--------|------|------|
| 코스에 저장 | 여행 계획 목록 선택, 새 계획 생성 | 모정민 | 미시작 | `travel/SaveToPlanSheet.tsx` |
| 바로 출발 | 경로 확인, 이동 시간, 지도 앱 딥링크 | 모정민 | 미시작 | `travel/DepartNowSheet.tsx` |
| 지도 핀 채팅 | 채팅 미리보기 3줄, 채팅 참여, 빠른 메시지 | 소영재 | 미시작 | `spot/MapPinChatSheet.tsx` |

### 여행 계획 · 위시리스트 — `src/screens/travel/`, `src/screens/wishlist/`

| 화면 | 주요 기능 | 담당자 | 상태 | 파일 |
|------|-----------|--------|------|------|
| 여행 계획 목록 | 계획 목록, 섹션 탭 (전체/진행 중/예정) | 모정민 | 미시작 | `travel/TravelListScreen.tsx` |
| 여행 계획 상세 | DAY별 코스, 이동 시간, 지도 미리보기 | 모정민 | 미시작 | `travel/TravelPlanScreen.tsx` |
| 새 계획 만들기 | 계획 생성/수정/삭제, DAY별 스팟 편집 | 모정민 | 미시작 | `travel/TravelNewScreen.tsx` |
| 날씨 연동 | DAY별 날씨 예보, 골든아워 표시 | 모정민 | 미시작 | `travel/TravelPlanScreen.tsx` 내 섹션 |
| 위시리스트 | 위시리스트 목록 | 모정민 | 미시작 | `wishlist/WishlistScreen.tsx` |
| 위시리스트 알림 설정 | 날씨/시간대 조건, 알림 토글, 7일 예보 미리보기 | 모정민 | 미시작 | `wishlist/WishlistSettingScreen.tsx` |

### 커뮤니티 — `src/screens/community/`

| 화면 | 주요 기능 | 담당자 | 상태 | 파일 |
|------|-----------|--------|------|------|
| 커뮤니티 피드 | 레시피/갤러리 탭, 뷰 토글, 정렬, 좋아요/북마크/댓글 | 박예은 | 미시작 | `CommunityFeedScreen.tsx` |
| 게시물 작성 | 사진 업로드, 스팟 연결, EXIF 자동 파싱, 해시태그 | 이예인 | 미시작 | `CommunityWriteScreen.tsx` |
| 콘테스트 | 주간 콘테스트, 출품, 투표 (하루 3표), 실시간 순위 | 이예인 | 미시작 | `ContestScreen.tsx` |

### 마이페이지 — `src/screens/mypage/`

| 화면 | 주요 기능 | 담당자 | 상태 | 파일 |
|------|-----------|--------|------|------|
| 마이페이지 | 프로필, 사진 지도, 앨범, 포토제닉 리포트, 위시리스트 | 이예인 | 미시작 | `MyPageScreen.tsx` |
| 타 유저 프로필 | 프로필 조회, 팔로우, 게시물 그리드, 신고/차단 | 이예인 | 미시작 | `UserProfileScreen.tsx` |
| 알림 센터 | 알림 목록, 탭 분류, 읽음 처리, 딥링크 | 모정민 | 미시작 | `NotificationScreen.tsx` |
| 설정 화면 | 계정/알림/위치 권한/차단 목록/고객센터/탈퇴 | 소영재 | 미시작 | `SettingScreen.tsx` |

---

## API · 훅 · 스토어 담당

| 파일 | 담당자 | 비고 |
|------|--------|------|
| `api/auth.ts` · `hooks/useAuth.ts` · `store/useAuthStore.ts` | 소영재 | |
| `api/spot.ts` · `hooks/useSpot.ts` | 소영재, 박예은 | 스팟 상세/등록 협의 |
| `api/community.ts` · `hooks/useCommunity.ts` | 박예은, 이예인 | |
| `api/travel.ts` · `hooks/useTravel.ts` · `store/useTravelStore.ts` | 모정민 | |
| `api/mypage.ts` · `hooks/useMypage.ts` | 이예인 | |
| `api/search.ts` · `hooks/useSearch.ts` | 이예인 | |
| `api/notification.ts` · `hooks/useNotification.ts` | 모정민 | |
| `store/useMapStore.ts` | 박예은 | |
| `store/useUIStore.ts` | 공통 | 토스트, 모달 등 전역 UI 상태 |

---

## 알림 (FCM)

| 기능 | 담당자 | 상태 |
|------|--------|------|
| 골든아워 알림 (출사 스팟 골든아워 임박 푸시) | 모정민 | 미시작 |
