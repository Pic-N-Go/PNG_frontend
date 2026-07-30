# 커뮤니티 UI 퍼블리싱 파일 교체 — 설계

작성일 2026-07-27 · 브랜치 `feature/community-screens`

## 목표

`.claude/design/CommunnityUI/`로 받은 커뮤니티 디자인 산출물(HTML 33개 · RN 24개)을
프로젝트 퍼블리싱 규약에 맞는 HTML 목업 **5개**로 통합 교체한다.

**이번 범위는 HTML 퍼블리싱 파일뿐이다.** RN 구현은 별도 스펙으로 진행한다.

## 배경

### 받은 패키지

| phase | HTML | native.jsx | 내용 |
|---|---|---|---|
| phase1 게시글 코어 | 9 | 7 | 피드 · 검색확장 · 상세 · 액션시트 · 삭제/신고/토스트 |
| phase2 게시글 확장 | 6 | 6 | 라이트박스 · EXIF · 새 글 작성 · 위치/촬영정보 시트 · 갤러리 |
| phase3 콘테스트 | 14 | 10 | 진행중 · 내 출품 · 지난 · 결과 · 출품 · 라이트박스 · 투표 |
| phase4 프로필 | 4 | 1 | 유저 프로필 3탭 + 아이콘 참고 문서 |

`phase4/html/icons-reference.html`은 Figma 이관용 참고 문서로 RN 컴포넌트가 없어 이관 대상에서 제외한다.
→ **교체 대상 HTML 32개.**

### 현재 구현 상태

- HTML 목업: `community-feed.html`(2,600여 줄) · `community-post.html` · `community-write.html` 3개.
  `contest.html`은 `docs/guide/dev/ui-publishing.md`에 "미퍼블리싱"으로만 기재됨
- RN 화면 `CommunityFeedScreen` · `CommunityWriteScreen` · `ContestScreen`은 모두 6줄 `<View />` 스텁
- `src/api/community.ts` · `src/hooks/useCommunity.ts` · `src/types/community.ts` 전부 주석 1줄
- `src/components/community/` 빈 폴더
- 즉 **RN은 그린필드**이며, 이번 스펙은 그 앞단인 목업만 다룬다

### 기존 `community-feed.html`과의 관계

기존 파일에 이미 게시글(RECIPE)/갤러리/콘테스트 뷰, 테마 배너, 포디움 순위, 투표 시트,
결과 시트, 출품 시트, 내 출품 현황, 라이트박스가 들어 있다. 신규 디자인과 **범위가 겹치되
구조가 다르다** — 기존은 스크롤 콜랩스 헤더 + 상시 노출 검색바, 신규는 콜랩스 없이 검색
아이콘 → 헤더 교체식 오버레이.

## 결정 사항

### D1. 파일 구조 — 화면 단위 통합 5개

상태(시트·모달·토스트·빈 상태)를 파일로 쪼개지 않고 해당 화면 파일 안의 상태로 통합한다.
1:1로 33개를 두면 상태바·헤더 마크업이 33번 복제되어 헤더 한 줄 수정에 33곳을 손봐야 한다.

```
src/components/ui/community/
  community-feed.html    ← 교체
  contest-result.html    ← 신규
  community-post.html    ← 교체
  community-write.html   ← 교체
  user-profile.html      ← 신규
```

### D2. 콘테스트는 커뮤니티 루트의 세그먼트

`게시글 / 갤러리 / 콘테스트`는 같은 루트 화면의 세그먼트 컨트롤이다 (2a·2f·2g·2h·2i 모두
헤더 row1 + 세그먼트 컨트롤이 동일). 콘테스트 세그먼트 안에 언더라인 서브탭
`진행중 / 내 출품 / 지난`이 들어간다.

따라서 `contest.html` 별 파일 계획은 폐기한다. RN에서도 `CommunityStack`의 `Contest` 라우트와
`ContestScreen.tsx`가 불필요해지나, 그 정리는 다음 RN 스펙에서 수행한다.

### D3. 목적지는 라우트, 태스크는 시트

- **바텀시트 = 입력·결정 태스크** — 출품하기, 캡션 수정, 위치 태그, 신고 사유, 촬영 정보 편집.
  끝나면 닫히고 원래 자리로 복귀
- **풀스크린 push = 목적지** — 게시글 상세, 유저 프로필, 콘테스트 결과 상세. 자체 콘텐츠가 있고
  스크롤이 길며 뒤로가기로 나간다

결과 상세(`2i·결과`)는 우승작 + 순위 목록 + 통계까지 담겨 스크롤이 길고 공유·딥링크 대상이 될
수 있어 라우트를 갖는다. 시트로 만들면 그 안에서 다시 사진 라이트박스가 열려 레이어가 3중으로
겹친다. 따라서 원본 목업의 상태바 + 헤더를 그대로 유지한 **풀스크린 별 파일**로 둔다.

### D4. 인라인 스타일 → 전면 토큰화 + 반복만 클래스 추출

받은 HTML은 3,755줄 전부 하드코딩 인라인 스타일이고 기존 목업은 완전 클래스 기반이다.
전면 클래스화는 클래스 이름 200개를 새로 지어야 하고, 토큰만 치환하면 동일 카드 마크업이 한
파일에 3번 복제된 상태가 남는다. 절충하여:

- 모든 색상값·폰트는 `var(--*)` 토큰으로 치환 → `grep`으로 기계적 검증 가능
- 파일 내 2회 이상 반복되는 것만 BEM 클래스 추출
- 일회성 레이아웃은 인라인 유지(토큰만 적용)

### D5. 아이콘 — 커뮤니티 본문은 lucide, 셸은 기존 tabler

`docs/guide/dev/design-handoff-brief.md`가 tabler·lucide 혼용을 허용하되 컴포넌트/섹션 내
통일을 요구한다. 받은 디자인이 lucide(stroke 1.8)로 통일돼 있어 그대로 쓴다.
`lucide-react-native`와 `@tabler/icons-react-native` 모두 이미 설치되어 있어 추가 의존성이 없다.

기존 community 목업이 `common/icons.js` 스프라이트로 쓰던 tabler 3개는 lucide 대응으로 교체한다.

| 기존 (tabler 스프라이트) | 교체 (lucide 인라인 SVG) |
|---|---|
| `icon-camera` | `Camera` |
| `icon-lens` | `Aperture` |
| `icon-writing-sign` | `Plus` |

상태바·하단 탭바는 다른 화면과 공유하는 셸이므로 기존 마크업(tabler)을 그대로 둔다.

## 파일별 매핑

ID는 `.claude/design/CommunnityUI/phase*/native/README.md` 매핑표 표기를 따른다.

### community-feed.html — 교체 (16)

세그먼트 `게시글` / `갤러리` / `콘테스트`, 콘테스트 하위 언더라인 서브탭 `진행중` / `내 출품` / `지난`.

| 상태 | 출처 ID | 원본 파일 | 도달 경로 |
|---|---|---|---|
| 게시글 피드 | `2a` | `2a-community-feed.html` | 세그먼트 (기본) |
| 검색 오버레이 | `2a·검색` | `2a-community-feed-search.html` | 검색 아이콘 → `취소` |
| 갤러리 3-col | `2f` | `2f-gallery.html` | 세그먼트 |
| 콘테스트 진행중 | `2g` | `2g-contest-active.html` | 세그먼트 |
| 내 출품 | `2h` | `2h-my-entry.html` | 서브탭 |
| 내 출품 빈 상태 | `2h·빈상태` | `2h-empty.html` | `?empty=1` |
| 캡션 수정 시트 | `2h·캡션` | `2h-caption-sheet.html` | 내 출품 → 캡션 수정 |
| 출품 취소 확인 | `2h·출품취소` | `2h-withdraw.html` | 내 출품 → 출품 취소 |
| 지난 콘테스트 | `2i` | `2i-contest-past.html` | 서브탭 |
| 출품하기 시트 | `2j` | `2j-submit-sheet.html` | `출품하기` 버튼 |
| 출품 · 사진 미선택 | `2j·빈상태` | `2j-submit-empty.html` | 시트 초기 상태 |
| 콘테스트 라이트박스 | `2k` | `2k-contest-lightbox.html` | 출품작 썸네일 |
| 라이트박스 · 투표됨 | `2k·투표됨` | `2k-voted.html` | 투표 실행 후 |
| 투표 확인 모달 | `2·투표확인` | `vote-confirm.html` | 투표 버튼 |
| 투표 취소 모달 | `2·투표취소` | `vote-cancel.html` | 투표한 항목 재클릭 |
| 투표 undo 스낵바 | `2·스낵바` | `vote-snackbar.html` | 투표 확정 후 |

지난 콘테스트 목록 항목 클릭 → `contest-result.html`로 `location.href` 이동
(기존 `community-write.html` 진입과 동일 관행).

### contest-result.html — 신규 (1)

| 상태 | 출처 ID | 원본 파일 |
|---|---|---|
| 결과 상세 (우승작 · 순위 목록 · 통계) | `2i·결과` | `2i-result-detail.html` |

원본의 상태바 + 헤더를 유지한 풀스크린. 뒤로가기로 `community-feed.html` 콘테스트 `지난` 서브탭 복귀.

### community-post.html — 교체 (9)

| 상태 | 출처 ID | 원본 파일 | 도달 경로 |
|---|---|---|---|
| 게시글 상세 | `2b` | `2b-post-detail.html` | 피드 카드 클릭 |
| 액션시트 (남글) | `2b·액션(남글)` | `2b-action-sheet-other.html` | `⋯` (기본) |
| 액션시트 (내글) | `2b·액션(내글)` | `2b-action-sheet-mine.html` | `?mine=1` + `⋯` |
| 삭제 확인 모달 | `2b·삭제` | `2b-delete-confirm.html` | 내글 액션시트 → 삭제 |
| 신고 사유 시트 | `2b·신고` | `2b-report-sheet.html` | 남글 액션시트 → 신고 |
| 토스트 · 삭제됨 | `2b·토스트(삭제)` | `2b-toast-deleted.html` | 삭제 확정 시 |
| 토스트 · 신고 접수 | `2b·토스트(신고)` | `2b-toast-reported.html` | 신고 제출 시 |
| 사진 라이트박스 | `2c` | `2c-photo-lightbox.html` | 아래 레이어 경로 |
| 사진 정보 EXIF | `2d` | `2d-photo-info-exif.html` | 아래 레이어 경로 |

**라이트박스 레이어 경로**

```
2b 상세 ─[히어로 사진 우측 상단 확대 아이콘]→ 2c 라이트박스 (modal · layer 1)
                                              └─[(i) 아이콘]→ 2d EXIF (layer 2 · 2c 위에 겹침)

닫기: 2d 닫기 → 2c 유지 → 2c 닫기 → 2b 복귀
```

`2d`는 `2c`를 대체하지 않고 그 위에 쌓이는 두 번째 레이어다.

### community-write.html — 교체 (3)

| 상태 | 출처 ID | 원본 파일 | 도달 경로 |
|---|---|---|---|
| 새 글 작성 | `2e` | `2e-post-compose.html` | 피드 `＋` 버튼 |
| 위치 태그 시트 | `2e·위치` | `2e-location-sheet.html` | 위치 행 클릭 |
| 촬영 정보 편집 시트 | `2e·시트` | `2e-gear-sheet.html` | 카메라/렌즈 행 클릭 |

`2e·시트`는 `kind='camera'` / `kind='lens'` 두 케이스를 같은 시트로 처리한다.
시간·날씨 편집은 UI 패턴이 달라(숫자 스테퍼 · 날씨 옵션 리스트) 이 시트에 포함하지 않는다.

### user-profile.html — 신규 (3)

다른 유저의 프로필이다 (자기 프로필은 MY 탭의 `mypage.html`로 별개).
프로필 헤더(아바타 · 게시글/팔로워/팔로잉 통계 3) + 탭 `게시글` / `콘테스트` / `방문한 스팟`.

| 상태 | 출처 ID | 원본 파일 | 도달 경로 |
|---|---|---|---|
| 게시글 탭 (기본) | `2l` | `2l-profile.html` | 피드/상세의 유저명 클릭 |
| 콘테스트 탭 · 팔로잉 상태 | `2l·팔로잉` | `2l-profile-following.html` | 탭 + 팔로우 버튼 토글 |
| 방문한 스팟 탭 | `2l·스팟` | `2l-profile-spots.html` | 탭 |

`2l·팔로잉`은 팔로잉 *목록*이 아니라 `activeTab='contests'` + `isFollowing=true` 상태다.
메시지 버튼은 `BETA` 뱃지 + disabled 스타일(`rgba(0,0,0,.35)`)로 유지한다.

## 변환 규칙

### 셸 재사용

| 항목 | 받은 디자인 | 교체 후 |
|---|---|---|
| 폰트 | Pretendard jsdelivr CDN 직링크 | `<link href="../common/fonts.css">` |
| 토큰·리셋 | 없음 | `<link href="../common/common.css">` |
| 래퍼 | `.dv-card` / `.dv-turn` 디자인 뷰어용 카드+그림자 | `.phone-frame` + `.phone-scroll` |
| viewport | `width=390` 고정 | `width=device-width` |
| 상태바 | 인라인 SVG 3개 직접 작성 | 기존 community 목업의 `.status-bar` 마크업 복사 |
| 하단 탭바 | 인라인 SVG 5개 직접 작성 | 기존 community 목업의 `.tab-bar` 마크업 복사 |

Meteocons 날씨 아이콘(`cdn.jsdelivr.net/npm/@meteocons/svg/...`)은 기존 목업 11곳에서 이미
쓰고 있어 CDN 그대로 유지한다. RN 이관 시 로컬 asset 번들로 교체한다.

### 토큰 치환

| 원본 | 치환 |
|---|---|
| `#E31B59` | `var(--color-accent)` |
| `#f5f5f7` | `var(--color-surface)` |
| `rgba(0,0,0,.08)` | `var(--color-border)` |
| `font-size:10px` | `var(--font-2xs)` |
| `font-size:11px` | `var(--font-xs)` |
| `font-size:13px` | `var(--font-sm)` |
| `font-size:14px` | `var(--font-base)` |
| `font-size:15px` | `var(--font-md)` |
| `font-size:17px` | `var(--font-lg)` |
| `font-size:22px` | `var(--font-xl)` |
| `font-size:28px` | `var(--font-2xl)` |

### 금지된 사이값 폰트 보정

CLAUDE.md는 8개 토큰(10·11·13·14·15·17·22·28px)만 허용한다. 받은 HTML의 위반을 역할별
토큰으로 매핑한다 — 단색 일괄 치환보다 레이아웃이 손상될 위험이 적다.

**적용 규칙** — 캡션·메타·설명은 11px, 링크·버튼 라벨·카운트값·표수·랭크 뱃지는 13px,
배지성 초소형 라벨은 10px.

이관 대상 32개 파일의 위반은 총 **27곳**이다.

| 원본 | 개수 | 위치 | 보정 |
|---|---|---|---|
| `9px` | 12 | `2l`·`2l·팔로잉`·`2l·스팟` — `BETA` 뱃지 · `1위`/`3위` 랭크 뱃지 | `var(--font-2xs)` 10px |
| `12px` | 2 | 캡션·메타 (아래 표) | `var(--font-xs)` 11px |
| `12px` | 10 | 링크·버튼·카운트·표수·랭크뱃지 (아래 표) | `var(--font-sm)` 13px |
| `18px` | 3 | `2h`·`2h·빈상태`·`2i` 배너 제목 `골든아워` | `var(--font-lg)` 17px |

`20px`는 `icons-reference.html`에만 1곳 있어 이관 제외 대상이라 해당 없음.

**`12px` 12곳 전수 분류**

| 파일 | 대상 | 보정 |
|---|---|---|
| `2b·신고` | 시트 하단 설명 `선택 즉시 접수됩니다 · 검토 결과는…` | 11px |
| `2i·결과` (52행) | 히어로 상단 메타 행 (흰색 반투명) | 11px |
| `2a·검색` | `모두 지우기` 링크 | 13px |
| `2c` | 좋아요 카운트 `248` | 13px |
| `2g` · `2i·결과`(67행) · `2k` | 26px 원형 랭크 뱃지 `1` (3곳) | 13px |
| `2k` | `67표` | 13px |
| `2k·투표됨` | `42표` | 13px |
| `2j` | 사진 영역 오버레이 버튼 | 13px |
| `2l·스팟` (53행) | `팔로우` 버튼 | 13px |
| `2l·스팟` (65행) | 정렬 드롭다운 버튼 | 13px |

> 초기 감사에서 `12px 27곳`으로 집계했으나 그중 15곳이 이관 제외 대상인
> `icons-reference.html`에 있었다. 실제 교체 대상 위반은 12곳이다.

`font-weight`는 받은 파일 전체가 이미 600·500·400뿐이라 보정할 것이 없다.

### 클래스 추출 기준

파일 내 2회 이상 반복되는 것만 BEM으로 추출한다. 예상 클래스:

```
.post-card  .post-card__media  .post-card__meta  .post-card__shot-info  .post-card__footer
.segment  .segment__btn
.subtab  .subtab__btn
.chip
.sheet  .sheet__handle  .sheet__row
.modal  .modal__actions
.toast
.score-badge  .rank-badge
.avatar
```

일회성 레이아웃은 인라인 `style` + 토큰으로 둔다.

### 이모지 제거

CLAUDE.md `No emojis anywhere in the UI`에 따라 🌅를 제거한다.
HTML은 4파일 5곳 — `2a`(1) · `2b`(2) · `2l`(1) · `2l·팔로잉`(1).
native는 3파일 4곳 — `CommunityFeed`(1) · `PostDetail`(2) · `UserProfile`(1).
캡션 텍스트에서 이모지만 삭제하고 문장은 유지한다.

> `"새벽 5시에 일어난 보람이 있는 일출 🌅"` → `"새벽 5시에 일어난 보람이 있는 일출"`

native 파일은 이번 범위가 아니나 다음 RN 스펙에서 같은 처리를 한다.

### 그라디언트

히어로 그라디언트 `#1a1530 → #2d1b4e → #8b4a6b → #d4856a → #f0c89a`는 CLAUDE.md의 골든아워
값과 일치하므로 그대로 유지한다. 히어로 영역에서만 쓴다.

## 상태 전환 구현

기존 목업 관행(인라인 `onclick="fnName()"` + 순수 함수)을 따르고 기존 함수명을 재사용한다.
별도 데모 토글 UI는 만들지 않는다.

| 대상 | 방식 |
|---|---|
| 세그먼트 3 | `switchView('posts'\|'gallery'\|'contest', el)` — 기존 함수명 유지. 인자는 기존 `'recipe'`에서 `'posts'`로 정정 (실제 라벨이 `게시글`) |
| 콘테스트 서브탭 3 | `switchSubtab('active'\|'mine'\|'past', el)` |
| 콜랩스 헤더 | 기존 `community-feed.html`의 `.phone-scroll` 스크롤 리스너 그대로 |
| 검색 오버레이 | `openSearch()` / `closeSearch()` |
| 시트·모달 | `openSheet(id)` / `closeSheet(id)` — 기존 함수명 |
| 라이트박스 2중 레이어 | `openLightbox()` → `openExif()` / `closeExif()` (2c 유지) |

인터랙션으로 도달 불가한 두 상태만 URL 쿼리로 노출한다.

| 상태 | 쿼리 |
|---|---|
| 내 출품 빈 상태 (`2h·빈상태`) | `community-feed.html?empty=1` |
| 액션시트 내글 (`2b·액션(내글)`) | `community-post.html?mine=1` |

## 검증

목업이라 자동 테스트가 없다. 대신 5개 파일에 대해 아래 grep 점검을 실행하고 전부 0이어야 한다.

```bash
cd src/components/ui/community
FILES="community-feed.html contest-result.html community-post.html community-write.html user-profile.html"

grep -c 'font-size:[0-9]'         $FILES   # 사이값·raw 폰트 잔존
grep -c 'dv-card\|dv-turn'        $FILES   # 프리뷰 래퍼 잔존
grep -ci '#e31b59'                $FILES   # accent 하드코딩 잔존
grep -c 'pretendard.*jsdelivr'    $FILES   # 폰트 CDN 직링크
grep -c 'width=390'               $FILES   # 고정 viewport
grep -c 'font-weight:[7-9]'       $FILES   # weight 600 초과
grep -Pc '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' $FILES   # 이모지
```

추가로 브라우저 뷰포트 390px에서 5개 파일의 모든 상태를 육안 확인한다 — 전환 함수가 실제로
동작하는지, 서브탭·시트·2중 레이어가 의도대로 쌓이는지.

## 문서 업데이트

`docs/guide/dev/ui-publishing.md` 3곳을 함께 고친다.

1. **파일 목록** — `contest.html # 미퍼블리싱` 삭제, `contest-result.html`·`user-profile.html` 추가
2. **화면별 설명** — `community/community-feed.html` 항목을 세그먼트 3 + 콘테스트 서브탭 3 구조로 교체
   (현재 기재된 "레시피·갤러리 탭" 표현도 실제 라벨 `게시글`로 정정)
3. **내비게이션 흐름도** — `community/contest (미퍼블리싱)` 제거, 결과 상세·유저 프로필 진입 반영

## 이번 범위 밖 — 다음 RN 스펙으로

조사 중 확인된 사항을 남긴다.

- `CommunityStack`의 `Contest` 라우트와 `ContestScreen.tsx` 삭제 (D2의 결과)
- `UserProfileScreen.tsx`가 `src/screens/mypage/`에 있음 — `community/`로 이동 검토.
  `ui-publishing.md`의 폴더 매핑 규약(`community/` → `src/screens/community/`)과 어긋남
- 미설치 의존성: 이미지 피커(새 글 작성·출품 사진 선택 필수) · `react-native-maps`
  (`2d` EXIF의 GPS 지도 카드) · FlashList (`2f` 갤러리 3-col + 2×2 하이라이트)
- Meteocons 날씨 아이콘 원격 URI → 로컬 SVG asset 번들
- 시트는 프로젝트 자체 구현 `src/components/common/BottomSheet.tsx`로 이식
  (받은 native는 raw `Modal` 사용)
- 받은 native 파일에도 토큰 위반 잔존: `fontSize: 9` 5곳 · `fontSize: 12` 1곳
  (`2h`의 `legacy · brief 12 금지` 주석 포함) · 이모지 🌅 3파일
- `2e·시트`의 시간·날씨 편집 케이스는 별도 컴포넌트로 확장 필요
