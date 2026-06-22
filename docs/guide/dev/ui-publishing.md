# UI 퍼블리싱 목업 가이드

> `src/components/ui/` 폴더에 있는 HTML 목업 파일들에 대한 구조 및 규칙 설명입니다.  
> 실제 React Native 컴포넌트 구현 전 디자인 검토·협업용으로 사용합니다.

---

## 폴더 구조

```
src/components/ui/
  common/
    fonts.css                 # Pretendard Variable 폰트 정의 (공통)
    common.css                # 공통 디자인 토큰·리셋·phone-frame 기본 (공통)
    icons.js                  # Tabler Icons SVG 스프라이트 (file:// 호환)
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
    community-feed.html       # 커뮤니티 피드 (레시피·갤러리 탭·타이틀 하단 검색바)
    community-write.html      # 게시물 작성 — 미퍼블리싱
    contest.html              # 주간 콘테스트 — 미퍼블리싱
  spot/
    spot-detail.html          # 스팟 상세 (포토제닉 스코어·날씨·정보/사진/채팅 탭)
    spot-register.html        # 새 스팟 등록 (3단계 폼·장소명 필수 검증)
    spot-change.html          # 위시리스트 스팟 변경
    spot-list.html            # 스팟 목록 (방문 스팟 등 쿼리 파라미터 기반 뷰)
    review-write.html         # 리뷰 작성 (별점·날짜·시간대·본문·사진·장비)
  mypage/
    mypage.html               # 마이페이지 (팔로워/팔로잉·방문스팟·사진·리뷰 스탯·포토제닉 리포트)
    my-photos.html            # 내 사진 갤러리 (앨범·그리드 뷰·핑크 필터 칩)
    photo-map.html            # 사진 지도 (my-photos에서 연결)
    profile-edit.html         # 프로필 편집
    setting.html              # 설정 (알림·계정·로그아웃)
    notification.html         # 알림 목록
    follow.html               # 팔로워/팔로잉 목록 — 미퍼블리싱
    user-profile.html         # 타 유저 프로필 — 미퍼블리싱
  wishlist/
    wishlist.html             # 위시리스트 목록
    wishlist-setting.html     # 위시리스트 상세 설정
```

---

## 목업 파일 규칙

### 뷰포트 & 폰 프레임

- 모바일 기준 **390 × 844px** (iPhone 15 Pro 기준)
- 브라우저에서 열면 `.phone-frame`이 뷰포트 전체 너비로 렌더링됨 (full-width 방식)
- 팀 내 확인은 **브라우저 뷰포트를 390px로 맞춰서** 진행 (DevTools → 기기 시뮬레이터 또는 반응형 모드)

> 데스크탑 폰 프레임 시뮬레이션(`@media (min-width: 391px)` + `border-radius: 40px` 등)은 사용하지 않습니다. 목업은 모바일 뷰포트 기준으로만 확인합니다.

### 공통 CSS (`common.css`)

모든 파일이 `fonts.css` 다음에 `common.css`를 링크합니다.

```html
<link rel="stylesheet" href="../common/fonts.css">
<link rel="stylesheet" href="../common/common.css">
```

`common.css`에 포함된 내용:
- `:root` 디자인 토큰 (컬러·스페이싱·반경·**폰트 크기**)
- CSS 리셋 (`*, *::before, *::after`)
- **스크롤바 숨김** (`* { scrollbar-width: none; }`)
- `html` / `body` 기본 스타일
- `.phone-frame` 기본 스타일 (`width: 100%; background: var(--color-bg);`)

페이지별 `overflow`, `height` 등은 각 파일 `<style>`에서 재정의합니다.

### 디자인 토큰 (`common.css` `:root`)

**컬러**

| 변수 | 값 | 용도 |
|---|---|---|
| `--color-bg` | `#ffffff` | 페이지 배경 |
| `--color-surface` | `#f5f5f7` | 카드·인풋 배경 |
| `--color-text-primary` | `#000000` | 본문 텍스트 |
| `--color-text-secondary` | `rgba(0,0,0,0.48)` | 보조 텍스트 (설명·메타) |
| `--color-text-tertiary` | `rgba(0,0,0,0.28)` | 비활성·플레이스홀더 |
| `--color-accent` | `#e31b59` | 브랜드 핑크 — 버튼·활성 탭·포커스 |
| `--color-accent-hover` | `#c91550` | hover 상태 |
| `--color-accent-disabled` | `rgba(227,27,89,0.25)` | 비활성 버튼 |
| `--color-border` | `rgba(0,0,0,0.08)` | 구분선 |
| `--color-border-light` | `rgba(0,0,0,0.06)` | 연한 구분선 |
| `--color-input-border-focus` | `#e31b59` | 인풋 포커스 테두리 |
| `--color-kakao` | `#FEE500` | 카카오 버튼 배경 |
| `--color-kakao-text` | `#391B1B` | 카카오 버튼 텍스트 |
| `--color-error` | `#ff453a` | 에러 상태 |
| `--color-success` | `#34c759` | 성공 상태 |
| `--color-warning` | `#ff9f0a` | 경고 상태 |

**스페이싱 (8px 그리드)**

| 변수 | 값 |
|---|---|
| `--space-md` | `16px` |
| `--space-lg` | `24px` |
| `--space-xl` | `32px` |

**반경**

| 변수 | 값 | 용도 |
|---|---|---|
| `--radius-input` | `12px` | 인풋·버튼 |
| `--radius-btn` | `26px` | 주요 CTA 버튼 (pill) |
| `--radius-card` | `16px` | 카드 |
| `--radius-pill` | `17px` | 필터 칩·태그 |

**폰트 크기** — `layout.ts FONT_*`와 대응

| 변수 | 값 | 용도 |
|---|---|---|
| `--font-2xs` | `10px` | 배지·메타 |
| `--font-xs` | `11px` | 캡션 — `FONT_XS` |
| `--font-sm` | `13px` | 서브텍스트 — `FONT_SM` |
| `--font-base` | `14px` | 본문 |
| `--font-md` | `15px` | 강조 본문 — `FONT_MD` |
| `--font-lg` | `17px` | 소제목 — `FONT_LG` |
| `--font-xl` | `22px` | 제목 — `FONT_XL` |
| `--font-2xl` | `28px` | 대제목 — `FONT_2XL` |

> `12px`, `16px` 등 스케일 외 크기는 raw px로 작성합니다.

### 폰트

- `body { font-family: var(--font-family); }` — `--font-family`는 `fonts.css`에서 정의, `common.css`의 `body` 스타일에서 적용
- Pretendard Variable — `font-weight` 100~600 사용 (700 이상 사용 안 함)
- 모든 텍스트에 음수 `letter-spacing` 적용 (`-0.2px` ~ `-0.6px`)

### 로고 이미지

- `assets/images/logo/logo.png` — 프로젝트 루트 기준 경로
- HTML 파일에서 참조: `<img src="../../../../assets/images/logo/logo.png" alt="PNG 로고">`
- 히어로 네비 (home, signup): 26px / 히어로 중앙 (login): 52px

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
- 레시피·갤러리 탭 전환
- 인기순 정렬 드롭다운
- 게시물 작성 버튼 → `community-write.html` (미퍼블리싱)

### spot/spot-detail.html
- 탭: 정보 / 사진 / **채팅**
- 정보 탭: 포토제닉 스코어 (날씨·골든아워·미세먼지·혼잡도·계절), 편의 정보, 리뷰 작성하기 → `review-write.html`
- 채팅 탭: 실시간 채팅 패널, LIVE 뱃지, 사진 공유

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
       │    ├─ spot/review-write                          │
       │    └─ [사진 탭] → spot/photo-detail (미퍼블리싱)  │
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
            │    ├─ community/community-write (미퍼블리싱)
            │    └─ community/contest (미퍼블리싱)
            └─ mypage/mypage
                 ├─ mypage/my-photos
                 ├─ mypage/setting
                 │    └─ mypage/profile-edit
                 ├─ mypage/notification
                 ├─ mypage/user-profile (미퍼블리싱)
                 ├─ spot/spot-register
                 ├─ spot/spot-list?view=visited
                 └─ wishlist/wishlist
```

---

## 공통 UI 패턴

### 스크롤 콜랩스 헤더 (travel-list, community-feed)

```js
const frame = document.querySelector('.phone-scroll');
const nav = document.getElementById('page-nav');
if (frame && nav) {
  frame.addEventListener('scroll', () => {
    nav.classList.toggle('is-scrolled', frame.scrollTop > 44);
  });
}
```

- `.phone-scroll`: `.phone-frame` 내부의 실제 스크롤 컨테이너 (`height:100%; overflow-y:auto`)
- `is-scrolled` 시 `.page-nav__large` (큰 타이틀) 접힘, `.page-nav__compact-title` 노출
- `.phone-frame`에 `overflow:hidden`을 주고 `.phone-scroll`을 별도 자식으로 분리해야 `position:fixed` 요소(탭바 등)가 클리핑되지 않음

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
/* 데스크탑 폰 프레임 미사용 — 아래 블록 적용 안 함
@media (min-width: 391px) {
  .search-panel { top: 20px; bottom: 20px; border-radius: 40px; overflow: hidden; }
}
*/
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
| HTML `.phone-frame` | `ScreenContainer` (`src/components/ScreenContainer.tsx`) |
| `auth/` | `src/screens/auth/` |
| `home/` | `src/screens/home/` |
| `travel/` | `src/screens/travel/` |
| `community/` | `src/screens/community/` |
| `spot/` | `src/screens/spot/` |
| `mypage/` | `src/screens/mypage/` |
| `wishlist/` | `src/screens/wishlist/` |

---

## 목업 열기

별도 서버 없이 파일을 직접 브라우저에서 열 수 있습니다.

```bash
# macOS
open src/components/ui/home/home.html

# VS Code Live Server 확장 사용 권장
# (폰트·상대경로가 서버 환경에서 더 안정적으로 동작)
```

---

RN 구현 시 → [`docs/guide/dev/development-guide.md`](development-guide.md) 참고  
담당자 확인 → [`docs/guide/ops/team-assignments.md`](../ops/team-assignments.md) 참고
