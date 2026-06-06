# 퍼블리싱 스타일 통일성 수정 목록

> 검토 기준: `.claude/design.md` + `docs/ui-publishing.md`  
> 검토 대상: `src/components/ui/` 전체 HTML 파일 (24개)

---

## 수정 항목 1 — `--radius-card` 불일치 (16px 통일)

**문제**: 카드 `border-radius` 기준값이 파일마다 14px / 16px로 혼재됨.  
**기준**: 디자인 스펙 `--radius-card: 16px`

| 수정 파일 | 현재 값 | 수정 값 |
|---|---|---|
| `travel/travel-new.html` | `14px` | `16px` |
| `spot/spot-register.html` | `14px` | `16px` |
| `spot/review-write.html` | `14px` | `16px` |
| `mypage/mypage.html` | `14px` | `16px` |
| `mypage/my-photos.html` | `14px` | `16px` |
| `mypage/profile-edit.html` | `14px` | `16px` |
| `mypage/setting.html` | `14px` | `16px` |

**수정 방법**: 각 파일 `:root` 블록에서 `--radius-card: 14px` → `--radius-card: 16px` 변경.  
`--radius-card` 변수를 선언하지 않고 `14px`을 직접 쓴 경우 함께 교체.

---

## 수정 항목 2 — Dynamic Island 배경색 불일치 (`#000` 통일)

**문제**: 실제 다이나믹 아일랜드는 solid black인데 파일마다 4가지 값이 혼재됨.  
**기준**: `background: #000`

| 수정 파일 | 현재 값 | 수정 값 |
|---|---|---|
| `auth/login.html` | `rgba(0, 0, 0, 0.65)` | `#000` |
| `auth/signup.html` | `rgba(0, 0, 0, 0.55)` | `#000` |
| `home/home.html` | `rgba(0, 0, 0, 0.55)` | `#000` |
| `spot/spot-detail.html` | `rgba(0, 0, 0, 0.55)` | `#000` |
| `auth/oauth-onboarding.html` | `#111111` | `#000` |
| `travel/travel-new.html` | `#111` | `#000` |

**수정 방법**: `.dynamic-island { background: ... }` 값을 `#000`으로 교체.  
클래스명이 다른 경우 (예: `.map-status-bar__dynamic-island`) 동일하게 적용.

---

## 수정 항목 3 — 인풋 필드 높이 불일치 (52px 통일)

**문제**: 인풋 height가 46 / 50 / 52 / 54px로 혼재됨.  
**기준**: 버튼 높이(52px)와 맞춰 `height: 52px`

| 수정 파일 | 현재 값 | 수정 값 |
|---|---|---|
| `auth/signup.html` | `54px` | `52px` |
| `auth/oauth-onboarding.html` | `54px` | `52px` |
| `spot/spot-register.html` | `50px` | `52px` |
| `spot/review-write.html` | `50px` | `52px` |
| `mypage/profile-edit.html` | `50px` | `52px` |
| `mypage/wishlist-setting.html` | `46px` | `52px` |
| `mypage/setting.html` | `46px` | `52px` |

**수정 방법**: `.input-group__field`, `.sheet-input`, 그 외 인풋 래퍼의 `height` 값 교체.  
> `setting.html`은 단순 설정 행(toggle row)으로 인풋이 아닌 경우 제외.

---

## 수정 항목 4 — CTA 버튼 높이 불일치 (52px 통일)

**문제**: 주요 제출 버튼(가입하기, 저장하기 등) height가 50px / 48px인 파일 존재.  
**기준**: `height: 52px`

| 수정 파일 | 현재 값 | 수정 값 |
|---|---|---|
| `mypage/profile-edit.html` | `50px` | `52px` |
| `mypage/setting.html` | `48px` | `52px` |

**수정 방법**: `.btn`, `.sheet-submit`, 또는 직접 스타일링된 제출 버튼의 `height` 교체.

---

## 수정 항목 5 — `min-height: unset` 누락

**문제**: `@media (min-width: 391px)` 블록에서 `height: calc(100dvh - 40px)` 를 적용할 때,  
베이스에 `min-height`가 설정된 파일은 반드시 `min-height: unset`을 함께 선언해야 함.  
누락 시 CSS 우선순위상 `min-height`가 `height`를 무시해 레이아웃이 깨질 수 있음.

| 수정 파일 | 베이스 min-height | 현상 |
|---|---|---|
| `auth/login.html` | `min-height: 844px` | 데스크탑에서 phone-frame이 화면보다 길어짐 |
| `home/home.html` | `min-height: 100dvh` | 데스크탑에서 스크롤 컨테이너 감지 오작동 가능 |

**수정 방법**: 해당 파일의 미디어 쿼리 `.phone-frame` 블록에 한 줄 추가.

```css
@media (min-width: 391px) {
  .phone-frame {
    border-radius: 40px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    min-height: unset; /* 추가 */
    height: calc(100dvh - 40px);
    overflow-y: auto;
    overflow-x: hidden;
  }
}
```

---

## 수정 항목 6 — `--color-accent-disabled` 변수 선언 방식 불일치

**문제**: 비활성 버튼 색상을 변수로 선언한 파일과 직접 값으로 쓴 파일이 혼재됨.  
**기준**: `:root`에 `--color-accent-disabled: rgba(227, 27, 89, 0.25)` 선언 후 참조

| 현황 | 파일 |
|---|---|
| 변수 선언 O | `auth/signup.html`, `auth/oauth-onboarding.html` |
| 폴백으로만 사용 | `auth/login.html` → `var(--color-accent-disabled, rgba(227,27,89,0.25))` |
| 직접 값 사용 | 나머지 파일들 (변수 미선언, 하드코딩) |

**수정 방법**: 비활성 버튼을 사용하는 모든 파일의 `:root`에 변수 추가 후 참조로 교체.

---

## 수정 우선순위 요약

| 순위 | 항목 | 영향 파일 수 | 체감 효과 |
|---|---|---|---|
| 🔴 1 | radius-card 16px 통일 | 7개 | 높음 — 카드 둥글기 눈에 띔 |
| 🔴 2 | Dynamic Island #000 통일 | 6개 | 중간 — 세부 디테일 |
| 🟡 3 | 인풋 높이 52px 통일 | 7개 | 높음 — 폼 화면에서 정렬감 |
| 🟡 4 | CTA 버튼 52px 통일 | 2개 | 중간 |
| 🟢 5 | min-height: unset 추가 | 2개 | 낮음 — 데스크탑 브라우저에서만 발생 |
| 🟢 6 | accent-disabled 변수 통일 | 전반 | 낮음 — 유지보수 측면 |
