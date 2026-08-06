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
    map.html                  # 지도 (풀스크린·투명 상태바·마커 팝업·클러스터)
  travel/
    travel-list.html          # 여행 목록 (전체·예정·진행중·완료 탭·스크롤 콜랩스 헤더 · 빈 상태 ?empty=1)
    travel-plan.html          # 여행 계획 상세 (지도 헤더·일자별 스팟 타임라인)
    travel-new.html           # 새 여행 계획 만들기
  community/
    community-feed.html       # 커뮤니티 루트 (게시글·갤러리·콘테스트 세그먼트 / 콘테스트 하위 진행중·내 출품·지난 서브탭)
    community-post.html       # 게시글 상세 (액션시트·삭제·신고·토스트 / 사진 라이트박스 → EXIF 2중 레이어)
    community-write.html      # 게시물 작성 (위치·촬영 정보 바텀시트)
    contest-all-entries.html  # 콘테스트 전체 출품작 목록 (정렬 3종·무한스크롤·투표 / 로딩·빈·에러 상태)
    contest-result.html       # 콘테스트 결과 상세 (결과 배너·최종 순위·전체 참여작 / 풀스크린)
    user-profile.html         # 다른 유저 프로필 (게시글·콘테스트·방문한 스팟 탭)
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
  wishlist/
    wishlist.html             # 촬영 조건 알림 설정 목록 (날씨·골든아워·미세먼지 조건, 빈 상태 ?empty=1)
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
| `--color-text-secondary` | `rgba(0,0,0,0.4)` | 보조 텍스트 (설명·메타) |
| `--color-text-tertiary` | `rgba(0,0,0,0.3)` | 비활성·플레이스홀더 |
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

> **토큰과 값이 같은 raw 리터럴은 쓰지 않습니다.** `color: rgba(0,0,0,0.4)` 대신 `var(--color-text-secondary)`,
> `border: 0.5px solid rgba(0,0,0,0.08)` 대신 `var(--color-border)`. `scripts/check-mockups.py`가 잡습니다.
>
> 토큰에 없는 중간톤(`0.35 · 0.45 · 0.5 · 0.55` 등)은 그대로 써도 됩니다 — 억지로 토큰에 맞추면 디자인이 뭉갭니다.
> 다만 같은 역할에 매번 다른 알파를 새로 고르지는 마세요. 세 계층(본문 `primary` / 보조 `secondary` / 비활성 `tertiary`)으로
> 설명되는 텍스트는 토큰을 쓰고, 그 밖의 값은 왜 중간톤이어야 하는지 설명될 때만 씁니다.
>
> `--color-text-*`는 **텍스트 전용**입니다. 배경·보더에 쓰지 마세요 (`--color-surface`, `--color-border*` 사용).

**스페이싱 (8px 그리드)**

| 변수 | 값 |
|---|---|
| `--space-md` | `16px` |
| `--space-lg` | `24px` |
| `--space-xl` | `32px` |

**반경**

| 변수 | 값 | 용도 |
|---|---|---|
| `--radius-input` | `12px` | 인풋 |
| `--radius-btn` | `26px` | 주요 CTA 버튼 (높이 52px pill) |
| `--radius-card` | `16px` | 카드 |
| `--radius-pill` | `17px` | 높이 34px pill |

> **pill의 radius는 토큰이 아니라 높이의 절반입니다.** 높이 44px 버튼은 `22px`, 30px 칩은 `15px`.
> 값이 우연히 `--radius-card`(16px)와 같더라도 토큰을 쓰면 안 됩니다 — 나중에 카드 반경을 조정하는 순간
> 버튼 모양이 깨집니다. `--radius-btn`/`--radius-pill`도 각각 52px/34px 높이 전용입니다.
>
> 카드 반경은 실제로 `12 · 14 · 16 · 20px`이 혼용됩니다. 그중 `16px`만 토큰이 있으니,
> 새 카드는 `var(--radius-card)`부터 검토하고 다른 값을 쓸 거면 주변 카드와 맞춥니다.

**폰트 크기** — `layout.ts FONT_*`와 대응

| 변수 | 값 | RN 상수 | 역할 (이 크기를 쓰는 UI) |
|---|---|---|---|
| `--font-2xs` | `10px` | `FONT_2XS` | 배지·태그 |
| `--font-xs` | `11px` | `FONT_XS` | 행 설명·캡션·섹션 라벨 |
| `--font-sm` | `13px` | `FONT_SM` | 행 우측 값·링크·필터 칩·버튼 |
| `--font-base` | `14px` | (없음 → `normalizeFontSize(14)`) | 본문·토스트 |
| `--font-md` | `15px` | `FONT_MD` | 행 제목·강조 본문 |
| `--font-lg` | `17px` | `FONT_LG` | 네비·화면 타이틀 |
| `--font-xl` | `22px` | `FONT_XL` | 페이지 내 섹션 타이틀 |
| `--font-2xl` | `28px` | `FONT_2XL` | 강조 대제목 |

> **폰트 크기는 이 8개 토큰(`10 · 11 · 13 · 14 · 15 · 17 · 22 · 28px`) 안에서만 고릅니다.**
> 그 사이값(`9 · 12 · 16 · 18 · 20px` 등)은 토큰에 없으므로 새로 만들어 쓰지 않습니다.
> - `12px` → `11`(`--font-xs`) 또는 `13`(`--font-sm`) 으로 맞춤 (12px 요청은 반려)
> - `20px` → `22`(`--font-xl`), `16 · 18px` → 가까운 토큰으로
> - 목업은 항상 `var(--font-*)` 토큰으로 작성하고 raw px 폰트는 쓰지 않습니다.

### 폰트

- `body { font-family: var(--font-family); }` — `--font-family`는 `fonts.css`에서 정의, `common.css`의 `body` 스타일에서 적용
- Pretendard Variable — `font-weight` 100~600 사용 (700 이상 사용 안 함)
- 모든 텍스트에 음수 `letter-spacing` 적용 (`-0.2px` ~ `-0.6px`)
  - 한글 본문·메타: `--font-2xs`/`--font-xs`는 `-0.1px`, `--font-sm` 이상은 `-0.2px` ~ `-0.6px`
  - **예외 — 대문자·마이크로 라벨은 양수 트래킹 허용** (`+0.3px` ~ `+1px`): `WEEKLY`, `D-3`, `BETA` 같은 배지, `--font-2xs`/`--font-xs` 섹션 라벨("현재 순위", "받은 표"). 좁은 글자를 벌려 라벨로 읽히게 하는 의도이며 레포 전반에서 쓰이는 확립된 패턴
  - 한글 문장·헤딩에는 양수 트래킹을 쓰지 않습니다

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
- **탭바는 탭 루트 화면에만 둡니다.** 다른 화면에서 push로 진입하는 목적지(`community-post`, `community-write`, `contest-all-entries`, `contest-result`, `user-profile`, `my-photos`, `travel-plan` 등)에는 탭바를 넣지 않습니다 — RN에서 이들은 스택 내부 화면이라 탭바가 가려지고, 목업에 탭바가 있으면 잘못된 네비게이션 상태를 표시하게 됩니다

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
- 빈 상태 (`?empty=1`): 출사 계획 없을 때 CTA → `travel-new.html`

### community/community-feed.html
- 스크롤 콜랩스 헤더 (travel과 동일 패턴)
- 세그먼트 3개: 게시글 · 갤러리 · 콘테스트 — `switchView('posts'|'gallery'|'contest', el)`
- 검색은 헤더 아이콘 → 전체 오버레이 (대상 chips 5개 · 최근 검색), `취소`로 닫기
  - **최근 검색 섹션은 정적 블록입니다** — 행 탭 · 개별 삭제 · `모두 지우기` 모두 핸들러가 없어
    동작이 명세돼 있지 않습니다. RN 구현 시 보이는 대로 옮기면 죽은 컨트롤 3개가 됩니다.
    검색 히스토리 API(`src/api/search.ts` `getSearchHistory`) 확정 후 동작을 정의하세요
- 인기순 정렬 드롭다운
- 콘테스트 세그먼트 하위 언더라인 서브탭 3개 — `switchSubtab('active'|'mine'|'past', el)`
  - 콘테스트에서만 헤더 고정을 풀고 **서브탭 행만 sticky** (`.phone-scroll.is-contest`) —
    타이틀·세그먼트까지 고정하면 152px을 항상 물고 있어 사진을 훑는 화면에서 손해입니다.
    같은 이유로 콘테스트 탭에서는 헤더 검색 아이콘을 숨깁니다(검색 대상이 게시글·갤러리라 없음). `+` 버튼은 유지
  - 진행중: 히어로 280px(하단 정렬·스크림 필수) · 1위 카드(사진 위 오버레이 유지) ·
    **2~7위 통일 그리드**(목록 화면과 같은 카드 = 1:1 사진 + 아래 정보 영역 + 28px 원형 투표 버튼) ·
    `출품작 128개 모두 보기` → `contest-all-entries.html`
    - 사진 위에 얹는 것은 순위 배지뿐입니다. 좋아요 수 pill은 투표 버튼과 혼동돼 제거했고, 득표수는 메타 텍스트로 내렸습니다
    - 투표는 낙관적 업데이트 · 확인 모달 없음 · **되돌리기 없음**
  - 내 출품: 컴팩트 배너 120px · 캡션 수정 시트 · 출품 취소 모달 · 출품하기 시트
  - 지난: 2열 그리드 카드 → `contest-result.html`
- 하단 고정 CTA 바는 높이 고정이 아니라 `padding: 14px 28px calc(22px + env(safe-area-inset-bottom))`입니다 —
  72px 고정이면 52px 버튼과 높이가 거의 같아 버튼만 비대해 보이고, 홈 인디케이터에도 물립니다.
  부모(`.subview`)에 좌우 패딩이 없으므로 음수 마진 상쇄(`margin: 0 -28px`)를 쓰면 안 됩니다
- 게시물 작성 버튼 → `community-write.html`
- 카드 유저명 → `user-profile.html`
- 인터랙션으로 도달 불가한 상태는 쿼리로 진입: `?empty=1` (내 출품 빈 상태)

### community/community-post.html
- 게시글 상세 — 히어로 · 유저 · 캡션 · 촬영 정보 · 포토제닉 · 댓글
- `⋯` → 액션시트. `?mine=1`이면 내글(수정·삭제), 없으면 남글(신고)
- 삭제 확인 모달 · 신고 사유 시트(사유 선택 즉시 접수) · 완료 토스트 2종
- 히어로 우측 상단 확대 → 라이트박스(layer 1) → `(i)` → EXIF(layer 2, 라이트박스 위에 겹침)
  - EXIF를 닫으면 라이트박스가 남는다. 라이트박스를 닫으면 둘 다 닫힌다
- 하단은 탭바 대신 댓글 입력 바 (푸시 화면)

### community/contest-all-entries.html
- 콘테스트 전체 출품작 목록 — `community-feed` 진행중 탭의 `출품작 N개 모두 보기`로 push 진입
- 히어로 없이 네비 타이틀(`전체 출품작` + 총 개수)만. **검색 없음** — 훑어보며 투표하는 화면이고 내 작품은 `내 출품` 탭에 있음
- 정렬은 칩(pill)이 아니라 배경 없는 텍스트 3개(최신순 · 득표순 · 랜덤), 구분점 3px. 기본은 **최신순**
  - 득표순이 기본이면 상위권만 표를 더 받는 구조라 새 출품작이 영영 노출되지 않습니다
  - 랜덤은 세션 시드 고정(스크롤 중 순서 유지), 재진입 시 재추첨
- 카드: 2열 · 좌우 28 · gap 20 · radius 16 · 배경 `#f5f5f7`. 1:1 정사각 사진 + 아래 정보 영역(패딩 9/12/11)
  - **사진 위에 텍스트를 얹지 않습니다** — 사진 밝기에 따라 오버레이가 안 보이는 문제 때문.
    예외는 득표순일 때의 순위 배지 하나뿐(배경 `rgba(255,255,255,.92)`)
- 투표 버튼 28px 원형 3상태 — 기본 `#E31B59`+흰 vote / 완료 `rgba(227,27,89,.10)`+핑크 check / 소진 `#e6e6ea`+`#b8b8be`. 되돌리기 없음
- 남은 표는 진행중 탭의 도트 인디케이터 재사용(7px · gap 4), 정렬 바 우측. 정렬 바 자체가 sticky
  - 0표에서 카드 전체를 흐리지 않습니다 — 사진 감상이 목적인 화면이라 목록이 죽어 보입니다.
    투표 버튼만 비활성 + 안내 배너 1줄
- 상태 전환은 우상단 목업용 버튼으로 확인: 목록 · 로딩(스켈레톤 8장) · 빈 · 에러
- 페이징은 무한스크롤 24개 단위, 마지막에 `출품작 N개를 모두 봤어요` 캡션

### community/contest-result.html
- 콘테스트 결과 상세 — 결과 배너 · 최종 순위 가로 스크롤 · 전체 참여작 그리드
- 풀스크린 목적지 (시트 아님) — 스크롤이 길고 공유·딥링크 대상

### community/user-profile.html
- 다른 유저 프로필 (자기 프로필은 `mypage/mypage.html`)
- 탭 3개: 게시글 · 콘테스트 · 방문한 스팟
- 팔로우 버튼 토글 · 메시지 버튼은 BETA disabled

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
            │    ├─ community/community-post
            │    ├─ community/community-write
            │    ├─ community/contest-all-entries
            │    ├─ community/contest-result
            │    └─ community/user-profile
            └─ mypage/mypage
                 ├─ mypage/my-photos
                 ├─ mypage/setting
                 │    └─ mypage/profile-edit
                 ├─ mypage/notification
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

### 토스트 · 스낵바 패턴

같은 "잠깐 떴다 사라지는 알림"이지만 액션 버튼 유무로 형태가 갈립니다.

| | 토스트 (`.toast`) | 스낵바 (`.snackbar`) |
|---|---|---|
| 용도 | 결과 통보만 ("삭제되었어요") | 되돌릴 수 있는 액션 포함 |
| 폭 | 콘텐츠 폭 (`white-space: nowrap`), 중앙 정렬 | 풀폭 (`left/right: 28px`) |
| 높이 / radius | 44px / 22px | 48px / 24px |
| 배경 | `rgba(0, 0, 0, 0.75)` | `rgba(0, 0, 0, 0.75)` |
| `pointer-events` | `none` (탭 통과) | 열렸을 때 `auto` (버튼 눌러야 함) |

공통: `font-size: var(--font-base)`, `font-weight: 500`, `letter-spacing: -0.2px`, `color: #fff`,
`opacity` + `translateY(16px)` 페이드 (`transition: opacity 0.3s, transform 0.3s`), 2.6~2.8초 후 자동 닫힘.
표시 클래스는 파일 내 다른 오버레이(시트·모달·라이트박스)와 맞춥니다 — community는 `is-open`, mypage는 `is-visible`.

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
