# UI 퍼블리싱 목업 가이드

> `src/components/ui/` 폴더에 있는 HTML 목업 파일들에 대한 구조 및 규칙 설명입니다.  
> 실제 React Native 컴포넌트 구현 전 디자인 검토·협업용으로 사용합니다.

---

## 폴더 구조

```
src/components/ui/
  fonts.css                   # Pretendard Variable 폰트 정의 (공통)
  auth/
    login.html                # 로그인 (스플래시 내장 → 이메일/소셜 로그인)
    signup.html               # 회원가입 (이메일 인증·비밀번호 강도·관심 테마·약관)
    oauth-onboarding.html     # 소셜 로그인 후 추가 정보 입력
  home/
    home.html                 # 홈 (히어로·검색·필터 바텀시트·카테고리·주변 스팟·캘린더)
    map.html                  # 지도 (풀스크린·투명 상태바·마커 팝업·클러스터·FAB)
  travel/
    travel-list.html          # 여행 목록 (전체·예정·진행중·완료 탭·스크롤 콜랩스 헤더)
    travel-plan.html          # 여행 계획 상세 (지도 헤더·일자별 스팟 타임라인)
    travel-new.html           # 새 여행 계획 만들기
  community/
    community-feed.html       # 커뮤니티 피드 (레시피·갤러리·콘테스트 탭·타이틀 하단 검색바)
  spot/
    spot-detail.html          # 스팟 상세 (포토제닉 스코어·날씨·사진·리뷰 탭·채팅)
    spot-register.html        # 새 스팟 등록 (3단계 폼·장소명 필수 검증)
    spot-change.html          # 위시리스트 스팟 변경
    spot-list.html            # 스팟 목록 (방문 스팟 등 쿼리 파라미터 기반 뷰)
    review-write.html         # 리뷰 작성 (별점·날짜·시간대·본문·사진·장비)
  mypage/
    mypage.html               # 마이페이지 (팔로워/팔로잉·방문스팟·사진·리뷰 스탯·포토제닉 리포트)
    my-photos.html            # 내 사진 갤러리 (앨범·그리드 뷰·핑크 필터 칩)
    profile-edit.html         # 프로필 편집
    setting.html              # 설정 (알림·계정·로그아웃)
    notification.html         # 알림 목록
  wishlist/
    wishlist.html             # 위시리스트 목록
    wishlist-setting.html     # 위시리스트 상세 설정
```

---

## 목업 파일 규칙

### 뷰포트 & 폰 프레임

- 모바일 기준 **390 × 844px** (iPhone 15 Pro 기준)
- 브라우저에서 열면 `.phone-frame`이 중앙에 렌더링됨
- `@media (min-width: 391px)` 에서 폰 프레임 시뮬레이션

**데스크탑 미디어 쿼리 표준 패턴** (모든 파일 공통):
```css
@media (min-width: 391px) {
  body { padding: 20px 0; }
  .phone-frame {
    border-radius: 40px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    min-height: unset;               /* base min-height 무효화 필수 */
    height: calc(100dvh - 40px);     /* 고정 높이 → phone-frame이 스크롤 컨테이너 */
    overflow-y: auto;
    overflow-x: hidden;
  }
}
```

> `min-height: unset` 없이 `height: calc(100dvh - 40px)`만 쓰면 CSS 우선순위상 `min-height: 100dvh`가 이겨서 JS `frame.scrollTop` 감지가 깨짐.

### 스크롤바 숨김 (모든 파일 공통)

```css
* { scrollbar-width: none; -ms-overflow-style: none; }
*::-webkit-scrollbar { display: none; }
```

### 공통 CSS 변수 (각 파일 `:root`)

| 변수 | 값 | 용도 |
|---|---|---|
| `--color-accent` | `#e31b59` | 브랜드 핑크 — 버튼·활성 탭·포커스 |
| `--color-accent-hover` | `#c91550` | 핑크 hover 상태 |
| `--color-bg` | `#ffffff` | 페이지 배경 |
| `--color-surface` | `#f5f5f7` | 카드·인풋 배경 |
| `--color-text-primary` | `#000000` | 본문 텍스트 |
| `--color-text-secondary` | `rgba(0,0,0,0.48)` | 보조 텍스트 |
| `--color-error` | `#ff453a` | 에러 상태 |
| `--color-success` | `#34c759` | 성공 상태 |

**버튼 비활성화 색상**: `rgba(227, 27, 89, 0.25)` (signup, spot-register 등 동일 적용)

### 폰트

- `fonts.css` 를 `<link rel="stylesheet" href="../fonts.css" />` 로 참조
- Pretendard Variable — `font-weight` 100~600 사용 (700 이상 사용 안 함)
- 모든 텍스트에 음수 `letter-spacing` 적용 (`-0.2px` ~ `-0.6px`)

### 내비게이션

- 페이지 이동은 `location.href = '../folder/file.html'` 방식
- 같은 폴더 내 이동은 `./file.html` 사용
- 뒤로가기는 `history.back()` 또는 명시적 경로

---

## 하단 탭바 (5개 탭)

공통 구조 — 각 파일마다 직접 포함 (React Native 구현 시 `TabBar` 컴포넌트로 통합 예정)

| 탭 | 아이콘 | 연결 파일 |
|---|---|---|
| 홈 | Tabler `home` | `home/home.html` |
| 지도 | Tabler `map` | `home/map.html` |
| 여행 | Tabler `route` | `travel/travel-list.html` |
| 커뮤니티 | Tabler `users` | `community/community-feed.html` |
| MY | Tabler `user` | `mypage/mypage.html` |

- 활성 탭: `is-active` 클래스 → `color: var(--color-accent)`
- `map.html`은 탭바 `position: absolute` (풀스크린 지도 위 오버레이), 나머지는 `position: fixed`

---

## 페이지별 주요 기능

### auth/login.html
- 앱 진입 시 핑크 스플래시 화면 내장 (페이드인 → 유지 → 페이드아웃)
- 이메일/비밀번호 로그인 + 카카오·애플 소셜 로그인

### auth/signup.html
- 이메일 인증 코드 발송/확인
- 비밀번호 강도 표시 (4단계)
- 관심 테마 멀티 선택 칩
- 약관 전체 동의 / 개별 동의
- 필수값 완료 시 가입 버튼 활성화 (`rgba(227,27,89,0.25)` → `#e31b59`)

### auth/oauth-onboarding.html
- 소셜 로그인 이후 닉네임·관심 테마 등 추가 정보 입력

### home/home.html
- 골든아워 그라디언트 히어로 섹션
- **검색창 클릭 시 검색 패널 오버레이** (position: fixed, 390px 고정):
  - `#searchFocusPanel`: 최근 검색어 3개(개별 삭제·전체 삭제) + 인기 검색어 TOP 5(순위 변동 배지)
  - `#searchResultPanel`: 결과 수 + 관련순 정렬 + 스팟 카드 리스트 → 카드 클릭 시 `spot-detail.html` 이동
  - `없는검색어` 입력 시 empty state 확인 가능
- **필터 바텀시트** (필터 아이콘 클릭): 거리(단일)·시간대(복수)·날씨(복수)·포토제닉 스코어(단일) → 적용 시 아이콘 핑크 뱃지 표시
- 카테고리 가로 스크롤 칩
- 주변 스팟 카드, 인기 스팟, 캘린더 섹션

### home/map.html
- 풀스크린 지도 (phone-frame 전체)
- 상단 상태바(시간·다이나믹아일랜드·배터리)는 `position: absolute; pointer-events: none` 투명 오버레이
- 검색바·카테고리 필터 칩·줌 컨트롤·현위치 버튼 오버레이
- 마커 탭 → 스팟 미리보기 카드 슬라이드업 → 상세 이동

### travel/travel-list.html
- 스크롤 콜랩스 헤더: `frame.addEventListener('scroll')` + `is-scrolled` 클래스로 큰 타이틀 접힘
- `min-height: unset` 적용으로 `frame.scrollTop` 정상 감지
- 여행 카드 (예정·진행중·완료 상태 뱃지)
- 새 여행 만들기 버튼 → `travel-new.html`

### community/community-feed.html
- 스크롤 콜랩스 헤더 (travel과 동일 패턴)
- 타이틀 하단 검색바 (항상 노출, 스크롤 시 큰 타이틀만 접힘)
- 레시피·갤러리·콘테스트 탭 전환
- 인기순 정렬 드롭다운

### spot/spot-detail.html
- 탭: 정보 / 사진 / **리뷰** / AI분석
- 리뷰 탭: 평점 분포 + 정렬 칩 + 리뷰 카드 + 하단 고정 "리뷰 작성하기" 버튼 → `review-write.html`
- 포토제닉 스코어 (날씨·골든아워·미세먼지·혼잡도·계절 항목)
- 실시간 채팅 패널

### spot/spot-register.html
- 3단계 스텝 폼 (사진 등록 → 위치 선택 → 상세 정보)
- 단계별 진행 프로그레스 바
- 대표 사진: Tabler `camera-plus` 아이콘 (카메라+플러스 통합)
- EXIF 자동 감지 배너
- 3단계 장소명 필수값 — 미입력 시 "등록하기" 버튼 비활성화

### spot/review-write.html
- 별점(1~5) + 방문 날짜 + 시간대 칩(일출·낮·일몰·야간) + 본문(20자 이상) 모두 입력 시 등록 버튼 활성화
- 사진 최대 5장 슬롯
- 장비 체크리스트

### mypage/mypage.html
- 스탯 2행 구조:
  - 1행: 팔로워 · 팔로잉 (탭 → 팔로워/팔로잉 목록 바텀시트)
  - 2행: 방문 스팟 · 사진 · 리뷰 (각각 탭 시 페이지 이동)
    - 방문 스팟 → `spot/spot-list.html?view=visited`
    - 사진 → `mypage/my-photos.html`
    - 리뷰 → 내가 쓴 리뷰 바텀시트 (개별 삭제 가능)
- 포토제닉 리포트 레이더 차트
- 지난 촬영 갤러리 + 전체보기 → `my-photos.html`

### mypage/my-photos.html
- 앨범 뷰 / 그리드 뷰 토글 (세그먼트 컨트롤)
- 요약 카드 (총 사진 수·앨범 수·지역 수)
- 핑크 필터 칩 (전체·야경·일출·일몰·낮) — `position: sticky`
- 앨범 뷰: 연도별 그룹·썸네일·메타데이터 배지
- 그리드 뷰: 3열 월별 섹션

---

## 화면 간 네비게이션 흐름

```
auth/login
  ├─ auth/signup
  │    └─ home/home
  ├─ auth/oauth-onboarding
  │    └─ home/home
  └─ home/home ──────────────────────────────────────────┐
       ├─ [검색 결과] → spot/spot-detail                  │
       ├─ home/map ──────── spot/spot-detail              │
       ├─ spot/spot-detail                                │
       │    └─ spot/review-write                          │
       ├─ wishlist/wishlist                               │
       │    └─ wishlist/wishlist-setting                  │
       │         └─ spot/spot-change                      │
       ├─ mypage/notification                             │
       └─ [탭바] ──────────────────────────────────────────┘
            ├─ travel/travel-list
            │    ├─ travel/travel-plan
            │    │    └─ spot/spot-detail
            │    └─ travel/travel-new
            ├─ community/community-feed
            └─ mypage/mypage
                 ├─ mypage/my-photos
                 ├─ mypage/setting
                 │    └─ mypage/profile-edit
                 ├─ mypage/notification
                 ├─ spot/spot-register
                 ├─ spot/spot-list?view=visited
                 └─ wishlist/wishlist
```

---

## 공통 UI 패턴

### 스크롤 콜랩스 헤더 (travel-list, community-feed)

```js
const frame = document.querySelector('.phone-frame');
const nav = document.getElementById('page-nav');
if (frame && nav) {
  frame.addEventListener('scroll', () => {
    nav.classList.toggle('is-scrolled', frame.scrollTop > 44);
  });
}
```

- `is-scrolled` 시 `.page-nav__large` (큰 타이틀) 접힘, `.page-nav__compact-title` 노출
- **`min-height: unset`** 필수 — 없으면 frame이 스크롤 컨테이너가 되지 않아 `scrollTop` 항상 0

### 바텀시트 패턴

```css
.sheet {
  position: fixed;
  left: 50%; transform: translateX(-50%) translateY(100%);
  width: 390px;
  transition: transform 0.32s cubic-bezier(0.32,0.72,0,1);
}
.sheet.is-open { transform: translateX(-50%) translateY(0); }
```

### 검색 패널 패턴 (home.html)

```css
.search-panel {
  position: fixed;
  left: 50%; transform: translateX(-50%) translateY(8px);
  width: 390px; top: 0; bottom: 0;
  opacity: 0; pointer-events: none;
  transition: transform 0.22s, opacity 0.18s;
}
.search-panel.is-open {
  transform: translateX(-50%) translateY(0);
  opacity: 1; pointer-events: auto;
}
@media (min-width: 391px) {
  .search-panel { top: 20px; bottom: 20px; border-radius: 40px; overflow: hidden; }
}
```

### 지도 상태바 패턴 (map.html)

```css
.map-status-bar {
  position: absolute; top: 0; left: 0; right: 0;
  z-index: 25; pointer-events: none; /* 지도 터치 방해 안 함 */
}
```

---

## React Native 구현 시 참고

| 목업 구조 | React Native 대응 |
|---|---|
| `auth/` | `src/screens/auth/` |
| `home/` | `src/screens/home/` |
| `travel/` | `src/screens/travel/` |
| `community/` | `src/screens/community/` |
| `spot/` | `src/screens/spot/` |
| `mypage/` | `src/screens/mypage/` |
| `wishlist/` | `src/screens/wishlist/` |
| 하단 탭바 | `src/components/TabBar.tsx` |
| 상태바 | `src/components/StatusBar.tsx` |
| 스플래시 | `src/components/SplashScreenView.tsx` ← 삭제됨, login.html 참고 |

---

## 목업 열기

별도 서버 없이 파일을 직접 브라우저에서 열 수 있습니다.

```bash
# macOS
open src/components/ui/home/home.html

# VS Code Live Server 확장 사용 권장
# (폰트·상대경로가 서버 환경에서 더 안정적으로 동작)
```
