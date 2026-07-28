# 커뮤니티 UI 퍼블리싱 파일 교체 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `.claude/design/CommunnityUI/`의 HTML 시안 32개를 프로젝트 퍼블리싱 규약에 맞는 커뮤니티 목업 5개로 통합 교체한다.

**Architecture:** 기존 목업 3개를 diff/패치하지 않고 **처음부터 새로 작성한다.** 공통 셸(head·상태바·탭바·phone-frame)을 Task 1에서 확정하고 이후 모든 파일이 그 셸을 복사해 시작한다. 각 화면은 세그먼트·서브탭·시트·모달을 한 파일 안의 상태로 담고, 인라인 `onclick` + 순수 함수로 전환한다.

**Tech Stack:** 정적 HTML + CSS 커스텀 프로퍼티(`common/common.css`) + Vanilla JS. 아이콘은 lucide 인라인 SVG(커뮤니티 본문) / tabler 인라인 SVG(공유 셸). 빌드 도구 없음 — 브라우저에서 파일을 직접 연다.

**설계 근거:** `docs/superpowers/specs/2026-07-27-community-ui-html-design.md`

## Global Constraints

- **범위는 HTML 퍼블리싱 파일 5개뿐.** RN 구현·`src/api`·`src/hooks`·`src/types`·`src/screens`는 일절 건드리지 않는다. `.claude/design/`의 `.native.jsx` 파일도 수정하지 않는다.
- **기존 퍼블리싱 파일을 따라가지 않는다.** `community-feed.html`(2,600여 줄)·`community-post.html`·`community-write.html`은 전체를 덮어쓴다. 기존 클래스 이름·CSS 구조·`switchView('recipe')` 같은 시그니처를 계승할 의무가 없다.
- **단 프로젝트 규약은 유지한다** — 이것들은 기존 파일이 아니라 `CLAUDE.md`·`docs/guide/dev/ui-publishing.md`에서 온다.
  - `<link rel="stylesheet" href="../common/fonts.css">` + `<link rel="stylesheet" href="../common/common.css">`
  - `.phone-frame` + `.phone-scroll` 구조, viewport `width=device-width`
  - 상태바·하단 탭바는 앱 전 화면이 공유하는 셸이므로 마크업이 갈라지면 안 된다 (Task 1의 셸 사용)
- **폰트는 8개 토큰만** — `10 · 11 · 13 · 14 · 15 · 17 · 22 · 28px` → `var(--font-2xs)` `var(--font-xs)` `var(--font-sm)` `var(--font-base)` `var(--font-md)` `var(--font-lg)` `var(--font-xl)` `var(--font-2xl)`. `9 · 12 · 16 · 18 · 20px` 금지. raw `font-size:12px` 같은 표기를 새로 쓰지 않는다.
- **`font-weight` 최대 600.** `700` 이상 금지.
- **색상 하드코딩 금지** — `#E31B59` → `var(--color-accent)`, `#f5f5f7` → `var(--color-surface)`, `rgba(0,0,0,.08)` → `var(--color-border)`.
- **이모지 전면 금지.** 받은 시안의 🌅를 제거한다. 문장은 유지하고 이모지만 삭제한다.
- **좌우 패딩** 콘텐츠 28px, 카드 그리드 20px.
- **카드는 무테·무그림자.** 배경 대비로만 elevation.
- **아이콘 스트로크는 1.5로 렌더된다 (의도된 편차).** `common.css`에 전역 규칙 `svg[viewBox="0 0 24 24"] path { stroke-width: 1.5 }`가 있고 CSS는 SVG presentation attribute를 이기므로, 받은 시안의 `stroke-width="1.8"`은 무시된다. 앱 전 화면이 1.5이므로 커뮤니티만 1.8로 올리지 않는다 — **이를 되돌리는 CSS를 추가하지 말 것.** 시안의 `stroke-width="1.8"` 속성은 지우지 않고 그대로 둔다(무해하며 원본 대조에 유용).
- **`common/icons.js`는 사용하지 않는다.** 커뮤니티 본문은 lucide 인라인 SVG, 셸은 tabler 인라인 SVG로 자족한다. 새 파일에 `icons.js` `<script>` 태그를 넣지 않는다.
- **Meteocons 날씨 아이콘은 CDN 유지** — `https://cdn.jsdelivr.net/npm/@meteocons/svg/fill/*.svg`. 기존 목업 11곳이 이미 이 방식이다.
- **`common/common.css`를 수정하지 않는다.** 24개 목업이 의존한다. 필요한 CSS는 각 파일 `<style>`에 둔다.

---

## File Structure

**생성 · 교체 (전부 `src/components/ui/community/`)**

| 파일 | 책임 | 담는 상태 수 |
|---|---|---|
| `community-feed.html` (교체) | 커뮤니티 루트 — 세그먼트 3개 + 콘테스트 서브탭 3개 + 관련 시트·모달 전부 | 16 |
| `contest-result.html` (신규) | 콘테스트 결과 상세 — 풀스크린 목적지 | 1 |
| `community-post.html` (교체) | 게시글 상세 + 액션시트·삭제·신고·토스트 + 라이트박스 2중 레이어 | 9 |
| `community-write.html` (교체) | 새 글 작성 + 위치·촬영정보 시트 | 3 |
| `user-profile.html` (신규) | 다른 유저 프로필 — 탭 3개 | 3 |

**수정**

| 파일 | 내용 |
|---|---|
| `docs/guide/dev/ui-publishing.md` | 파일 목록 · 화면별 설명 · 내비게이션 흐름도 3곳 |

**변환 원본** — `.claude/design/CommunnityUI/phase*/html/`. 읽기만 하고 수정하지 않는다.

### 검증 명령 (모든 Task에서 동일하게 사용)

```bash
cd /Users/yeeun/Desktop/PNG_frontend/src/components/ui/community
for f in community-feed.html contest-result.html community-post.html community-write.html user-profile.html; do
  [ -f "$f" ] || continue
  v=$(grep -Ec 'font-size:[0-9]|dv-card|dv-turn|#[eE]31[bB]59|pretendard.*jsdelivr|width=390|font-weight:[7-9]|icons\.js' "$f")
  e=$(grep -Pc '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' "$f")
  printf "%-24s 규약위반:%-4s 이모지:%s\n" "$f" "$v" "$e"
done
```

**두 수치 모두 모든 파일에서 `0`이어야 한다.** 아직 만들지 않은 파일은 건너뛰므로 Task 1부터 매번 실행할 수 있다.

### 핸들러 배선표

각 Task가 정의하는 함수는 **반드시 아래 요소에 `onclick`으로 배선되어야 한다.** 정의만 하고 호출되지 않는 함수가 남으면 그 상태에 도달할 수 없다.

| 함수 | 배선할 요소 | 파일 | Task |
|---|---|---|---|
| `switchView('posts'\|'gallery'\|'contest', this)` | 세그먼트 버튼 3개 | feed | 1 |
| `goToPost(event, false)` | 남의 글 카드 루트 | feed | 1 |
| `goToPost(event, true)` | 내 글 카드 루트 (3번째 카드) | feed | 1 |
| `openSearch()` | 헤더 검색 아이콘 버튼 | feed | 2 |
| `closeSearch()` | 검색 오버레이 `취소` 버튼 | feed | 2 |
| `switchSubtab('active'\|'mine'\|'past', this)` | 콘테스트 서브탭 버튼 3개 | feed | 3 |
| `openLightbox(rank)` | 출품작 썸네일 (rank 숫자 전달) | feed | 3 |
| `closeLightbox()` | 라이트박스 닫기 버튼 | feed | 3 |
| `requestVote()` | 라이트박스 투표 버튼 | feed | 3 |
| `castVote()` | 투표 확인 모달 `투표하기` 버튼 | feed | 3 |
| `undoVote()` | 투표 취소 모달 `투표 취소` 버튼 | feed | 3 |
| `closeModal('vote-confirm-modal')` | 투표 확인 모달 `취소` 버튼 + backdrop | feed | 3 |
| `closeModal('vote-cancel-modal')` | 투표 취소 모달 `닫기` 버튼 + backdrop | feed | 3 |
| `openSheet('caption-sheet')` | 내 출품 `캡션 수정` 버튼 | feed | 4 |
| `closeSheet('caption-sheet')` | 캡션 시트 저장 버튼 + backdrop | feed | 4 |
| `openModal('withdraw-modal')` | 내 출품 `출품 취소` 버튼 | feed | 4 |
| `withdrawEntry()` | 출품취소 모달 `출품 취소` 버튼 | feed | 4 |
| `closeModal('withdraw-modal')` | 출품취소 모달 `닫기` 버튼 + backdrop | feed | 4 |
| `openSheet('submit-sheet')` | 진행중 `출품하기` 버튼 · 빈 상태 `출품하기` CTA (2곳) | feed | 3·4 |
| `selectSubmitPhoto()` | 출품 시트 `사진 선택` 버튼 | feed | 4 |
| `submitEntry()` | 출품 시트 `출품하기` 버튼 | feed | 4 |
| `closeSheet('submit-sheet')` | 출품 시트 backdrop | feed | 4 |
| `location.href='./contest-result.html'` | 지난 콘테스트 목록 항목 | feed | 5 |
| `location.href='./community-write.html'` | 헤더 `＋` 버튼 | feed | 1 |
| `location.href='./user-profile.html'` | 카드 유저명 | feed | 10 |
| `history.back()` | 뒤로가기 버튼 | result · post · write · profile | 6·7·9·10 |
| `openActionSheet()` | 상세 헤더 `⋯` 버튼 | post | 7 |
| `closeSheet('action-sheet')` | 액션시트 backdrop | post | 7 |
| `openModal('delete-modal')` | 액션시트 `삭제하기` 행 | post | 7 |
| `deletePost()` | 삭제 모달 `삭제` 버튼 | post | 7 |
| `closeModal('delete-modal')` | 삭제 모달 `취소` 버튼 + backdrop | post | 7 |
| `openSheet('report-sheet')` | 액션시트 `신고하기` 행 | post | 7 |
| `submitReport()` | 신고 시트 제출 버튼 | post | 7 |
| `closeSheet('report-sheet')` | 신고 시트 backdrop | post | 7 |
| `openLightbox()` | 히어로 우측 상단 확대 아이콘 (인자 없음) | post | 8 |
| `closeLightbox()` | 라이트박스 닫기 버튼 | post | 8 |
| `openExif()` | 라이트박스 하단 `(i)` 버튼 | post | 8 |
| `closeExif()` | EXIF 패널 닫기 버튼 + EXIF backdrop | post | 8 |
| `openSheet('location-sheet')` | 위치 행 (`#row-location`) | write | 9 |
| `selectLocation(name)` | 위치 시트 목록 항목 각각 | write | 9 |
| `closeSheet('location-sheet')` | 위치 시트 backdrop | write | 9 |
| `openGearSheet('camera')` | 카메라 행 (`#row-camera`) | write | 9 |
| `openGearSheet('lens')` | 렌즈 행 (`#row-lens`) | write | 9 |
| `selectGear(name)` | 촬영정보 시트 목록 항목 각각 | write | 9 |
| `closeSheet('gear-sheet')` | 촬영정보 시트 backdrop | write | 9 |
| `switchProfileTab('posts'\|'contests'\|'spots', this)` | 프로필 탭 버튼 3개 | profile | 10 |
| `toggleFollow(this)` | 프로필 팔로우 버튼 | profile | 10 |

**주의 1** — `openLightbox`는 파일마다 시그니처가 다르다. `community-feed.html`은 `openLightbox(rank)`(랭크 뱃지를 갱신), `community-post.html`은 `openLightbox()`(인자 없음). 두 파일은 독립적이므로 충돌하지 않는다.

**주의 2** — `switchSubtab`(콘테스트)과 `switchProfileTab`(프로필)은 이름이 다르다. 둘 다 `.subtab__btn` 마크업을 쓰지만 서로 다른 파일이고, 프로필 쪽은 `.profile-tabview`를 토글하므로 함수를 재사용하지 않는다.

**주의 3** — 내부 호출 전용 함수는 배선하지 않는다: `renderRemainingVotes()` · `setEntryState(hasEntry)` · `showToast(id)` · `openSheet`/`closeSheet`/`openModal`/`closeModal`의 공통 구현.

---

## Task 1: 공통 셸 확정 + 게시글 세그먼트

이 Task가 이후 모든 파일의 출발점이 되는 셸을 만든다. 셸이 틀리면 5개 파일을 다 고쳐야 하므로 먼저 못 박는다.

**Files:**
- Create: `src/components/ui/community/_shell.reference.html` (임시 참조용 · Task 11에서 삭제)
- Replace: `src/components/ui/community/community-feed.html` (기존 2,600여 줄 전체 덮어쓰기)
- Source: `.claude/design/CommunnityUI/phase1/html/2a-community-feed.html`

**Interfaces:**
- Produces: 이후 Task가 복사해 쓰는 셸 — `<head>` 블록 · `.phone-frame` / `.phone-scroll` CSS · `.status-bar` 마크업+CSS · `.tab-bar` 마크업+CSS
- Produces: `community-feed.html`의 `.segment` 컨트롤과 `switchView(view, el)` 함수 — Task 2·3·4·5가 여기에 뷰를 추가한다

- [ ] **Step 1: 검증 명령을 먼저 실행해 현재 상태를 기록**

```bash
cd /Users/yeeun/Desktop/PNG_frontend/src/components/ui/community
for f in community-feed.html contest-result.html community-post.html community-write.html user-profile.html; do
  [ -f "$f" ] || continue
  v=$(grep -Ec 'font-size:[0-9]|dv-card|dv-turn|#[eE]31[bB]59|pretendard.*jsdelivr|width=390|font-weight:[7-9]|icons\.js' "$f")
  e=$(grep -Pc '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' "$f")
  printf "%-24s 규약위반:%-4s 이모지:%s\n" "$f" "$v" "$e"
done
```

Expected: 기존 3개 파일에서 위반이 **0이 아닌** 수치로 나온다 (교체 대상이므로 정상). 이 값을 기록해 두면 Task 종료 시 0으로 떨어지는 것을 확인할 수 있다.

- [ ] **Step 2: 셸 참조 파일 작성**

`src/components/ui/community/_shell.reference.html`을 만든다. 이후 Task가 복붙할 원본이다.

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <title>PNG - 화면명</title>
    <link rel="stylesheet" href="../common/fonts.css" />
    <link rel="stylesheet" href="../common/common.css" />
    <style>
      /* ── Phone Frame ── */
      .phone-frame {
        width: 100%;
        height: 100dvh;
        background: var(--color-bg);
        position: relative;
        overflow: hidden;
      }
      .phone-scroll {
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        padding-bottom: 80px;
      }

      /* ── Status Bar ── */
      .status-bar {
        position: sticky;
        top: 0;
        z-index: 30;
        height: 54px;
        background: #fff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 34px;
      }
      .status-bar__time {
        font-size: var(--font-md);
        font-weight: 600;
        color: #000;
        letter-spacing: -0.3px;
      }
      .dynamic-island {
        position: absolute;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        width: 106px;
        height: 28px;
        background: #000;
        border-radius: 14px;
      }
      .status-bar__icons {
        display: flex;
        gap: 6px;
      }
      .status-bar__icons svg {
        height: 12px;
        fill: #000;
      }

      /* ── Tab Bar ── */
      .tab-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 80px;
        background: #fff;
        border-top: 0.5px solid var(--color-border);
        display: flex;
        align-items: flex-start;
        justify-content: space-around;
        padding-top: 8px;
        z-index: 50;
      }
    </style>
  </head>
  <body>
    <div class="phone-frame">
      <div class="phone-scroll">
        <!-- Status Bar -->
        <div class="status-bar">
          <span class="status-bar__time">9:41</span>
          <div class="dynamic-island"></div>
          <div class="status-bar__icons">
            <svg viewBox="0 0 18 12">
              <rect x="0" y="9" width="3" height="3" rx=".75" />
              <rect x="4.5" y="6" width="3" height="6" rx=".75" />
              <rect x="9" y="3" width="3" height="9" rx=".75" />
              <rect x="13.5" y="0" width="3" height="12" rx=".75" />
            </svg>
            <svg viewBox="0 0 16 14" fill="none" stroke="#000" stroke-width="1.3" stroke-linecap="round">
              <path d="M5 10.5A4 4 0 0 1 11 10.5" />
              <path d="M2.5 7A8 8 0 0 1 13.5 7" />
              <circle cx="8" cy="13" r="1.2" fill="#000" stroke="none" />
            </svg>
            <svg viewBox="0 0 28 14">
              <rect x="0" y="0" width="25" height="12" rx="3.5" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="1" />
              <rect x="1.5" y="1.5" width="20" height="9" rx="2" fill="#34c759" />
            </svg>
          </div>
        </div>

        <!-- 화면 콘텐츠가 여기에 들어간다 -->
      </div>

      <!-- Tab Bar -->
      <div class="tab-bar">
        <button class="tab" onclick="location.href = '../home/home.html'">
          <svg class="tab__icon" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
            <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
            <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
          </svg>
          <span class="tab__label">홈</span>
        </button>
        <button class="tab" onclick="location.href = '../home/map.html'">
          <svg class="tab__icon" viewBox="0 0 24 24" stroke="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13" /><path d="M9 4v13" /><path d="M15 7v13" /></svg>
          <span class="tab__label">지도</span>
        </button>
        <button class="tab" onclick="location.href = '../travel/travel-list.html'">
          <svg class="tab__icon" viewBox="0 0 24 24" stroke="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M12 19h4.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h3.5" /></svg>
          <span class="tab__label">출사</span>
        </button>
        <button class="tab is-active">
          <svg class="tab__icon" viewBox="0 0 24 24" stroke="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12"/><path d="M9.5 9h.01"/><path d="M14.5 9h.01"/><path d="M9.5 13a3.5 3.5 0 0 0 5 0"/></svg>
          <span class="tab__label">커뮤니티</span>
        </button>
        <button class="tab" onclick="location.href = '../mypage/mypage.html'">
          <svg class="tab__icon" viewBox="0 0 24 24" stroke="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /></svg>
          <span class="tab__label">MY</span>
        </button>
        <div class="tab-bar__indicator"></div>
      </div>
    </div>
  </body>
</html>
```

`.tab` / `.tab__icon` / `.tab__label` / `.tab-bar__indicator` / `.phone-frame`의 기본형은 `common.css`가 제공한다. 위 `<style>`은 페이지별로 달라지는 부분만 재정의한다.

- [ ] **Step 3: 콜랩스 헤더 CSS를 셸에 추가**

`_shell.reference.html`의 `<style>` 안, `.status-bar` 블록 뒤에 추가한다. `community-feed.html`과 `user-profile.html`만 쓰지만 셸에 두면 복사가 단순해진다.

```css
      /* ── Page Nav (콜랩스 헤더) ── */
      .page-nav {
        position: sticky;
        top: 54px;
        z-index: 25;
        background: #fff;
      }
      .page-nav__compact {
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 28px;
      }
      .page-nav__compact-title {
        font-size: var(--font-lg);
        font-weight: 600;
        letter-spacing: -0.4px;
        opacity: 0;
        transition: opacity 0.2s;
      }
      .page-nav.is-scrolled .page-nav__compact-title { opacity: 1; }
      .page-nav__large {
        padding: 6px 28px 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        overflow: hidden;
        max-height: 60px;
        opacity: 1;
        transition: max-height 0.25s ease, padding 0.25s ease, opacity 0.2s;
      }
      .page-nav.is-scrolled .page-nav__large {
        max-height: 0;
        padding-top: 0;
        padding-bottom: 0;
        opacity: 0;
      }
      .page-nav__large-title {
        font-size: var(--font-2xl);
        font-weight: 600;
        letter-spacing: -1.2px;
        flex: 1;
      }
      .page-nav__icon-btn {
        width: 38px;
        height: 38px;
        border: none;
        border-radius: 19px;
        background: var(--color-surface);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
      }
      .page-nav__icon-btn--accent { background: var(--color-accent); }
      .page-nav__icon-btn--accent svg { stroke: #fff; }
```

받은 시안의 헤더 좌우 패딩은 28px이다. 기존 목업의 `var(--space-md)`(16px)를 계승하지 않고 시안대로 28px을 쓴다 — 브리프의 콘텐츠 패딩 규칙과도 일치한다.

- [ ] **Step 4: 반복 컴포넌트 CSS를 셸에 추가**

파일 내 2회 이상 반복되는 것만 클래스로 뽑는다. `_shell.reference.html`의 `<style>` 끝에 추가한다.

```css
      /* ── Segment Control (게시글 / 갤러리 / 콘테스트) ── */
      .segment {
        flex: 1;
        display: flex;
        background: var(--color-surface);
        border-radius: 22px;
        padding: 3px;
        height: 36px;
      }
      .segment__btn {
        flex: 1;
        height: 30px;
        border: none;
        border-radius: 15px;
        background: none;
        font-family: var(--font-family);
        font-size: var(--font-sm);
        font-weight: 500;
        letter-spacing: -0.2px;
        color: rgba(0, 0, 0, 0.45);
        cursor: pointer;
      }
      .segment__btn.is-active {
        background: #000;
        color: #fff;
        font-weight: 600;
      }

      /* ── Sub Tab (언더라인) ── */
      .subtab {
        display: flex;
        gap: 20px;
        padding: 0 28px;
        border-bottom: 1px solid var(--color-border);
      }
      .subtab__btn {
        padding: 10px 0;
        border: none;
        background: none;
        font-family: var(--font-family);
        font-size: var(--font-sm);
        font-weight: 500;
        letter-spacing: -0.2px;
        color: rgba(0, 0, 0, 0.4);
        cursor: pointer;
      }
      .subtab__btn.is-active {
        color: #000;
        font-weight: 600;
        border-bottom: 2px solid var(--color-accent);
        margin-bottom: -1px;
      }

      /* ── Chip ── */
      .chip {
        height: 30px;
        padding: 0 13px;
        border: none;
        border-radius: 15px;
        background: var(--color-surface);
        font-family: var(--font-family);
        font-size: var(--font-sm);
        font-weight: 500;
        letter-spacing: -0.2px;
        color: rgba(0, 0, 0, 0.55);
        cursor: pointer;
        flex-shrink: 0;
      }
      .chip.is-active {
        background: #000;
        color: #fff;
        font-weight: 600;
      }

      /* ── Bottom Sheet ── */
      .sheet-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 60;
        display: none;
      }
      .sheet-backdrop.is-open { display: block; }
      .sheet {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: #fff;
        border-radius: 24px 24px 0 0;
        padding: 8px 28px 32px;
      }
      .sheet__handle {
        width: 36px;
        height: 4px;
        border-radius: 2px;
        background: rgba(0, 0, 0, 0.15);
        margin: 0 auto 16px;
      }
      .sheet__title {
        font-size: var(--font-lg);
        font-weight: 600;
        letter-spacing: -0.4px;
        margin-bottom: 16px;
      }
      .sheet__row {
        display: flex;
        align-items: center;
        gap: 12px;
        height: 52px;
        border: none;
        background: none;
        width: 100%;
        font-family: var(--font-family);
        font-size: var(--font-md);
        letter-spacing: -0.2px;
        color: #000;
        cursor: pointer;
        text-align: left;
      }
      .sheet__row--danger { color: var(--color-accent); }

      /* ── Modal ── */
      .modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 70;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 0 40px;
      }
      .modal-backdrop.is-open { display: flex; }
      .modal {
        width: 100%;
        background: #fff;
        border-radius: 20px;
        padding: 24px 20px 16px;
        text-align: center;
      }
      .modal__title {
        font-size: var(--font-md);
        font-weight: 600;
        letter-spacing: -0.3px;
        margin-bottom: 6px;
      }
      .modal__body {
        font-size: var(--font-sm);
        color: rgba(0, 0, 0, 0.5);
        letter-spacing: -0.2px;
        line-height: 1.5;
        margin-bottom: 20px;
      }
      .modal__actions { display: flex; gap: 8px; }
      .modal__btn {
        flex: 1;
        height: 44px;
        border: none;
        border-radius: 22px;
        font-family: var(--font-family);
        font-size: var(--font-sm);
        font-weight: 600;
        letter-spacing: -0.2px;
        cursor: pointer;
      }
      .modal__btn--cancel { background: var(--color-surface); color: rgba(0, 0, 0, 0.55); }
      .modal__btn--confirm { background: var(--color-accent); color: #fff; }

      /* ── Toast ── */
      .toast {
        position: absolute;
        left: 28px;
        right: 28px;
        bottom: 100px;
        z-index: 80;
        height: 48px;
        border-radius: 24px;
        background: rgba(0, 0, 0, 0.85);
        display: none;
        align-items: center;
        gap: 8px;
        padding: 0 18px;
        color: #fff;
        font-size: var(--font-base);
        letter-spacing: -0.2px;
      }
      .toast.is-open { display: flex; }

      /* ── Score Badge (포토제닉) ── */
      .score-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        height: 26px;
        padding: 0 10px;
        border-radius: 13px;
        background: rgba(227, 27, 89, 0.08);
      }
      .score-badge__label {
        font-size: var(--font-2xs);
        color: rgba(0, 0, 0, 0.5);
        letter-spacing: 0.5px;
        font-weight: 600;
      }
      .score-badge__value {
        font-size: var(--font-sm);
        color: var(--color-accent);
        font-weight: 600;
      }

      /* ── Rank Badge (콘테스트 순위) ── */
      .rank-badge {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f0c89a, #d4856a);
        color: #fff;
        font-size: var(--font-sm);
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* ── Avatar ── */
      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.85);
        font-size: var(--font-2xs);
        font-weight: 600;
        flex-shrink: 0;
      }
```

`.score-badge`의 `rgba(227,27,89,.08)`은 accent의 알파 변형이라 `var(--color-accent)`로 치환할 수 없다. 검증 정규식이 `#e31b59` 리터럴만 잡으므로 이 형태는 통과한다.

- [ ] **Step 5: `community-feed.html`을 셸로 새로 만들고 게시글 세그먼트 이식**

`_shell.reference.html`을 `community-feed.html`로 복사한 뒤:

1. `<title>`을 `PNG - 커뮤니티`로
2. 상태바 뒤에 콜랩스 헤더를 넣는다 — `.page-nav__compact`(제목 `커뮤니티`) + `.page-nav__large`(제목 + 검색 아이콘 버튼 + 새 글 버튼) + 세그먼트 행
3. 새 글 버튼은 `onclick="location.href='./community-write.html'"`, lucide `Plus` 인라인 SVG, `.page-nav__icon-btn--accent`
4. 검색 버튼은 lucide `Search`, `onclick="openSearch()"`
5. `.claude/design/CommunnityUI/phase1/html/2a-community-feed.html`의 카드 2개 마크업을 옮긴다. 카드 반복 구조는 `.post-card` 계열 클래스로 뽑고(아래) 카드별로 다른 값(사진 그라디언트·유저·캡션·수치)만 인라인으로 남긴다
6. 카드 3번째를 하나 더 추가하고 그 카드를 **내 글**로 만든다 (`⋯` 클릭 시 내글 액션시트 확인용, `community-post.html?mine=1`로 이동)
7. 원본의 인라인 상태바·탭바 마크업은 쓰지 않는다 (셸 것을 쓴다)
8. 캡션 `새벽 5시에 일어난 보람이 있는 일출 🌅` → `새벽 5시에 일어난 보람이 있는 일출`

`.post-card` CSS를 `<style>`에 추가한다.

```css
      /* ── Post Card ── */
      .post-card {
        border-radius: 20px;
        background: var(--color-surface);
        overflow: hidden;
        cursor: pointer;
      }
      .post-card__media {
        position: relative;
        height: 230px;
      }
      .post-card__pin,
      .post-card__like {
        position: absolute;
        bottom: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
        height: 28px;
        padding: 0 11px;
        border: none;
        border-radius: 14px;
        background: rgba(0, 0, 0, 0.35);
        color: #fff;
        font-family: var(--font-family);
        font-size: var(--font-xs);
        font-weight: 500;
      }
      .post-card__pin { left: 12px; }
      .post-card__like { right: 12px; font-weight: 600; cursor: pointer; }
      .post-card__body { padding: 14px 16px 4px; }
      .post-card__user-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
      }
      .post-card__username {
        font-size: var(--font-base);
        font-weight: 600;
        letter-spacing: -0.2px;
      }
      .post-card__meta {
        font-size: var(--font-xs);
        color: rgba(0, 0, 0, 0.35);
        margin-top: 1px;
      }
      .post-card__follow {
        height: 30px;
        padding: 0 12px;
        border: none;
        border-radius: 15px;
        background: rgba(227, 27, 89, 0.08);
        color: var(--color-accent);
        font-family: var(--font-family);
        font-size: var(--font-sm);
        font-weight: 600;
        letter-spacing: -0.2px;
        cursor: pointer;
      }
      .post-card__follow.is-following {
        background: #efeeed;
        color: rgba(0, 0, 0, 0.55);
      }
      .post-card__caption {
        font-size: var(--font-md);
        font-weight: 500;
        letter-spacing: -0.2px;
        line-height: 1.5;
        color: #000;
        margin-bottom: 12px;
      }
      .post-card__shot-info {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: #fff;
        border-radius: 12px;
        margin-bottom: 12px;
      }
      .post-card__shot-info span {
        font-size: var(--font-xs);
        color: rgba(0, 0, 0, 0.6);
        letter-spacing: -0.15px;
      }
      .post-card__dot {
        width: 2px;
        height: 2px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.15);
        flex-shrink: 0;
      }
      .post-card__footer {
        display: flex;
        align-items: center;
        padding: 8px 16px 14px;
        gap: 16px;
      }
      .post-card__action {
        display: flex;
        align-items: center;
        gap: 4px;
        border: none;
        background: none;
        color: rgba(0, 0, 0, 0.55);
        font-family: var(--font-family);
        font-size: var(--font-sm);
        cursor: pointer;
      }
      .post-card__action.is-active { color: var(--color-accent); }

      /* ── 뷰 전환 ── */
      .view { display: none; }
      .view.is-active { display: block; }
```

- [ ] **Step 6: 세그먼트 전환 + 콜랩스 헤더 JS 작성**

`</body>` 직전에 넣는다.

```html
    <script>
      /* ── 콜랩스 헤더 ── */
      const frame = document.querySelector('.phone-scroll');
      const nav = document.getElementById('page-nav');
      frame.addEventListener('scroll', () => {
        nav.classList.toggle('is-scrolled', frame.scrollTop > 44);
      });

      /* ── 세그먼트 전환 (게시글 / 갤러리 / 콘테스트) ── */
      function switchView(view, el) {
        document.querySelectorAll('.view').forEach((v) => {
          v.classList.toggle('is-active', v.dataset.view === view);
        });
        el.parentElement.querySelectorAll('.segment__btn').forEach((b) => {
          b.classList.toggle('is-active', b === el);
        });
      }

      /* ── 게시글 카드 → 상세 이동 (내부 버튼 클릭은 제외) ── */
      function goToPost(e, mine) {
        if (e.target.closest('button')) return;
        location.href = mine ? './community-post.html?mine=1' : './community-post.html';
      }
    </script>
```

세그먼트 버튼은 `onclick="switchView('posts', this)"` / `'gallery'` / `'contest'`, 뷰 컨테이너는 `<div class="view is-active" data-view="posts">` 형태로 붙인다. 기존 파일의 `'recipe'` 인자는 계승하지 않는다 — 실제 라벨이 `게시글`이다.

- [ ] **Step 7: 브라우저에서 확인**

브라우저로 `src/components/ui/community/community-feed.html`을 열고 DevTools 뷰포트를 **390px**로 맞춘다.

확인 항목:
- 상태바·탭바가 다른 목업(`../home/home.html`)과 시각적으로 동일한지
- 스크롤 시 큰 타이틀이 접히고 컴팩트 타이틀이 나타나는지
- 세그먼트 3개 클릭 시 활성 표시가 옮겨가는지 (갤러리·콘테스트 뷰는 아직 비어 있어도 정상)
- 탭바 `커뮤니티`가 accent 색으로 활성인지
- 카드가 무테·무그림자인지

- [ ] **Step 8: 검증 명령 실행**

```bash
cd /Users/yeeun/Desktop/PNG_frontend/src/components/ui/community
for f in community-feed.html contest-result.html community-post.html community-write.html user-profile.html; do
  [ -f "$f" ] || continue
  v=$(grep -Ec 'font-size:[0-9]|dv-card|dv-turn|#[eE]31[bB]59|pretendard.*jsdelivr|width=390|font-weight:[7-9]|icons\.js' "$f")
  e=$(grep -Pc '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' "$f")
  printf "%-24s 규약위반:%-4s 이모지:%s\n" "$f" "$v" "$e"
done
```

Expected: `community-feed.html 규약위반:0 이모지:0`. 아직 교체하지 않은 `community-post.html`·`community-write.html`은 0이 아니어도 정상이다.

- [ ] **Step 9: 커밋**

```bash
cd /Users/yeeun/Desktop/PNG_frontend
git add src/components/ui/community/_shell.reference.html src/components/ui/community/community-feed.html
git commit -m "feat(community): 커뮤니티 목업 공통 셸 및 게시글 세그먼트 신규 작성"
```

---

## Task 2: 검색 오버레이 + 갤러리 세그먼트

**Files:**
- Modify: `src/components/ui/community/community-feed.html`
- Source: `.claude/design/CommunnityUI/phase1/html/2a-community-feed-search.html`, `.claude/design/CommunnityUI/phase2/html/2f-gallery.html`

**Interfaces:**
- Consumes: Task 1의 `.page-nav` 구조 · `.chip` CSS · `switchView(view, el)` · `.view` 컨테이너 패턴
- Produces: `openSearch()` / `closeSearch()` — 다른 Task에서 쓰지 않음 (이 파일 국소)

- [ ] **Step 1: 검색 오버레이 마크업 추가**

`2a-community-feed-search.html`의 body에서 검색 상태 블록을 가져온다. 콜랩스 헤더 전체를 덮는 오버레이로 만든다.

원본 대비 적용할 변환:
- `font-size:14px` → `var(--font-base)` (검색 입력·`취소` 버튼)
- `font-size:12px` → `var(--font-sm)` — `모두 지우기` 링크
- `font-size:11px` → `var(--font-xs)` — `최근 검색` 라벨
- `font-size:13px` → `var(--font-sm)` — 대상 chips
- `#E31B59` → `var(--color-accent)`
- `background:#f5f5f7` → `var(--color-surface)`
- 대상 chips 5개(`전체`·`게시글`·`사진`·`스팟`·`사용자`)는 Task 1의 `.chip` / `.chip.is-active` 클래스 사용
- 원본의 `class="no-sb"`는 삭제 — `common.css`가 전역으로 스크롤바를 숨긴다

`<style>`에 추가한다.

```css
      /* ── 검색 오버레이 ── */
      .search-overlay {
        position: absolute;
        top: 54px;
        left: 0;
        right: 0;
        bottom: 0;
        background: #fff;
        z-index: 40;
        display: none;
        overflow-y: auto;
      }
      .search-overlay.is-open { display: block; }
      .search-overlay__row {
        padding: 6px 20px 12px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .search-overlay__input {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 10px;
        height: 40px;
        padding: 0 14px;
        border-radius: 20px;
        background: var(--color-surface);
        font-size: var(--font-base);
        color: #000;
        letter-spacing: -0.2px;
      }
      .search-overlay__cancel {
        border: none;
        background: none;
        font-family: var(--font-family);
        font-size: var(--font-base);
        color: var(--color-accent);
        font-weight: 600;
        letter-spacing: -0.2px;
        padding: 6px 0;
        cursor: pointer;
      }
      .search-overlay__chips {
        padding: 0 20px 14px;
        display: flex;
        gap: 6px;
        overflow-x: auto;
      }
      .search-overlay__section {
        padding: 8px 28px 4px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .search-overlay__section-label {
        font-size: var(--font-xs);
        font-weight: 600;
        color: rgba(0, 0, 0, 0.4);
        letter-spacing: 0.4px;
      }
      .search-overlay__clear {
        border: none;
        background: none;
        font-family: var(--font-family);
        font-size: var(--font-sm);
        color: rgba(0, 0, 0, 0.4);
        cursor: pointer;
      }
```

- [ ] **Step 2: 검색 열기/닫기 JS 추가**

Task 1의 `<script>` 블록에 이어 붙인다.

```javascript
      /* ── 검색 오버레이 ── */
      function openSearch() {
        document.getElementById('search-overlay').classList.add('is-open');
      }
      function closeSearch() {
        document.getElementById('search-overlay').classList.remove('is-open');
      }
```

- [ ] **Step 3: 갤러리 세그먼트 마크업 추가**

`2f-gallery.html`의 갤러리 그리드를 `<div class="view" data-view="gallery">`로 감싸 넣는다. 정렬 드롭다운(`인기 ▾`)은 세그먼트 행 우측에 붙는다.

원본 대비 적용할 변환:
- 3-col 그리드 + 2×2 하이라이트는 CSS `grid` + `grid-column/row: span 2`로 그대로 표현한다
- `font-size:11px` → `var(--font-xs)`, `font-size:13px` → `var(--font-sm)`
- `#E31B59` → `var(--color-accent)`
- `class="no-sb"` 삭제

```css
      /* ── Gallery Grid ── */
      .gallery-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-auto-flow: row dense; /* 원본 2f 74행 — 없으면 2×2 셀 앞에 빈 칸이 생긴다 */
        gap: 3px;
        padding: 0 20px 20px;
      }
      .gallery-grid__cell {
        position: relative;
        aspect-ratio: 1;
        overflow: hidden;
        cursor: pointer;
      }
      .gallery-grid__cell--wide {
        grid-column: span 2;
        grid-row: span 2;
      }
```

- [ ] **Step 4: 브라우저에서 확인**

`community-feed.html`을 390px로 열고:
- 검색 아이콘 클릭 → 오버레이가 헤더를 덮고 chips·최근 검색이 보이는지
- `취소` 클릭 → 오버레이가 닫히고 피드로 복귀하는지
- 세그먼트 `갤러리` 클릭 → 3-col 그리드가 나오고 2×2 하이라이트 셀이 두 칸을 차지하는지
- 세그먼트 `게시글`로 되돌아오는지

- [ ] **Step 5: 검증 명령 실행**

```bash
cd /Users/yeeun/Desktop/PNG_frontend/src/components/ui/community
for f in community-feed.html contest-result.html community-post.html community-write.html user-profile.html; do
  [ -f "$f" ] || continue
  v=$(grep -Ec 'font-size:[0-9]|dv-card|dv-turn|#[eE]31[bB]59|pretendard.*jsdelivr|width=390|font-weight:[7-9]|icons\.js' "$f")
  e=$(grep -Pc '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' "$f")
  printf "%-24s 규약위반:%-4s 이모지:%s\n" "$f" "$v" "$e"
done
```

Expected: `community-feed.html 규약위반:0 이모지:0`

- [ ] **Step 6: 커밋**

```bash
cd /Users/yeeun/Desktop/PNG_frontend
git add src/components/ui/community/community-feed.html
git commit -m "feat(community): 피드 검색 오버레이 및 갤러리 세그먼트 추가"
```

---

## Task 3: 콘테스트 진행중 + 투표 모달 + 라이트박스

**Files:**
- Modify: `src/components/ui/community/community-feed.html`
- Source: `.claude/design/CommunnityUI/phase3/html/2g-contest-active.html`, `2k-contest-lightbox.html`, `2k-voted.html`, `vote-confirm.html`, `vote-cancel.html`, `vote-snackbar.html`

**Interfaces:**
- Consumes: Task 1의 `.subtab` · `.modal*` · `.rank-badge` CSS · `switchView` · `.view` 패턴
- Produces: `switchSubtab(tab, el)` — Task 4·5가 `내 출품`·`지난` 뷰를 여기에 추가한다
- Produces: `openLightbox(rank)` / `closeLightbox()` / `castVote()` / `undoVote()`

- [ ] **Step 1: 콘테스트 뷰 셸 + 서브탭 마크업 추가**

`<div class="view" data-view="contest">`를 만들고 그 안에 `.subtab`(`진행중`·`내 출품`·`지난`) + 서브뷰 3개 컨테이너를 넣는다.

```html
<div class="view" data-view="contest">
  <div class="subtab">
    <button class="subtab__btn is-active" onclick="switchSubtab('active', this)">진행중</button>
    <button class="subtab__btn" onclick="switchSubtab('mine', this)">내 출품</button>
    <button class="subtab__btn" onclick="switchSubtab('past', this)">지난</button>
  </div>
  <div class="subview is-active" data-subview="active"><!-- Task 3 --></div>
  <div class="subview" data-subview="mine"><!-- Task 4 --></div>
  <div class="subview" data-subview="past"><!-- Task 5 --></div>
</div>
```

```css
      .subview { display: none; }
      .subview.is-active { display: block; }
```

- [ ] **Step 2: 진행중 서브뷰 이식**

`2g-contest-active.html`에서 히어로 배너(186px) + 포디움 순위 + 투표 CTA + 전체 출품작 그리드를 가져온다.

원본 대비 적용할 변환:
- 히어로 그라디언트 `linear-gradient(135deg,#1a1530 0%,#2d1b4e 25%,#8b4a6b 55%,#d4856a 80%,#f0c89a 100%)` 유지
- `WEEKLY` 배지 `font-size:10px` → `var(--font-2xs)` · `letter-spacing:1px` 유지 (스페이스드 캡스는 양수 자간 허용)
- 제목 `골든아워` `font-size:28px` → `var(--font-2xl)`
- 설명 `font-size:13px` → `var(--font-sm)`
- `D-3` · `128명 참여` `font-size:11px` → `var(--font-xs)`
- `출품하기` 버튼 `font-size:13px` → `var(--font-sm)`, `onclick="openSheet('submit-sheet')"`
  - **Task 4까지는 이 버튼이 동작하지 않는다** — `#submit-sheet`가 아직 없어 `openSheet`가 null에서 터진다. Task 3의 브라우저 확인 항목에 포함하지 않으며, Task 4 완료 시 함께 검증한다
- 26px 원형 랭크 뱃지 `font-size:12px` → Task 1의 `.rank-badge` 클래스 (13px)
- 출품작 썸네일 `onclick="openLightbox(1)"`
- `#E31B59` → `var(--color-accent)`

- [ ] **Step 3: 라이트박스 마크업 추가 (투표 전 / 투표됨 2상태)**

`2k-contest-lightbox.html`(투표 전) + `2k-voted.html`(투표됨)을 한 오버레이로 합치고 `is-voted` 클래스로 분기한다.

원본 대비 적용할 변환:
- `67표` / `42표` `font-size:12px` → `var(--font-sm)`
- 랭크 뱃지 `font-size:12px` → `.rank-badge`
- 투표 버튼은 lucide `ThumbsUp`, 투표됨 상태에서 `fill="currentColor"` + accent 색

```css
      /* ── Contest Lightbox ── */
      .lightbox {
        position: absolute;
        inset: 0;
        background: #000;
        /* 65 — 모달(70) 아래여야 한다. 투표 확인 모달이 라이트박스에서 열리므로
           90이면 모달이 라이트박스 뒤에 깔려 도달 불가. 탭바(50)는 여전히 덮는다 */
        z-index: 65;
        display: none;
        flex-direction: column;
        justify-content: center; /* 원본 2k 38행 — 없으면 카드가 노치 아래 상단에 붙는다 */
        padding: 0 20px;
      }
      .lightbox.is-open { display: flex; }
      .lightbox__close {
        position: absolute;
        top: 60px;
        right: 20px;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 2;
      }
      .lightbox__vote {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 44px;
        padding: 0 20px;
        border: none;
        border-radius: 22px;
        /* 원본대로 — 투표 전이 accent solid `투표하기`,
           투표됨이 accent outline `투표 취소` (2k:76 / 2k-voted:68). 반대가 아니다 */
        background: var(--color-accent);
        color: #fff;
        font-family: var(--font-family);
        font-size: var(--font-sm);
        font-weight: 600;
        letter-spacing: -0.2px;
        cursor: pointer;
      }
      .lightbox.is-voted .lightbox__vote {
        background: rgba(255, 255, 255, 0.1);
        color: var(--color-accent);
        box-shadow: inset 0 0 0 1.5px var(--color-accent);
      }
```

- [ ] **Step 4: 투표 확인·취소 모달 + undo 스낵바 마크업 추가**

`vote-confirm.html` · `vote-cancel.html`은 Task 1의 `.modal-backdrop` / `.modal` 구조로 하나씩 만든다 (문구만 다름). `vote-snackbar.html`은 `.toast` 클래스를 재사용하고 우측에 `되돌리기` 버튼을 붙인다.

- 확인 모달 문구: 제목 `이 사진에 투표할까요?` · 본문 `남은 표 3개 중 1개를 사용합니다` · 버튼 `취소` / `투표하기`
- 취소 모달 문구: 제목 `투표를 취소할까요?` · 본문 `사용한 표 1개가 복구됩니다` · 버튼 `닫기` / `투표 취소`
- destructive 버튼도 accent solid로 통일 (phase3 README 지시)

- [ ] **Step 5: 콘테스트 JS 추가**

기존 `<script>` 블록에 이어 붙인다.

```javascript
      /* ── 콘테스트 서브탭 ── */
      function switchSubtab(tab, el) {
        document.querySelectorAll('.subview').forEach((v) => {
          v.classList.toggle('is-active', v.dataset.subview === tab);
        });
        el.parentElement.querySelectorAll('.subtab__btn').forEach((b) => {
          b.classList.toggle('is-active', b === el);
        });
      }

      /* ── 라이트박스 ── */
      function openLightbox(rank) {
        const lb = document.getElementById('contest-lightbox');
        lb.querySelector('.rank-badge').textContent = rank;
        lb.classList.add('is-open');
      }
      function closeLightbox() {
        document.getElementById('contest-lightbox').classList.remove('is-open');
      }

      /* ── 투표 ── */
      let remainingVotes = 3;

      function requestVote() {
        const voted = document.getElementById('contest-lightbox').classList.contains('is-voted');
        openModal(voted ? 'vote-cancel-modal' : 'vote-confirm-modal');
      }
      function castVote() {
        closeModal('vote-confirm-modal');
        document.getElementById('contest-lightbox').classList.add('is-voted');
        remainingVotes -= 1;
        renderRemainingVotes();
        showToast('vote-toast');
      }
      function undoVote() {
        closeModal('vote-cancel-modal');
        document.getElementById('contest-lightbox').classList.remove('is-voted');
        remainingVotes += 1;
        renderRemainingVotes();
      }
      function renderRemainingVotes() {
        document.querySelectorAll('.vote-remain__dot').forEach((dot, i) => {
          dot.classList.toggle('is-used', i >= remainingVotes);
        });
      }

      /* ── 시트 · 모달 · 토스트 공통 ── */
      function openSheet(id) {
        document.getElementById(id).classList.add('is-open');
      }
      function closeSheet(id) {
        document.getElementById(id).classList.remove('is-open');
      }
      function openModal(id) {
        document.getElementById(id).classList.add('is-open');
      }
      function closeModal(id) {
        document.getElementById(id).classList.remove('is-open');
      }
      function showToast(id) {
        const t = document.getElementById(id);
        t.classList.add('is-open');
        setTimeout(() => t.classList.remove('is-open'), 2600);
      }
```

남은 표 점 3개에 대응하는 CSS를 추가한다.

```css
      .vote-remain { display: flex; gap: 4px; }
      .vote-remain__dot {
        width: 6px;
        height: 6px;
        border-radius: 3px;
        background: var(--color-accent);
      }
      .vote-remain__dot.is-used { background: rgba(0, 0, 0, 0.12); }
```

- [ ] **Step 6: 브라우저에서 확인**

`community-feed.html`을 390px로 열고 세그먼트 `콘테스트`로 이동:
- 히어로 배너 그라디언트가 골든아워 색으로 나오는지 (`#1a1530`에서 `#f0c89a`로)
- 서브탭 `진행중` 활성 · 언더라인이 accent인지
- 출품작 썸네일 클릭 → 라이트박스가 열리는지
- 라이트박스 투표 버튼 → 확인 모달 → `투표하기` → 버튼이 accent solid에서 accent outline `투표 취소`로 바뀌고 스낵바가 뜨고 남은 표 점이 하나 줄어드는지
- 투표된 상태에서 투표 버튼 재클릭 → 취소 모달 → `투표 취소` → 원상복구되는지
- 스낵바가 2.6초 후 사라지는지

- [ ] **Step 7: 검증 명령 실행**

```bash
cd /Users/yeeun/Desktop/PNG_frontend/src/components/ui/community
for f in community-feed.html contest-result.html community-post.html community-write.html user-profile.html; do
  [ -f "$f" ] || continue
  v=$(grep -Ec 'font-size:[0-9]|dv-card|dv-turn|#[eE]31[bB]59|pretendard.*jsdelivr|width=390|font-weight:[7-9]|icons\.js' "$f")
  e=$(grep -Pc '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' "$f")
  printf "%-24s 규약위반:%-4s 이모지:%s\n" "$f" "$v" "$e"
done
```

Expected: `community-feed.html 규약위반:0 이모지:0`

- [ ] **Step 8: 커밋**

```bash
cd /Users/yeeun/Desktop/PNG_frontend
git add src/components/ui/community/community-feed.html
git commit -m "feat(community): 콘테스트 진행중 서브탭·라이트박스·투표 모달 추가"
```

---

## Task 4: 콘테스트 내 출품 + 빈 상태 + 캡션·출품취소·출품 시트

**Files:**
- Modify: `src/components/ui/community/community-feed.html`
- Source: `.claude/design/CommunnityUI/phase3/html/2h-my-entry.html`, `2h-empty.html`, `2h-caption-sheet.html`, `2h-withdraw.html`, `2j-submit-sheet.html`, `2j-submit-empty.html`

**Interfaces:**
- Consumes: Task 1의 `.sheet*` · `.modal*` CSS · Task 3의 `switchSubtab` · `openSheet`/`closeSheet`/`openModal`/`closeModal`
- Produces: `?empty=1` 쿼리 처리 로직

- [ ] **Step 1: 내 출품 서브뷰 이식 (데이터 있음)**

`2h-my-entry.html`에서 컴팩트 배너(120px) + 내 출품작 카드 + 캡션 수정/출품 취소 버튼을 `<div class="subview" data-subview="mine">`에 넣는다.

원본 대비 적용할 변환:
- 컴팩트 배너 제목 `골든아워` `font-size:18px` → `var(--font-lg)`
- 배너 그라디언트는 진행중과 동일, 높이만 120px · radius 16px
- `#E31B59` → `var(--color-accent)`
- `캡션 수정` → `onclick="openSheet('caption-sheet')"`
- `출품 취소` → `onclick="openModal('withdraw-modal')"`

- [ ] **Step 2: 내 출품 빈 상태 이식**

`2h-empty.html`의 빈 상태 블록을 같은 서브뷰 안에 두고 `.is-empty` 토글로 분기한다.

- 배너 제목 `골든아워` `font-size:18px` → `var(--font-lg)`
- 안내 문구 + `출품하기` CTA (`onclick="openSheet('submit-sheet')"`)

```css
      .entry-state--has,
      .entry-state--empty { display: none; }
      .entry-state--has.is-active,
      .entry-state--empty.is-active { display: block; }
```

- [ ] **Step 3: 캡션 수정 시트 이식**

`2h-caption-sheet.html`을 Task 1의 `.sheet-backdrop` / `.sheet` 구조로 넣는다. `id="caption-sheet"`.

- 제목 `캡션 수정` → `.sheet__title`
- textarea + 글자수 카운터 `font-size:11px` → `var(--font-xs)`
- 저장 버튼 높이 52px · `border-radius: 26px` · accent solid

- [ ] **Step 4: 출품 취소 확인 모달 이식**

`2h-withdraw.html`을 `.modal-backdrop` / `.modal`로 넣는다. `id="withdraw-modal"`.

- 제목 `출품을 취소할까요?` · 본문 `받은 투표도 함께 사라집니다` · 버튼 `닫기` / `출품 취소`
- 확정 시 `withdrawEntry()` 호출 → 빈 상태로 전환

- [ ] **Step 5: 출품하기 시트 이식 (사진 선택 / 미선택 2상태)**

`2j-submit-sheet.html`(선택됨) + `2j-submit-empty.html`(미선택)을 한 시트로 합친다. `id="submit-sheet"`. 시트를 열면 **미선택이 초기 상태**다.

원본 대비 적용할 변환:
- 사진 영역 오버레이 버튼 `font-size:12px` → `var(--font-sm)`
- 미선택 상태의 사진 자리 플레이스홀더 + `사진 선택` 버튼 → `onclick="selectSubmitPhoto()"`
- 선택 후 캡션 입력 + `출품하기` 버튼 활성

- [ ] **Step 6: 내 출품 JS 추가**

```javascript
      /* ── 내 출품 상태 ── */
      function setEntryState(hasEntry) {
        document.querySelector('.entry-state--has').classList.toggle('is-active', hasEntry);
        document.querySelector('.entry-state--empty').classList.toggle('is-active', !hasEntry);
      }
      function withdrawEntry() {
        closeModal('withdraw-modal');
        setEntryState(false);
      }

      /* ── 출품 시트 사진 선택 ── */
      function selectSubmitPhoto() {
        document.getElementById('submit-sheet').classList.add('has-photo');
      }
      function submitEntry() {
        closeSheet('submit-sheet');
        document.getElementById('submit-sheet').classList.remove('has-photo');
        setEntryState(true);
      }

      /* ── ?empty=1 로 빈 상태 진입 ── */
      setEntryState(new URLSearchParams(location.search).get('empty') !== '1');
```

```css
      #submit-sheet .submit-photo--empty { display: block; }
      #submit-sheet .submit-photo--picked { display: none; }
      #submit-sheet.has-photo .submit-photo--empty { display: none; }
      #submit-sheet.has-photo .submit-photo--picked { display: block; }
```

- [ ] **Step 7: 브라우저에서 확인**

`community-feed.html`을 390px로 열고 콘테스트 → `내 출품`:
- 기본은 출품작이 있는 상태로 보이는지
- `캡션 수정` → 시트가 올라오고 textarea에 기존 캡션이 있는지
- `출품 취소` → 모달 → 확정 시 빈 상태로 바뀌는지
- 빈 상태의 `출품하기` → 시트가 **미선택 상태**로 열리는지
- `사진 선택` → 캡션 입력이 나타나고 `출품하기`가 활성되는지 → 확정 시 출품작 있는 상태로 복귀하는지

그리고 `community-feed.html?empty=1`로 열어 콘테스트 → `내 출품`이 처음부터 빈 상태인지 확인한다.

- [ ] **Step 8: 검증 명령 실행**

```bash
cd /Users/yeeun/Desktop/PNG_frontend/src/components/ui/community
for f in community-feed.html contest-result.html community-post.html community-write.html user-profile.html; do
  [ -f "$f" ] || continue
  v=$(grep -Ec 'font-size:[0-9]|dv-card|dv-turn|#[eE]31[bB]59|pretendard.*jsdelivr|width=390|font-weight:[7-9]|icons\.js' "$f")
  e=$(grep -Pc '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' "$f")
  printf "%-24s 규약위반:%-4s 이모지:%s\n" "$f" "$v" "$e"
done
```

Expected: `community-feed.html 규약위반:0 이모지:0`

- [ ] **Step 9: 커밋**

```bash
cd /Users/yeeun/Desktop/PNG_frontend
git add src/components/ui/community/community-feed.html
git commit -m "feat(community): 콘테스트 내 출품 서브탭 및 캡션·출품취소·출품 시트 추가"
```

---

## Task 5: 콘테스트 지난 서브탭

**Files:**
- Modify: `src/components/ui/community/community-feed.html`
- Source: `.claude/design/CommunnityUI/phase3/html/2i-contest-past.html`

**Interfaces:**
- Consumes: Task 3의 `switchSubtab` · `.subview` 패턴 · Task 1의 `.rank-badge`
- Produces: `contest-result.html`로의 이동 링크 (Task 6이 그 파일을 만든다)

- [ ] **Step 1: 지난 서브뷰 이식**

`2i-contest-past.html`의 컴팩트 배너 + 지난 콘테스트 목록을 `<div class="subview" data-subview="past">`에 넣는다.

원본 대비 적용할 변환:
- 배너 제목 `골든아워` `font-size:18px` → `var(--font-lg)`
- 섹션 제목 `지난 콘테스트` `font-size:15px` → `var(--font-md)`
- 목록 항목은 `onclick="location.href='./contest-result.html'"`
- 트로피 아이콘은 목록에서 제거된 상태가 원본 의도다 (phase3 README) — 추가하지 않는다
- `#E31B59` → `var(--color-accent)`

```css
      /* ── 지난 콘테스트 목록 ── */
      .past-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 28px;
        border: none;
        background: none;
        width: 100%;
        cursor: pointer;
        text-align: left;
      }
      .past-item__thumb {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        overflow: hidden;
        flex-shrink: 0;
      }
      .past-item__title {
        font-size: var(--font-md);
        font-weight: 600;
        letter-spacing: -0.2px;
      }
      .past-item__meta {
        font-size: var(--font-xs);
        color: rgba(0, 0, 0, 0.4);
        margin-top: 2px;
      }
```

- [ ] **Step 2: 브라우저에서 확인**

`community-feed.html` 390px, 콘테스트 → `지난`:
- 컴팩트 배너 + 지난 콘테스트 목록이 보이는지
- 서브탭 3개가 모두 상호 전환되는지 (`진행중` ↔ `내 출품` ↔ `지난`)
- 목록 항목 클릭 시 `contest-result.html`로 이동 시도하는지 (파일이 없어 404가 나오는 것은 Task 6에서 해결 — 정상)

- [ ] **Step 3: 검증 명령 실행**

```bash
cd /Users/yeeun/Desktop/PNG_frontend/src/components/ui/community
for f in community-feed.html contest-result.html community-post.html community-write.html user-profile.html; do
  [ -f "$f" ] || continue
  v=$(grep -Ec 'font-size:[0-9]|dv-card|dv-turn|#[eE]31[bB]59|pretendard.*jsdelivr|width=390|font-weight:[7-9]|icons\.js' "$f")
  e=$(grep -Pc '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' "$f")
  printf "%-24s 규약위반:%-4s 이모지:%s\n" "$f" "$v" "$e"
done
```

Expected: `community-feed.html 규약위반:0 이모지:0`

- [ ] **Step 4: 커밋**

```bash
cd /Users/yeeun/Desktop/PNG_frontend
git add src/components/ui/community/community-feed.html
git commit -m "feat(community): 콘테스트 지난 서브탭 추가"
```

---

## Task 6: contest-result.html — 결과 상세 풀스크린

**Files:**
- Create: `src/components/ui/community/contest-result.html`
- Source: `.claude/design/CommunnityUI/phase3/html/2i-result-detail.html`

**Interfaces:**
- Consumes: Task 1의 `_shell.reference.html` 셸 · `.rank-badge` CSS
- Produces: 없음 (말단 화면)

풀스크린 목적지이므로 자체 상태바 + 뒤로가기 헤더를 갖는다. 시트가 아니다 — 스크롤이 길고 공유·딥링크 대상이 될 수 있으며, 시트로 만들면 안에서 라이트박스가 열려 레이어가 3중으로 겹친다.

- [ ] **Step 1: 셸 복사 후 헤더 교체**

`_shell.reference.html`을 `contest-result.html`로 복사한 뒤:
- `<title>`을 `PNG - 콘테스트 결과`로
- `.page-nav` 콜랩스 헤더 CSS는 삭제한다 (이 화면은 콜랩스가 없다)
- 상태바 뒤에 뒤로가기 헤더를 넣는다

```html
        <!-- Nav -->
        <div class="detail-nav">
          <button class="detail-nav__back" onclick="history.back()" aria-label="뒤로가기">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span class="detail-nav__title">콘테스트 결과</span>
        </div>
```

```css
      /* ── Detail Nav ── */
      .detail-nav {
        position: sticky;
        top: 54px;
        z-index: 25;
        background: #fff;
        height: 52px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 20px;
      }
      .detail-nav__back {
        width: 32px;
        height: 32px;
        border: none;
        background: none;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #000;
        cursor: pointer;
      }
      .detail-nav__title {
        font-size: var(--font-lg);
        font-weight: 600;
        letter-spacing: -0.4px;
      }
```

- [ ] **Step 2: 결과 상세 본문 이식**

`2i-result-detail.html`에서 히어로(우승작) + 순위 목록 + 통계를 가져온다.

원본 대비 적용할 변환:
- 히어로 상단 메타 행 `font-size:12px`(52행) → `var(--font-xs)` — 흰색 반투명 캡션이므로 11px
- 26px 원형 랭크 뱃지 `font-size:12px`(67행) → `.rank-badge` 클래스 (13px)
- 통계 수치 `font-size:22px` → `var(--font-xl)` · 라벨 `font-size:11px` → `var(--font-xs)`
- 트로피 아이콘은 쓰지 않는다 — 랭크 뱃지만 (phase3 README)
- `#E31B59` → `var(--color-accent)`
- 하단 탭바는 유지한다 (커뮤니티 탭 내부 화면)

- [ ] **Step 3: 브라우저에서 확인**

`contest-result.html`을 390px로 직접 열고:
- 상태바 + 뒤로가기 헤더 + 우승작 히어로 + 순위 목록 + 통계가 순서대로 보이는지
- 스크롤이 되는지 (콜랩스 없이 헤더가 sticky로 남는지)
- 랭크 뱃지 숫자가 26px 원 안에 정렬되는지

그리고 `community-feed.html` → 콘테스트 → `지난` → 목록 항목 클릭 → 이 화면으로 이동하고, 뒤로가기로 복귀하는지 확인한다.

- [ ] **Step 4: 검증 명령 실행**

```bash
cd /Users/yeeun/Desktop/PNG_frontend/src/components/ui/community
for f in community-feed.html contest-result.html community-post.html community-write.html user-profile.html; do
  [ -f "$f" ] || continue
  v=$(grep -Ec 'font-size:[0-9]|dv-card|dv-turn|#[eE]31[bB]59|pretendard.*jsdelivr|width=390|font-weight:[7-9]|icons\.js' "$f")
  e=$(grep -Pc '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' "$f")
  printf "%-24s 규약위반:%-4s 이모지:%s\n" "$f" "$v" "$e"
done
```

Expected: `community-feed.html`과 `contest-result.html` 모두 `규약위반:0 이모지:0`

- [ ] **Step 5: 커밋**

```bash
cd /Users/yeeun/Desktop/PNG_frontend
git add src/components/ui/community/contest-result.html
git commit -m "feat(community): 콘테스트 결과 상세 목업 신규 작성"
```

---

## Task 7: community-post.html — 상세 + 액션시트 + 삭제·신고 + 토스트

**Files:**
- Replace: `src/components/ui/community/community-post.html` (기존 전체 덮어쓰기)
- Source: `.claude/design/CommunnityUI/phase1/html/2b-post-detail.html`, `2b-action-sheet-mine.html`, `2b-action-sheet-other.html`, `2b-delete-confirm.html`, `2b-report-sheet.html`, `2b-toast-deleted.html`, `2b-toast-reported.html`

**Interfaces:**
- Consumes: Task 1의 셸 · `.sheet*` · `.modal*` · `.toast` · `.avatar` · `.score-badge` CSS · Task 6의 `.detail-nav` CSS
- Produces: `openLightbox()` 진입점 — Task 8이 라이트박스 본체를 붙인다
- Produces: `?mine=1` 쿼리 처리 로직

- [ ] **Step 1: 셸 복사 후 상세 헤더 구성**

`_shell.reference.html`을 `community-post.html`로 복사한 뒤:
- `<title>`을 `PNG - 게시글`로
- `.page-nav` 콜랩스 CSS 삭제
- Task 6의 `.detail-nav` CSS를 그대로 가져오고, 우측에 `⋯` 더보기 버튼을 추가한다

```html
        <div class="detail-nav">
          <button class="detail-nav__back" onclick="history.back()" aria-label="뒤로가기">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span class="detail-nav__title">게시글</span>
          <button class="detail-nav__more" onclick="openActionSheet()" aria-label="더보기">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="5" cy="12" r="1" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
            </svg>
          </button>
        </div>
```

```css
      .detail-nav__more {
        width: 32px;
        height: 32px;
        border: none;
        background: none;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #000;
        cursor: pointer;
        margin-left: auto;
      }
```

- [ ] **Step 2: 게시글 상세 본문 이식**

`2b-post-detail.html`에서 히어로 사진 + 유저 행 + 캡션 + 촬영 정보 + 포토제닉 + 댓글 목록 + 댓글 입력을 가져온다.

원본 대비 적용할 변환:
- 캡션의 🌅 2곳 제거 (문장은 유지)
- 히어로 사진 **우측 상단에 확대 아이콘 버튼**을 둔다 — lucide `Maximize`, `onclick="openLightbox()"` (Task 8에서 본체 추가)
- 포토제닉 배지는 Task 1의 `.score-badge` 사용
- 아바타는 Task 1의 `.avatar` 사용
- 댓글 입력 전송 버튼은 lucide `Send`
- `#E31B59` → `var(--color-accent)`

```css
      /* ── Post Hero ── */
      .post-hero {
        position: relative;
        height: 320px;
      }
      .post-hero__expand {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 16px;
        background: rgba(0, 0, 0, 0.35);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
```

- [ ] **Step 3: 액션시트 이식 (내글 / 남글 분기)**

`2b-action-sheet-mine.html` + `2b-action-sheet-other.html`을 한 시트로 합치고 `.is-mine` 클래스로 분기한다. `id="action-sheet"`.

- 남글 행: `공유하기` · `신고하기`(`.sheet__row--danger`, `onclick="openSheet('report-sheet')"`)
- 내글 행: `공유하기` · `수정하기` · `삭제하기`(`.sheet__row--danger`, `onclick="openModal('delete-modal')"`)

```css
      #action-sheet .action-row--mine { display: none; }
      #action-sheet .action-row--other { display: flex; }
      #action-sheet.is-mine .action-row--mine { display: flex; }
      #action-sheet.is-mine .action-row--other { display: none; }
```

- [ ] **Step 4: 삭제 확인 모달 + 신고 사유 시트 이식**

`2b-delete-confirm.html` → `.modal-backdrop` / `.modal`, `id="delete-modal"`.
- 제목 `게시글을 삭제할까요?` · 본문 `삭제하면 되돌릴 수 없습니다` · 버튼 `취소` / `삭제`

`2b-report-sheet.html` → `.sheet-backdrop` / `.sheet`, `id="report-sheet"`.
- 사유 라디오 목록 + 하단 설명 `선택 즉시 접수됩니다 · 검토 결과는 알림으로 안내` `font-size:12px` → `var(--font-xs)` (캡션이므로 11px)
- 제출 버튼 높이 52px · radius 26px · accent solid

- [ ] **Step 5: 토스트 2종 이식**

`2b-toast-deleted.html` · `2b-toast-reported.html`을 Task 1의 `.toast` 클래스로 하나씩 만든다. 아이콘은 lucide `CheckCircle`.
- `id="toast-deleted"` 문구 `게시글이 삭제되었습니다`
- `id="toast-reported"` 문구 `신고가 접수되었습니다`

- [ ] **Step 6: JS 작성**

```html
    <script>
      /* ── 시트 · 모달 · 토스트 공통 ── */
      function openSheet(id) {
        document.getElementById(id).classList.add('is-open');
      }
      function closeSheet(id) {
        document.getElementById(id).classList.remove('is-open');
      }
      function openModal(id) {
        document.getElementById(id).classList.add('is-open');
      }
      function closeModal(id) {
        document.getElementById(id).classList.remove('is-open');
      }
      function showToast(id) {
        const t = document.getElementById(id);
        t.classList.add('is-open');
        setTimeout(() => t.classList.remove('is-open'), 2600);
      }

      /* ── 내글 / 남글 분기 ── */
      const isMyPost = new URLSearchParams(location.search).get('mine') === '1';
      document.getElementById('action-sheet').classList.toggle('is-mine', isMyPost);

      function openActionSheet() {
        openSheet('action-sheet');
      }

      /* ── 삭제 ── */
      function deletePost() {
        closeModal('delete-modal');
        closeSheet('action-sheet');
        showToast('toast-deleted');
      }

      /* ── 신고 ── */
      function submitReport() {
        closeSheet('report-sheet');
        closeSheet('action-sheet');
        showToast('toast-reported');
      }
    </script>
```

- [ ] **Step 7: 브라우저에서 확인**

`community-post.html`을 390px로 열고:
- 히어로 + 캡션 + 촬영 정보 + 댓글이 보이고 이모지가 없는지
- `⋯` → 액션시트가 **남글 버전**(`공유하기` / `신고하기`)으로 열리는지
- `신고하기` → 사유 시트 → 제출 → `신고가 접수되었습니다` 토스트가 뜨고 2.6초 후 사라지는지

`community-post.html?mine=1`로 열고:
- `⋯` → 액션시트가 **내글 버전**(`공유하기` / `수정하기` / `삭제하기`)으로 열리는지
- `삭제하기` → 확인 모달 → `삭제` → `게시글이 삭제되었습니다` 토스트가 뜨는지

- [ ] **Step 8: 검증 명령 실행**

```bash
cd /Users/yeeun/Desktop/PNG_frontend/src/components/ui/community
for f in community-feed.html contest-result.html community-post.html community-write.html user-profile.html; do
  [ -f "$f" ] || continue
  v=$(grep -Ec 'font-size:[0-9]|dv-card|dv-turn|#[eE]31[bB]59|pretendard.*jsdelivr|width=390|font-weight:[7-9]|icons\.js' "$f")
  e=$(grep -Pc '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' "$f")
  printf "%-24s 규약위반:%-4s 이모지:%s\n" "$f" "$v" "$e"
done
```

Expected: `community-post.html 규약위반:0 이모지:0`. 이 시점에 `community-write.html`만 0이 아니다.

- [ ] **Step 9: 커밋**

```bash
cd /Users/yeeun/Desktop/PNG_frontend
git add src/components/ui/community/community-post.html
git commit -m "feat(community): 게시글 상세 목업 신규 작성 — 액션시트·삭제·신고·토스트"
```

---

## Task 8: community-post.html — 라이트박스 2중 레이어 (2c + 2d)

**Files:**
- Modify: `src/components/ui/community/community-post.html`
- Source: `.claude/design/CommunnityUI/phase2/html/2c-photo-lightbox.html`, `2d-photo-info-exif.html`

**Interfaces:**
- Consumes: Task 7의 `openLightbox()` 호출 지점 (히어로 우측 상단 확대 버튼)
- Produces: 없음 (말단)

**레이어 규칙 — 이 Task의 핵심**

```
2b 상세 ─[히어로 우측 상단 확대 아이콘]→ 2c 라이트박스 (layer 1 · z-index 90)
                                          └─[(i) 아이콘]→ 2d EXIF (layer 2 · z-index 100)

닫기 순서: 2d 닫기 → 2c 유지 → 2c 닫기 → 2b 복귀
```

`2d`는 `2c`를 **대체하지 않고 그 위에 쌓인다.** `2d`를 닫으면 `2c`가 그대로 남아 있어야 한다.

- [ ] **Step 1: 라이트박스(2c) 마크업 추가**

`2c-photo-lightbox.html`에서 전체화면 사진 + 상단 닫기 + 하단 액션 바를 가져온다. `id="photo-lightbox"`.

원본 대비 적용할 변환:
- 좋아요 카운트 `248` `font-size:12px` → `var(--font-sm)`
- 하단 액션 바에 **`(i)` 정보 버튼**을 둔다 — lucide `Info`, `onclick="openExif()"`
- 닫기 버튼 lucide `X`, `onclick="closeLightbox()"`

```css
      /* ── Photo Lightbox (layer 1) ── */
      .lightbox {
        position: absolute;
        inset: 0;
        background: #000;
        z-index: 90;
        display: none;
        flex-direction: column;
        justify-content: center;
      }
      .lightbox.is-open { display: flex; }
      .lightbox__top {
        position: absolute;
        top: 60px;
        left: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        z-index: 2;
      }
      .lightbox__icon-btn {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .lightbox__bottom {
        position: absolute;
        bottom: 40px;
        left: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        z-index: 2;
      }
      .lightbox__action {
        display: flex;
        align-items: center;
        gap: 5px;
        border: none;
        background: none;
        color: #fff;
        font-family: var(--font-family);
        font-size: var(--font-sm);
        cursor: pointer;
      }
```

- [ ] **Step 2: EXIF 정보(2d) 마크업을 두 번째 레이어로 추가**

`2d-photo-info-exif.html`에서 EXIF 항목 목록 + GPS 지도 카드를 가져온다. `id="photo-exif"`. **`#photo-lightbox`의 형제가 아니라 그 위에 뜨는 별 레이어**로 두고 `z-index: 100`을 준다.

원본 대비 적용할 변환:
- 항목 라벨 `font-size:11px` → `var(--font-xs)` · 값 `font-size:13px` → `var(--font-sm)`
- 섹션 제목 `font-size:15px` → `var(--font-md)`
- GPS 지도는 정적 플레이스홀더로 둔다 (`react-native-maps` 교체는 RN 스펙 사안). 회색 배경 + 중앙 lucide `MapPin`
- Meteocons 날씨 아이콘은 CDN 유지
- 닫기 버튼 `onclick="closeExif()"` — **`closeLightbox()`가 아니다**

```css
      /* ── EXIF Sheet (layer 2 — 라이트박스 위) ── */
      .exif-layer {
        position: absolute;
        inset: 0;
        z-index: 100;
        display: none;
        align-items: flex-end;
      }
      .exif-layer.is-open { display: flex; }
      .exif-layer__backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
      }
      .exif-layer__panel {
        position: relative;
        width: 100%;
        max-height: 70%;
        overflow-y: auto;
        background: #fff;
        border-radius: 24px 24px 0 0;
        padding: 8px 28px 32px;
      }
      .exif-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 44px;
        border-bottom: 1px solid var(--color-border);
      }
      .exif-row:last-child { border-bottom: none; }
      .exif-row__label {
        font-size: var(--font-xs);
        color: rgba(0, 0, 0, 0.45);
      }
      .exif-row__value {
        font-size: var(--font-sm);
        color: #000;
        letter-spacing: -0.2px;
      }
      .exif-map {
        height: 120px;
        border-radius: 12px;
        background: var(--color-surface);
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(0, 0, 0, 0.25);
        margin-top: 12px;
      }
```

- [ ] **Step 3: 레이어 JS 추가**

Task 7의 `<script>` 블록에 이어 붙인다.

```javascript
      /* ── 라이트박스 (layer 1) ── */
      function openLightbox() {
        document.getElementById('photo-lightbox').classList.add('is-open');
      }
      function closeLightbox() {
        closeExif();
        document.getElementById('photo-lightbox').classList.remove('is-open');
      }

      /* ── EXIF (layer 2 · 라이트박스 위에 겹침) ── */
      function openExif() {
        document.getElementById('photo-exif').classList.add('is-open');
      }
      function closeExif() {
        document.getElementById('photo-exif').classList.remove('is-open');
      }
```

`closeLightbox()`가 `closeExif()`를 먼저 부르는 이유: 라이트박스를 닫을 때 EXIF가 열려 있으면 함께 정리해야 유령 레이어가 남지 않는다. 반대로 `closeExif()`는 라이트박스를 건드리지 않는다.

- [ ] **Step 4: 브라우저에서 확인 — 레이어 순서가 이 Task의 합격 조건**

`community-post.html` 390px:
1. 히어로 우측 상단 확대 아이콘 클릭 → 라이트박스가 전체를 덮는지
2. 라이트박스 하단 `(i)` 클릭 → EXIF 패널이 **라이트박스 위에** 올라오는지 (배경에 검은 라이트박스가 보여야 한다)
3. EXIF 닫기 → **라이트박스가 그대로 남아 있는지** (상세로 바로 튀지 않아야 한다)
4. 라이트박스 닫기 → 상세로 복귀하는지
5. EXIF를 열어둔 상태에서 라이트박스 닫기 → 둘 다 닫히고 유령 레이어가 없는지

- [ ] **Step 5: 검증 명령 실행**

```bash
cd /Users/yeeun/Desktop/PNG_frontend/src/components/ui/community
for f in community-feed.html contest-result.html community-post.html community-write.html user-profile.html; do
  [ -f "$f" ] || continue
  v=$(grep -Ec 'font-size:[0-9]|dv-card|dv-turn|#[eE]31[bB]59|pretendard.*jsdelivr|width=390|font-weight:[7-9]|icons\.js' "$f")
  e=$(grep -Pc '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' "$f")
  printf "%-24s 규약위반:%-4s 이모지:%s\n" "$f" "$v" "$e"
done
```

Expected: `community-post.html 규약위반:0 이모지:0`

- [ ] **Step 6: 커밋**

```bash
cd /Users/yeeun/Desktop/PNG_frontend
git add src/components/ui/community/community-post.html
git commit -m "feat(community): 게시글 사진 라이트박스 및 EXIF 2중 레이어 추가"
```

---

## Task 9: community-write.html — 새 글 작성 + 위치·촬영정보 시트

**Files:**
- Replace: `src/components/ui/community/community-write.html` (기존 전체 덮어쓰기)
- Source: `.claude/design/CommunnityUI/phase2/html/2e-post-compose.html`, `2e-location-sheet.html`, `2e-gear-sheet.html`

**Interfaces:**
- Consumes: Task 1의 셸 · `.sheet*` · `.chip` CSS · Task 6의 `.detail-nav` CSS
- Produces: 없음 (말단)

- [ ] **Step 1: 셸 복사 후 작성 화면 헤더 구성**

`_shell.reference.html`을 `community-write.html`로 복사한 뒤:
- `<title>`을 `PNG - 새 글 작성`으로
- `.page-nav` 콜랩스 CSS 삭제
- Task 6의 `.detail-nav` CSS를 가져오고, 좌측 `취소`(텍스트) + 우측 `등록`(accent 텍스트) 형태로 바꾼다
- 하단 탭바는 **제거한다** — 작성 화면은 모달 push이므로 탭바가 없다

```html
        <div class="detail-nav">
          <button class="detail-nav__text" onclick="history.back()">취소</button>
          <span class="detail-nav__title">새 글</span>
          <button class="detail-nav__text detail-nav__text--accent">등록</button>
        </div>
```

```css
      .detail-nav__text {
        border: none;
        background: none;
        font-family: var(--font-family);
        font-size: var(--font-sm);
        color: rgba(0, 0, 0, 0.55);
        cursor: pointer;
        padding: 6px 0;
      }
      .detail-nav__text--accent {
        color: var(--color-accent);
        font-weight: 600;
        margin-left: auto;
      }
      .detail-nav__title {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
      }
```

탭바를 제거하므로 `.phone-scroll`의 `padding-bottom: 80px`을 `padding-bottom: 32px`으로 바꾼다.

- [ ] **Step 2: 새 글 작성 본문 이식**

`2e-post-compose.html`에서 사진 선택 영역 + 캡션 textarea + 메타 행(위치·시간·날씨·카메라·렌즈)을 가져온다.

원본 대비 적용할 변환:
- 행 제목 `font-size:15px` → `var(--font-md)` · 우측 값 `font-size:13px` → `var(--font-sm)` · 캡션 `font-size:11px` → `var(--font-xs)`
- 위치 행 → `onclick="openSheet('location-sheet')"`
- 카메라 행 → `onclick="openGearSheet('camera')"` · 렌즈 행 → `onclick="openGearSheet('lens')"`
- `#E31B59` → `var(--color-accent)`
- 우측 화살표는 lucide `ChevronRight`

```css
      /* ── Compose Row ── */
      .compose-row {
        display: flex;
        align-items: center;
        gap: 12px;
        height: 56px;
        padding: 0 28px;
        border: none;
        background: none;
        width: 100%;
        cursor: pointer;
        text-align: left;
        border-bottom: 1px solid var(--color-border);
      }
      .compose-row__label {
        font-size: var(--font-md);
        letter-spacing: -0.2px;
        flex: 1;
      }
      .compose-row__value {
        font-size: var(--font-sm);
        color: rgba(0, 0, 0, 0.45);
        letter-spacing: -0.2px;
      }
      .compose-row__value.is-set { color: #000; }
```

- [ ] **Step 3: 위치 태그 시트 이식**

`2e-location-sheet.html` → `.sheet-backdrop` / `.sheet`, `id="location-sheet"`.
- 검색 입력 + 최근 위치 목록 + 스팟 목록
- 라벨 `font-size:15px` → `var(--font-md)` · 주소 `font-size:11px` → `var(--font-xs)`
- 항목 클릭 → `selectLocation(name)`으로 본문 행 값 갱신 후 시트 닫기

- [ ] **Step 4: 촬영 정보 시트 이식 (카메라 / 렌즈 분기)**

`2e-gear-sheet.html` → `.sheet-backdrop` / `.sheet`, `id="gear-sheet"`. `kind`에 따라 제목과 목록이 바뀐다.
- `kind='camera'` → 제목 `카메라` · 목록 `Sony A7IV` `Canon R6II` `Nikon Z6III` …
- `kind='lens'` → 제목 `렌즈` · 목록 `24mm f/2.8` `35mm f/1.4` `70-200mm f/2.8` …
- 프리셋 항목은 Task 1의 `.chip` 사용

시간·날씨 편집은 이 시트에 넣지 않는다 (숫자 스테퍼·옵션 리스트로 UI 패턴이 달라 별 컴포넌트 사안 — phase2 README).

- [ ] **Step 5: JS 작성**

```html
    <script>
      function openSheet(id) {
        document.getElementById(id).classList.add('is-open');
      }
      function closeSheet(id) {
        document.getElementById(id).classList.remove('is-open');
      }

      /* ── 위치 선택 ── */
      function selectLocation(name) {
        const v = document.querySelector('#row-location .compose-row__value');
        v.textContent = name;
        v.classList.add('is-set');
        closeSheet('location-sheet');
      }

      /* ── 촬영 정보 시트 (카메라 / 렌즈) ── */
      let gearKind = 'camera';

      function openGearSheet(kind) {
        gearKind = kind;
        const sheet = document.getElementById('gear-sheet');
        sheet.querySelector('.sheet__title').textContent = kind === 'camera' ? '카메라' : '렌즈';
        sheet.querySelectorAll('[data-gear-kind]').forEach((el) => {
          el.style.display = el.dataset.gearKind === kind ? 'block' : 'none';
        });
        openSheet('gear-sheet');
      }
      function selectGear(name) {
        const rowId = gearKind === 'camera' ? '#row-camera' : '#row-lens';
        const v = document.querySelector(rowId + ' .compose-row__value');
        v.textContent = name;
        v.classList.add('is-set');
        closeSheet('gear-sheet');
      }
    </script>
```

- [ ] **Step 6: 브라우저에서 확인**

`community-write.html` 390px:
- 탭바가 없고 상단이 `취소` / `새 글` / `등록`인지
- 위치 행 클릭 → 위치 시트 → 항목 선택 → 행 값이 갱신되고 검은색으로 바뀌는지
- 카메라 행 클릭 → 시트 제목이 `카메라`이고 카메라 목록만 보이는지
- 렌즈 행 클릭 → 시트 제목이 `렌즈`로 바뀌고 렌즈 목록만 보이는지
- 각각 선택 시 해당 행만 갱신되는지 (카메라 선택이 렌즈 행을 바꾸지 않아야 한다)

`community-feed.html`의 `＋` 버튼에서 이 화면으로 이동하고 `취소`로 복귀하는지 확인한다.

- [ ] **Step 7: 검증 명령 실행**

```bash
cd /Users/yeeun/Desktop/PNG_frontend/src/components/ui/community
for f in community-feed.html contest-result.html community-post.html community-write.html user-profile.html; do
  [ -f "$f" ] || continue
  v=$(grep -Ec 'font-size:[0-9]|dv-card|dv-turn|#[eE]31[bB]59|pretendard.*jsdelivr|width=390|font-weight:[7-9]|icons\.js' "$f")
  e=$(grep -Pc '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' "$f")
  printf "%-24s 규약위반:%-4s 이모지:%s\n" "$f" "$v" "$e"
done
```

Expected: 존재하는 4개 파일 전부 `규약위반:0 이모지:0`

- [ ] **Step 8: 커밋**

```bash
cd /Users/yeeun/Desktop/PNG_frontend
git add src/components/ui/community/community-write.html
git commit -m "feat(community): 새 글 작성 목업 신규 작성 — 위치·촬영정보 시트"
```

---

## Task 10: user-profile.html — 다른 유저 프로필

**Files:**
- Create: `src/components/ui/community/user-profile.html`
- Source: `.claude/design/CommunnityUI/phase4/html/2l-profile.html`, `2l-profile-following.html`, `2l-profile-spots.html`

**Interfaces:**
- Consumes: Task 1의 셸 · `.subtab` · `.avatar` CSS · Task 6의 `.detail-nav` CSS
- Produces: 없음 (말단)

3개 원본은 같은 화면의 세 상태다 — `activeTab` (`posts` / `contests` / `spots`) + `isFollowing`. 한 파일에 담는다.

- [ ] **Step 1: 셸 복사 후 프로필 헤더 구성**

`_shell.reference.html`을 `user-profile.html`로 복사한 뒤:
- `<title>`을 `PNG - 유저 프로필`로
- `.page-nav` 콜랩스 CSS 삭제
- Task 6의 `.detail-nav` CSS를 가져와 뒤로가기 + 유저명 헤더로 쓴다
- 하단 탭바는 유지한다 (커뮤니티 탭 내부 화면)

- [ ] **Step 2: 프로필 헤더 + 통계 이식**

`2l-profile.html`에서 아바타 + 유저명 + 통계 3개(게시글 142 / 팔로워 / 팔로잉 248) + 팔로우 버튼 + 메시지 버튼을 가져온다.

원본 대비 적용할 변환:
- `BETA` 뱃지 `font-size:9px` → `var(--font-2xs)` (10px) · `letter-spacing` 양수 유지 (스페이스드 캡스)
- 메시지 버튼은 disabled 스타일 `color: rgba(0,0,0,.35)` 유지 · `disabled` 속성 추가
- 통계 수치 `font-size:17px` → `var(--font-lg)` · 라벨 `font-size:11px` → `var(--font-xs)`
- 팔로우 버튼 `font-size:12px`(2l-profile-spots 53행) → `var(--font-sm)` · `onclick="toggleFollow(this)"`
- `#E31B59` → `var(--color-accent)`

```css
      /* ── Profile Header ── */
      .profile-head {
        padding: 20px 28px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .profile-head__avatar {
        width: 64px;
        height: 64px;
        border-radius: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.85);
        font-size: var(--font-lg);
        font-weight: 600;
        flex-shrink: 0;
      }
      .profile-head__name {
        font-size: var(--font-xl);
        font-weight: 600;
        letter-spacing: -0.6px;
      }
      .profile-stats {
        display: flex;
        gap: 28px;
        padding: 0 28px 16px;
      }
      .profile-stats__value {
        font-size: var(--font-lg);
        font-weight: 600;
        letter-spacing: -0.3px;
      }
      .profile-stats__label {
        font-size: var(--font-xs);
        color: rgba(0, 0, 0, 0.4);
        margin-top: 2px;
      }
      .profile-actions {
        display: flex;
        gap: 8px;
        padding: 0 28px 16px;
      }
      .profile-actions__btn {
        flex: 1;
        height: 40px;
        border: none;
        border-radius: 20px;
        font-family: var(--font-family);
        font-size: var(--font-sm);
        font-weight: 600;
        letter-spacing: -0.2px;
        cursor: pointer;
      }
      .profile-actions__btn--follow {
        background: var(--color-accent);
        color: #fff;
      }
      .profile-actions__btn--follow.is-following {
        background: var(--color-surface);
        color: rgba(0, 0, 0, 0.55);
      }
      .profile-actions__btn--message {
        background: var(--color-surface);
        color: rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        cursor: default;
      }
      .profile-badge-beta {
        height: 16px;
        padding: 0 5px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.08);
        font-size: var(--font-2xs);
        font-weight: 600;
        letter-spacing: 0.5px;
        color: rgba(0, 0, 0, 0.35);
        display: inline-flex;
        align-items: center;
      }
```

- [ ] **Step 3: 탭 3개 + 각 탭 콘텐츠 이식**

Task 1의 `.subtab` 클래스로 `게시글` / `콘테스트` / `방문한 스팟` 탭을 만들고, 3개 원본에서 각 탭 콘텐츠를 가져온다.

- `게시글` 탭 (`2l-profile.html`) — 사진 그리드
- `콘테스트` 탭 (`2l-profile-following.html`) — 출품 이력. `1위` / `3위` 랭크 뱃지 `font-size:9px` → `var(--font-2xs)`
- `방문한 스팟` 탭 (`2l-profile-spots.html`) — 스팟 목록. 정렬 드롭다운 `font-size:12px`(65행) → `var(--font-sm)`
- 캡션의 🌅 제거 (`2l-profile.html` 1곳, `2l-profile-following.html` 1곳)

```css
      .profile-tabview { display: none; }
      .profile-tabview.is-active { display: block; }
```

- [ ] **Step 4: JS 작성**

```html
    <script>
      /* ── 프로필 탭 ── */
      function switchProfileTab(tab, el) {
        document.querySelectorAll('.profile-tabview').forEach((v) => {
          v.classList.toggle('is-active', v.dataset.tab === tab);
        });
        el.parentElement.querySelectorAll('.subtab__btn').forEach((b) => {
          b.classList.toggle('is-active', b === el);
        });
      }

      /* ── 팔로우 토글 ── */
      function toggleFollow(el) {
        const following = el.classList.toggle('is-following');
        el.textContent = following ? '팔로잉' : '팔로우';
      }
    </script>
```

- [ ] **Step 5: 브라우저에서 확인**

`user-profile.html` 390px:
- 아바타 + 유저명 + 통계 3개 + `팔로우` / `메시지 BETA` 버튼이 보이는지
- `메시지` 버튼이 disabled 회색이고 눌리지 않는지
- `팔로우` 클릭 → `팔로잉`으로 바뀌고 배경이 회색으로, 재클릭 시 복귀하는지
- 탭 3개(`게시글` / `콘테스트` / `방문한 스팟`)가 전환되는지
- `콘테스트` 탭의 랭크 뱃지가 읽히는 크기인지 (10px)
- 이모지가 없는지

`community-feed.html`의 유저명 클릭에서 이 화면으로 이동하는지 확인한다 (Task 1의 카드 유저명에 `onclick="location.href='./user-profile.html'"`이 없으면 여기서 추가한다).

- [ ] **Step 6: 검증 명령 실행**

```bash
cd /Users/yeeun/Desktop/PNG_frontend/src/components/ui/community
for f in community-feed.html contest-result.html community-post.html community-write.html user-profile.html; do
  [ -f "$f" ] || continue
  v=$(grep -Ec 'font-size:[0-9]|dv-card|dv-turn|#[eE]31[bB]59|pretendard.*jsdelivr|width=390|font-weight:[7-9]|icons\.js' "$f")
  e=$(grep -Pc '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' "$f")
  printf "%-24s 규약위반:%-4s 이모지:%s\n" "$f" "$v" "$e"
done
```

Expected: **5개 파일 전부** `규약위반:0 이모지:0`

- [ ] **Step 7: 커밋**

```bash
cd /Users/yeeun/Desktop/PNG_frontend
git add src/components/ui/community/user-profile.html src/components/ui/community/community-feed.html
git commit -m "feat(community): 유저 프로필 목업 신규 작성 — 탭 3개·팔로우 토글"
```

---

## Task 11: 셸 참조 파일 정리 + 문서 갱신 + 전체 검증

**Files:**
- Delete: `src/components/ui/community/_shell.reference.html`
- Modify: `docs/guide/dev/ui-publishing.md`

**Interfaces:**
- Consumes: Task 1~10의 완성 파일 5개
- Produces: 없음 (마무리)

- [ ] **Step 1: 셸 참조 파일 삭제**

5개 파일이 모두 셸을 흡수했으므로 임시 참조 파일은 지운다. 남겨두면 목업 폴더에 열어도 아무것도 안 나오는 파일이 생긴다.

```bash
cd /Users/yeeun/Desktop/PNG_frontend
rm src/components/ui/community/_shell.reference.html
```

- [ ] **Step 2: `ui-publishing.md` 파일 목록 수정**

`docs/guide/dev/ui-publishing.md`의 `community/` 블록을 찾는다. 현재는 이렇다.

```
  community/
    community-feed.html       # 커뮤니티 피드 (레시피·갤러리 탭·타이틀 하단 검색바)
    community-write.html      # 게시물 작성 (촬영 시간·날씨·카메라·렌즈·위치 바텀시트)
    contest.html              # 주간 콘테스트 — 미퍼블리싱
```

이렇게 바꾼다.

```
  community/
    community-feed.html       # 커뮤니티 루트 (게시글·갤러리·콘테스트 세그먼트 / 콘테스트 하위 진행중·내 출품·지난 서브탭)
    community-post.html       # 게시글 상세 (액션시트·삭제·신고·토스트 / 사진 라이트박스 → EXIF 2중 레이어)
    community-write.html      # 게시물 작성 (위치·촬영 정보 바텀시트)
    contest-result.html       # 콘테스트 결과 상세 (우승작·순위·통계 / 풀스크린)
    user-profile.html         # 다른 유저 프로필 (게시글·콘테스트·방문한 스팟 탭)
```

`contest.html` 항목이 사라지고 `community-post.html`이 목록에 추가되는 것에 유의한다 (기존 목록에 누락돼 있었다).

- [ ] **Step 3: `ui-publishing.md` 화면별 설명 수정**

`### community/community-feed.html` 절을 찾는다. 현재는 이렇다.

```
### community/community-feed.html
- 스크롤 콜랩스 헤더 (travel과 동일 패턴)
- 타이틀 하단 검색바 (항상 노출, 스크롤 시 큰 타이틀만 접힘)
- 레시피·갤러리 탭 전환
- 인기순 정렬 드롭다운
- 게시물 작성 버튼 → `community-write.html`
```

이렇게 바꾼다.

```
### community/community-feed.html
- 스크롤 콜랩스 헤더 (travel과 동일 패턴)
- 세그먼트 3개: 게시글 · 갤러리 · 콘테스트 — `switchView('posts'|'gallery'|'contest', el)`
- 검색은 헤더 아이콘 → 전체 오버레이 (대상 chips 5개 · 최근 검색), `취소`로 닫기
- 인기순 정렬 드롭다운
- 콘테스트 세그먼트 하위 언더라인 서브탭 3개 — `switchSubtab('active'|'mine'|'past', el)`
  - 진행중: 히어로 배너 186px · 포디움 · 투표 확인/취소 모달 · undo 스낵바 · 라이트박스
  - 내 출품: 컴팩트 배너 120px · 캡션 수정 시트 · 출품 취소 모달 · 출품하기 시트
  - 지난: 목록 → `contest-result.html`
- 게시물 작성 버튼 → `community-write.html`
- 카드 유저명 → `user-profile.html`
- 인터랙션으로 도달 불가한 상태는 쿼리로 진입: `?empty=1` (내 출품 빈 상태)

### community/community-post.html
- 게시글 상세 — 히어로 · 유저 · 캡션 · 촬영 정보 · 포토제닉 · 댓글
- `⋯` → 액션시트. `?mine=1`이면 내글(수정·삭제), 없으면 남글(신고)
- 삭제 확인 모달 · 신고 사유 시트 · 완료 토스트 2종
- 히어로 우측 상단 확대 → 라이트박스(layer 1) → `(i)` → EXIF(layer 2, 라이트박스 위에 겹침)
  - EXIF를 닫으면 라이트박스가 남는다. 라이트박스를 닫으면 둘 다 닫힌다

### community/contest-result.html
- 콘테스트 결과 상세 — 우승작 히어로 · 순위 목록 · 통계
- 풀스크린 목적지 (시트 아님) — 스크롤이 길고 공유·딥링크 대상

### community/user-profile.html
- 다른 유저 프로필 (자기 프로필은 `mypage/mypage.html`)
- 탭 3개: 게시글 · 콘테스트 · 방문한 스팟
- 팔로우 버튼 토글 · 메시지 버튼은 BETA disabled
```

- [ ] **Step 4: `ui-publishing.md` 내비게이션 흐름도 수정**

흐름도에서 이 부분을 찾는다.

```
            ├─ community/community-feed
            │    ├─ community/community-write
            │    └─ community/contest (미퍼블리싱)
```

이렇게 바꾼다.

```
            ├─ community/community-feed
            │    ├─ community/community-post
            │    ├─ community/community-write
            │    ├─ community/contest-result
            │    └─ community/user-profile
```

- [ ] **Step 5: 전체 검증 명령 실행**

```bash
cd /Users/yeeun/Desktop/PNG_frontend/src/components/ui/community
ls -1
for f in community-feed.html contest-result.html community-post.html community-write.html user-profile.html; do
  v=$(grep -Ec 'font-size:[0-9]|dv-card|dv-turn|#[eE]31[bB]59|pretendard.*jsdelivr|width=390|font-weight:[7-9]|icons\.js' "$f")
  e=$(grep -Pc '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' "$f")
  printf "%-24s 규약위반:%-4s 이모지:%s\n" "$f" "$v" "$e"
done
```

Expected:
- `ls -1`이 정확히 5개 파일만 보여준다 (`_shell.reference.html`이 없어야 한다)
- 5개 파일 전부 `규약위반:0 이모지:0`

- [ ] **Step 6: 공통 링크 누락 확인**

```bash
cd /Users/yeeun/Desktop/PNG_frontend/src/components/ui/community
grep -c 'common/fonts.css' community-feed.html contest-result.html community-post.html community-write.html user-profile.html
grep -c 'common/common.css' community-feed.html contest-result.html community-post.html community-write.html user-profile.html
grep -c 'width=device-width' community-feed.html contest-result.html community-post.html community-write.html user-profile.html
```

Expected: 세 명령 모두 5개 파일에서 각각 `1`.

- [ ] **Step 7: 커밋**

```bash
cd /Users/yeeun/Desktop/PNG_frontend
git add -A src/components/ui/community docs/guide/dev/ui-publishing.md
git commit -m "docs(community): 퍼블리싱 문서 갱신 및 셸 참조 파일 정리"
```

---

## 완료 조건

- [ ] `src/components/ui/community/`에 파일이 정확히 5개 (`community-feed` · `contest-result` · `community-post` · `community-write` · `user-profile`)
- [ ] 5개 파일 전부 검증 명령에서 `규약위반:0 이모지:0`
- [ ] 브라우저 390px에서 32개 상태 전부 도달 가능 (세그먼트 3 · 콘테스트 서브탭 3 · 시트 6 · 모달 4 · 토스트 3 · 라이트박스 2중 · 프로필 탭 3 · 쿼리 2)
- [ ] `docs/guide/dev/ui-publishing.md` 3곳 갱신 완료
- [ ] `src/` 하위 RN 코드(`api`·`hooks`·`types`·`screens`·`components` 중 `ui/` 외)와 `.claude/design/`은 변경되지 않음

## 범위 밖 — 다음 RN 스펙으로

- `CommunityStack`의 `Contest` 라우트와 `ContestScreen.tsx` 삭제
- `UserProfileScreen.tsx`를 `src/screens/mypage/` → `src/screens/community/`로 이동 검토
- 미설치 의존성: 이미지 피커 · `react-native-maps` (EXIF GPS 카드) · FlashList (갤러리 3-col)
- Meteocons 날씨 아이콘 원격 URI → 로컬 SVG asset 번들
- 받은 `.native.jsx`의 토큰 위반: `fontSize: 9` 5곳 · `fontSize: 12` 1곳 · 이모지 🌅 3파일
- 시트를 `src/components/common/BottomSheet.tsx`로 이식 (받은 native는 raw `Modal`)
- `2e·시트`의 시간·날씨 편집 케이스를 별 컴포넌트로 확장
- (관찰) `.status-bar` CSS가 24개 목업에 중복 정의돼 있다. `common.css`로 올리면 각 파일 정의가 캐스케이드상 여전히 우선하므로 안전하게 정리 가능 — 별 작업으로 분리
