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
    contest-submit.html       # 콘테스트 출품 작성 (썸네일 스트립·장소 검색·업로드 중/실패)
    contest-entry-detail.html # 콘테스트 출품작 상세 (투표 CTA·⋯ 액션시트 / 결과 발표 후 순위 블록)
    contest-all-entries.html  # 콘테스트 전체 출품작 목록 (투표 기간 · 지난 콘테스트 2가지 용도 / 로딩·빈·에러 상태)
    contest-result.html       # 콘테스트 결과 (10a 요약·10b 수상작 상세·10d 축하·10f 순위권 밖 / 풀스크린)
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
    notification.html         # 알림 목록 (커뮤니티 필터에 콘테스트 알림 4종 포함 — 시작·마감 임박·투표 시작·결과 발표)
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
- **탭바는 탭 루트 화면에만 둡니다.** 다른 화면에서 push로 진입하는 목적지(`community-post`, `community-write`, `contest-submit`, `contest-entry-detail`, `contest-all-entries`, `contest-result`, `user-profile`, `my-photos`, `travel-plan` 등)에는 탭바를 넣지 않습니다 — RN에서 이들은 스택 내부 화면이라 탭바가 가려지고, 목업에 탭바가 있으면 잘못된 네비게이션 상태를 표시하게 됩니다

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
  - **주기는 월간입니다** — 매달 1~14일 출품 / 15일~말일 투표 / 다음 달 1일 결과 발표(그 달 내내 노출).
    결과가 독립된 기간이 아니라 다음 주기와 겹치므로 **진행중 탭에는 항상 두 콘테스트가 공존합니다**
    (이번 달 진행중 + 지난 달 수상작)
  - **진행중은 phase에 따라 화면이 갈립니다** — `SUBMITTING` · `VOTING` · `RESULT` · `ENDED` 4개를 서버가 내려줍니다.
    목업은 우상단 `.phase-switch`로 전환해 확인합니다 (`switchPhase(phase, el, variant)`)
    - **출품 기간(9a)**: 히어로 280px + `8월 · 출품 기간` 배지. **순위도 투표 버튼도 없습니다**.
      1인 3장까지 내고 **수정은 불가, 삭제 후 재출품**입니다.
      섹션 헤더 우측에 `내 출품작 2/3 ›` pill → 내 출품작 시트(8d). 하단 바 CTA는 `출품하기` 하나
    - **출품 0개(9d)**: 그리드와 섹션 헤더를 통째로 감추고 빈 상태만. 히어로 참여 수는 `오늘 시작했어요`,
      하단 바 좌측은 `최대 3장까지 낼 수 있어요`. 수상작 요약 행은 그대로 둡니다
    - **투표 기간(9b)**: 히어로 200px(순위 변동 펼치면 160px). 정렬은 **최신순(기본) · 득표순 2개**.
      추가 출품 불가 — CTA가 사라지고 좌측이 `내 출품작 2개`로만 남습니다.
      우측 CTA는 `214개 출품 모두 보기` → `contest-all-entries.html`
    - **발표 당일(10e)**: 결과 카드가 히어로보다 **위에** 옵니다 — 사용자가 기다린 것은 결과이고 새 주제는 그다음입니다.
      2일부터는 히어로 아래 요약 행(9a)으로 내려갑니다
    - **콘테스트 없음(7a·7b)**: 예고 카드 + 지난 콘테스트 3개 리스트. 사진은 쓰지 않습니다 —
      히어로처럼 보이면 지금 참여할 수 있다고 오해합니다
  - **지난 달 수상작 요약 행**(`.award-row`)은 9a·9b 히어로 바로 아래 72px로 **상시** 붙습니다.
    썸네일 3개 겹침 + `7월 수상작` + `비 오는 날 · @닉네임 1위` + chevron → `contest-result.html`.
    투표 기간에는 순위 변동 행이 그 자리를 쓰므로 이 행을 그 아래로 내립니다
  - 순위 변동 섹션(`.rank-panel`)은 투표 기간에만
    - **매일 자정 1회** 집계한 **1~3위만** 공개하고, 그래프는 **최근 7일**입니다.
      2주 동안 하루 3번이면 스냅샷이 42개라 그래프가 성립하지 않습니다
    - 접힘 72px — `어제 집계 · @닉네임 1위`. 펼침 — `어제 집계` 배지 + 7일 × 3위 그래프 + **날짜** 세그먼트 + 범례 3행
    - **각 선의 마지막 점에만 30px 썸네일**을 올립니다. 7일 × 3작품 21개를 전부 썸네일로 하면 겹쳐서 못 읽습니다
    - 그래프 선은 1위만 accent, 나머지는 `#b8b8be` / `#d2d2d8`. **마지막 집계 이후의 실시간 득표수는 노출 금지**
    - 그래프 점의 `left`는 **비율**입니다(viewBox 306 기준 x/306). 고정 px면 360dp에서 우측 점이 밖으로 나갑니다
    - 변형 3종은 `data-variant`로 분기 — `normal`(11a) · `first`(11b 집계 전) · `out`(12a 권외 진입/이탈)
      - `first`: 그래프 대신 `첫 집계는 내일 자정에 나와요` 한 줄 카드. 날짜 세그먼트도 감춥니다
      - `out`: 1·2·3위 아래 네 번째 점선 밴드(`권외`)를 깔고 높이를 150 → **190px**로 키웁니다.
        진입 전은 점선(이 구간의 실제 순위를 모른다는 뜻), 진입한 날부터 실선. 범례에 `NEW` 배지
    - 자동 펼침 조건은 **그날 첫 진입 시 1회** — 자정 집계는 대부분 자는 시간이라 시각 기준이 의미가 없습니다
  - **표는 콘테스트 기간(2주) 통틀어 3개**이고 **매일 리셋되지 않습니다**. 날짜 리셋 문구를 어디에도 두지 마세요
  - **투표 취소는 투표 기간 안에서 자유입니다** — 완료 버튼 재탭으로 표 1개 복구, 마감(말일)에 확정
  - 투표 피드백은 목록 화면과 동일 — 색 반전 + 토스트 + 햅틱
  - **내가 투표한 작품 시트**(`#myvotes-sheet`)는 정렬 바의 **남은 표 pill 하나**로 엽니다.
    하단 바에 액션을 둘 두면 버튼처럼 생긴 쪽만 눌리므로, 하단은 `모두 보기` 하나만 남겼습니다
  - **내 출품작 시트**(`#myentries-sheet`, 8d·8f) — `내 출품작 2/3 ›` pill로 열립니다.
    수정 불가 고지를 목록 **위에** 둡니다(삭제를 누르기 전에 읽혀야 의미가 있음).
    투표 기간에는 `n개 더 출품하기` CTA가 사라지고 안내 문구가 바뀝니다(`.is-voting`).
    삭제만 확인 다이얼로그(8e)를 씁니다 — 되돌릴 수 없기 때문. 투표 취소는 토스트만
  - 내 출품 탭(8a·8b): 카드 하나(숫자 3개 + 순위 추이 그래프) + 회차별 기록 리스트.
    출품 3회 미만이면 그래프와 구분선을 감춥니다. 메타는 월 표기로 시작(`7월 · 96명 중 · 41표`)
  - 지난 탭(15a·15b): **1열** 회차 카드 리스트(한 행이 한 달). 2열이면 사진이 작아져 회차를 알아보기 어렵습니다.
    첫 행은 항상 **전전 달** — 가장 최근 결과는 진행중 탭 요약 행에 있습니다
- **하단 바는 화면 고정이 아니라 스크롤 흐름의 마지막**(`.footbar`)입니다. 좌측은 누를 수 없는 안내 텍스트이고
  상태에 따라 문구만 바뀝니다 — `아직 출품하지 않았어요`(0개) / `1개 더 낼 수 있어요`(1~2개) /
  `3개 모두 출품했어요`(3개, CTA `#e6e6ea` 비활성)
- 게시물 작성 버튼 → `community-write.html`
- 카드 유저명 → `user-profile.html`
- 출품작 카드 → `contest-entry-detail.html`, 출품하기 → `contest-submit.html`

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
- **투표 기간에만 열리는 화면입니다.** 출품 기간에는 진입 경로가 없습니다
  (결과 확정 후에는 결과 화면의 `전체 순위 보기`로 지난 콘테스트 변형(1b)이 열립니다)
- 정렬은 칩(pill)이 아니라 배경 없는 텍스트 2개(최신순 · 득표순), 구분점 3px. 기본은 **최신순**
  - API 정렬 옵션이 `LATEST` / `VOTES` 2개로 확정돼 **랜덤은 빠졌습니다**.
    랜덤이 없어지면서 커서 페이징의 `seed` 파라미터도 필요 없어졌습니다
  - 득표순을 기본으로 두면 상위 작품에 표가 더 몰리므로 투표 기간 기본은 최신순입니다. 지난 콘테스트는 득표순 기본
- 카드: 2열 · 좌우 28 · gap 20 · radius 16 · 배경 `#f5f5f7`. 1:1 정사각 사진 + 아래 정보 영역(패딩 9/12/11)
  - **사진 위에 아무것도 얹지 않습니다** — 사진 밝기에 따라 오버레이가 안 보이기 때문. 예외 없습니다
  - 메타는 `스팟 · 출품 시각`. 득표수는 노출하지 않습니다
- 투표 버튼 28px 원형 3상태 — 기본 accent+흰 thumbs-up / 완료 `rgba(227,27,89,.10)`+accent check / 소진 `#e6e6ea`+`#b8b8be`
  - **완료 버튼 재탭으로 취소** — 표 1개가 복구되고, 투표 마감(말일)에 확정됩니다
  - 아이콘은 lucide `ThumbsUp`입니다. 핸드오프 README가 `Vote`라고 적고 있으나 실제 시안 SVG는 ThumbsUp이고,
    lucide `Vote`(투표함)는 15px에서 읽히지 않습니다
- **남은 표 pill**(`.sortbar__votes`)은 정렬 바 우측 — 배경 `#f5f5f7` · 높이 32 · 도트 7px/gap 4 · 우측 chevron 14px.
  탭하면 내가 투표한 작품 시트가 열립니다. 정렬 바 자체가 sticky
  - **표는 콘테스트 기간(2주) 통틀어 3개**이고 매일 리셋되지 않습니다
  - 0표에서 카드 전체를 흐리지 않습니다 — 사진 감상이 목적인 화면이라 목록이 죽어 보입니다.
    투표 버튼만 비활성 + 안내 배너 1줄(`표 3개를 모두 썼어요. 투표를 취소하면 다시 쓸 수 있어요`)
- 투표 피드백은 세 겹입니다 — 버튼 색 반전 + 토스트(`@rimi 님에게 투표했어요 · 2/3`) + 햅틱
  - 액션 버튼이 없는 결과 통보라 스낵바가 아니라 `.toast` 규약(44px · 콘텐츠 폭)을 따릅니다
  - 햅틱은 RN 전용(`src/utils/haptics.ts`의 `voteHaptic()` → `Haptics.impactAsync(Light)`)
- **내가 투표한 작품 시트** (시안 6a·6b) — 남은 표 pill로 열림. 진행중 탭과 같은 시트입니다
  - 스크림 `rgba(0,0,0,.34)` · 시트 radius `24 24 0 0` · 핸들 36×4 `#e6e6ea`
  - 제목 `내가 투표한 작품 n`(개수만 `#c7c7cc`), 행은 썸네일 44px(radius 11) + 닉네임 + `오늘 14:20 · 스팟` + 취소 pill(32px)
  - 푸터: 남은 표 도트 + `투표 마감 전까지 언제든 바꿀 수 있어요`. 표가 0개면 푸터를 감추고 빈 상태를 보여줍니다
  - **취소는 다이얼로그 없이 즉시 반영**하고 토스트로만 알립니다. 그리드·도트·시트가 함께 갱신됩니다
  - 기간 종료 후에는 취소 버튼을 없애고 목록만 남깁니다
- **지난 콘테스트 변형** (시안 1b) — 결과가 확정된 뒤의 같은 화면입니다
  - 정렬 `득표순(기본) · 최신순`, 사진 좌상단 **순위 배지 부활**, 메타는 `n표 · 스팟`
  - **투표 버튼과 남은 표 pill이 없고**, 그 자리에 `7월 31일 종료`가 들어갑니다
  - `.card__rank` CSS는 이 용도 전용입니다 — 투표 기간에는 사진 위에 아무것도 얹지 않습니다
- 상태 전환은 우상단 목업용 버튼으로 확인: 목록 · 지난 · 로딩(스켈레톤 8장) · 빈 · 에러
- 페이징은 커서 기반 무한스크롤 24개 단위, 마지막에 `출품작 N개를 모두 봤어요` 캡션
  - 오프셋 방식은 스크롤 도중 새 출품작이 올라오면 항목이 밀려 중복·누락이 생깁니다
  - 응답에는 원본이 아니라 카드 폭 2배(314px) 썸네일 URL을 넣어야 스크롤이 버팁니다
- 카드 탭 → `contest-entry-detail.html`

### community/contest-submit.html
- 출품 작성 — `출품하기` CTA의 목적지. 사진 · 설명 · 촬영 장소 셋만 받습니다 (시안 13a~13e)
- **사진 선택은 OS 기본 갤러리**입니다. 앨범 화면을 따로 만들지 않고 다중 선택 상한을 남은 자리 수(최대 3)로 걸어 호출합니다
- **한 번에 여러 장 고르고 한 폼에서 처리**합니다 — 56px 썸네일 스트립(현재 장에 핑크 2px 링) + 우측 `1/2` 인디케이터.
  스트립이 붙으면 사진 영역이 334:188로 줄어듭니다
- 설명·장소는 **장마다 따로 저장**됩니다(투표와 순위가 사진 단위). 화면만 하나로 묶었을 뿐 서버로는 사진 수만큼 POST합니다.
  장소는 직전 장의 값을 다음 장 기본값으로 미리 채우고, 설명은 채우지 않습니다
- 설명은 **여러 줄로 늘어나는** 필드입니다. 밑줄은 텍스트 블록 전체 아래에 **하나만** 긋습니다(줄마다 긋지 않음). 80자 제한
- 장소는 검색 우선 + 자유 입력 허용 — 스팟 DB에서 고르면 `spotId`가 함께 저장되고 결과 화면의 `스팟 보기`가 연결됩니다.
  검색 결과 맨 아래 `"OO" 직접 입력` 행을 항상 두고, 결과가 없으면 이 행이 목록 자리로 올라오며 아이콘이 핑크 틴트로 강조됩니다
- 하단은 여러 장일 때만 2열 — `다음 사진`(`#f5f5f7`) · `2장 출품하기`(accent). 한 장이면 우측 하나가 전체 폭.
  **상단 우측 `완료`는 두지 않습니다** — 같은 동작이 두 곳에 있으면 눈에 띄는 쪽만 눌립니다
- 업로드 중(13d): CTA 자리가 진행 표시로 바뀌고 입력 요소가 회색으로 내려갑니다. `×`도 비활성 — 이탈을 막습니다.
  **일부만 성공하면 성공한 장은 그대로 두고 실패한 장만 폼에 남깁니다**(전체 롤백 아님)
- 업로드 실패(13e): 폼이 편집 가능한 상태로 돌아오고 입력값은 유지. 다크 48px **스낵바**(`다시 시도` 액션이 붙으므로 토스트 아님)

### community/contest-entry-detail.html
- 출품작 상세 — 카드 · 그래프 점 · 범례 행 · 투표 시트 행에서 모두 여기로 옵니다 (시안 14a~14g)
- **게시글 상세를 따르지 않습니다** — 출품작은 읽는 글이 아니라 판단하는 사진입니다.
  댓글 · 팔로우 · 저장 · 좋아요 · EXIF 칩을 전부 뺐습니다
- 사진 600px 풀블리드 + 상단 스크림(150px)만. **사진 위에 스팟 pill이나 투표 pill을 올리지 않습니다**
- 하단 흰 영역은 바텀시트가 아니라 화면의 콘텐츠 영역입니다 — **라운드를 주지 않고** 1px 상단 경계선만.
  라운드를 주면 `⋯` 액션 시트가 열렸을 때 시트가 두 겹으로 겹쳐 보입니다. 패딩 22/24/24
- 아바타와 팔로우 버튼은 두지 않습니다 — 콘테스트에서 중요한 것은 작품이지 작성자 관계가 아닙니다
- 투표 CTA는 56px 전체 폭 radius 28. **득표수는 어디에도 붙이지 않습니다**(투표 기간 비공개).
  표 0개일 때만 CTA 위에 한 줄 안내
- 결과 발표 후(14f·14g): CTA 자리가 **순위 블록**으로 바뀝니다. 크기·radius를 52/26으로 맞춰 자리가 흔들리지 않게 하고,
  누를 수 없습니다. 1~3위는 `rgba(227,27,89,.10)` 배경 + 핑크 글자. 지난 콘테스트 작품은 전부 이 상태로 열립니다
- `⋯` 액션 시트: 남의 작품은 공유/신고(14d), 내 작품은 공유/삭제 + 안내 한 줄(14e).
  삭제만 글자를 accent로 두고 **배경은 칠하지 않습니다** — 파괴적임을 알리되 버튼처럼 도드라지지 않게
- `스팟 보기`는 스팟 DB에서 고른 경우에만 붙습니다. 직접 입력한 장소는 링크만 감추고 **행 자체는 지우지 않습니다**

### community/contest-result.html
- 콘테스트 결과 — 다음 달 1일 발표 후 **한 달 내내** 유지됩니다 (시안 10a·10b·10d·10f)
- 진입 3경로: 진행중 탭 수상작 요약 행 · 지난 탭 · 내 출품 탭 회차별 기록. 어느 경로로 들어와도 같은 화면입니다
- **하단 고정 바를 쓰지 않습니다** — 앱에 이미 탭바가 있어 두 겹이면 150px 가까이 잠깁니다.
  `전체 순위 보기`는 단순 이동이므로 콘텐츠 마지막 리스트 행(`.rowlink`)으로 둡니다.
  고정 바는 그 화면의 primary 액션일 때만 씁니다(출품하기 · 모두 보기)
- 10a: 내 결과 요약 카드(썸네일 44 + `7위 · 41표` + 공유) → 1위 큰 카드(334:220) → 2·3위 2열 그리드.
  출품하지 않은 달이면 내 결과 카드를 감춥니다
- 10d 수상: 최상단이 축하 카드(`rgba(227,27,89,.06)` · radius 20)로 바뀝니다. 순위 리스트에서 내 행의 숫자만 accent.
  **4위 이하는 10a의 담백한 요약을 그대로 씁니다** — 축하 연출을 등수와 무관하게 쓰면 의미가 없어집니다.
  컨페티나 별도 모달은 쓰지 않습니다
- 10f 순위권 밖: 공유 버튼을 넣지 않습니다 — 42위를 공유하라고 권하는 것은 무례합니다.
  대신 8px 분포 바로 전체에서 내 위치를 보여줍니다(왼쪽이 1위). 지난 달 대비 변화를 우측에 붙이되
  **순위가 떨어졌으면 사실만 적고 빨강으로 강조하지 않습니다**
- 10b 수상작 상세 = 출품작 상세 14g와 같은 화면입니다. 사진 470px 풀블리드 + 상단 스크림만

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
            │    ├─ community/contest-submit
            │    ├─ community/contest-all-entries
            │    │    └─ community/contest-entry-detail
            │    ├─ community/contest-result
            │    │    ├─ community/contest-all-entries   (전체 순위 보기 — 1b 변형)
            │    │    └─ community/contest-entry-detail  (10b = 14g)
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
