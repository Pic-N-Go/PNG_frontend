# 디자인 토큰 (RN 구현 기준)

색·테두리·그림자·폰트의 **하드코딩을 금지**하고 토큰으로만 쓴다.
목업(HTML) 쪽 토큰은 `src/components/ui/common/common.css`에 있고, 이 문서는 **RN 구현** 기준이다.

## 단일 소스 구조

```
src/constants/colors.json     ← 색상 값의 단일 소스
  ├─→ tailwind.config.js (require)   → className: bg-brand, text-sub, border-hairline …
  └─→ src/constants/colors.ts        → style prop: BRAND, TEXT_SUB, HAIRLINE …
```

`tailwind.config.js`는 Node가 로드하므로 `.ts`를 읽을 수 없고, 이 프로젝트에는 `allowJs`가 없다.
JSON으로 둔 이유가 그것이다(레포가 이미 `licenses.json`을 import하고 있어 tsconfig 변경이 필요 없다).
**className과 style prop이 같은 파일을 보므로 값이 어긋날 수 없다.**

## 색

| 토큰 | 값 | className | TS |
|---|---|---|---|
| 브랜드/액센트 | `#E31B59` | `bg-brand` `text-brand` `border-brand` | `BRAND` |
| 브랜드 틴트 — 배경·아이콘 타일 | 5% | `bg-brand/5` | `BRAND_TINT` |
| 브랜드 틴트 — 선택·활성 | 10% | `bg-brand/10` | `BRAND_TINT_ACTIVE` |
| 브랜드 — 테두리·중간 강조 | 30% | `border-brand/30` | `BRAND_MUTED` |
| 브랜드 — 오버레이 배지 | 90% | `bg-brand/90` | `BRAND_STRONG` |
| 카드·인풋 배경 | `#F5F5F7` | `bg-card` | `CARD` |
| 보조 텍스트·아이콘 | `#8A8A8E` | `text-sub` | `TEXT_SUB` |
| 구분선 색 | `rgba(0,0,0,0.06)` | `border-hairline` | `HAIRLINE` |
| 모달 딤·반투명 배지 | `rgba(0,0,0,0.4)` | — | `SCRIM` |

- 보조 텍스트 `#8A8A8E`는 iOS `secondaryLabel`(`#3C3C43` 60%)의 라이트모드 합성값이다.
  흰 배경 대비 3.44:1로 WCAG AA(4.5:1) 미달이며, iOS 순정도 동일하다는 것을 알고 선택했다.
  올리려면 `colors.json`의 `sub`만 바꾸면 194곳이 따라온다(`rgba(0,0,0,0.55)`가 4.74:1).
- **브랜드 투명도는 4단계(5/10/30/90)로 고정.** 이전에 17종이 흩어져 있었고
  "선택하면 진해진다"는 위계가 없었다. **새 단계를 늘리지 말 것.**
- 브랜드 알파 4단계는 `colors.json`의 hex에서 파생시킨다. `brand`를 바꾸면 함께 따라온다.

## 테두리

`src/constants/layout.ts`

| 상수 | 값 | 용도 |
|---|---|---|
| `HAIRLINE_WIDTH` | `0.5` | 구분선. className은 `border-b-[0.5px] border-hairline` |
| `BORDER_CONTROL` | `1.5` | 입력 포커스, 선택 상태 칩/체크박스, 아웃라인 버튼 |

**콘텐츠 카드에는 테두리를 쓰지 않는다.** 배경색 대비로만 층을 나눈다.

## 그림자

`src/constants/shadow.ts`

| 상수 | 용도 |
|---|---|
| `SHADOW_CONTROL` | 콘텐츠 위에 떠 있는 컨트롤 — 검색바, 지도 위 버튼 |
| `SHADOW_OVERLAY` | 화면을 덮는 것 — 바텀시트, 팝업, 드롭다운 |

**그림자는 "떠 있는 것"에만.** 콘텐츠 카드에 옅은 그림자를 얹으면 배경 대비도 약하고
그림자도 안 보여서 결과적으로 둘 다 하지 않은 상태가 된다.

iOS 4속성과 Android `elevation`을 함께 써야 해서 색과 달리 `Platform.select` 스타일 객체다.

## 폰트

Pretendard **3웨이트만** 로드한다 — `Regular` / `Medium` / `SemiBold`.
로고만 `FugazOne_400Regular`(스플래시, 로그인). `PretendardVariable`은 **쓰지 않는다**(파일도 없음).

디자인 규칙이 `max weight 600`이라 Bold 이상은 없다. `font-bold`도 SemiBold로 매핑된다.

- **새 웨이트가 필요하면 `App.tsx`의 `useFonts` 등록이 선행 조건이다.**
  등록 없이 `fontFamily`만 쓰면 iOS는 조용히 시스템 폰트로 폴백하고 안드로이드는 폴백하거나 죽는다.
- `font-normal` `font-medium` `font-semibold` `font-bold` 유틸리티는 `global.css`에서
  **패밀리 지정으로 재정의**돼 있다. `tailwind.config.js`에서 `fontWeight` 코어 플러그인을 꺼
  정의가 하나만 남으므로 캐스케이드 순서에 의존하지 않는다.
- **`fontWeight`를 쓰지 말 것.** RN은 웨이트별로 패밀리가 갈리므로 `fontFamily` 단독으로 지정한다.
  named-weight 패밀리에 `fontWeight`를 병용하면 안드로이드에서 폴백이 난다.
- React 19에서 함수 컴포넌트의 `defaultProps`가 제거돼 `Text.defaultProps`로 전역 기본값을
  까는 방식은 쓸 수 없다. **모든 `<Text>`에 패밀리를 명시한다.**
- **`<TextInput>`도 마찬가지다.** 부모의 `fontFamily`를 상속하지 않아서, 빠뜨리면 입력한
  글자만 OS 기본 서체(iOS SF, Android Roboto)로 렌더된다. `placeholderTextColor`는 있는데
  패밀리가 없는 경우가 많아 눈에 띄지 않는다. 입력 텍스트는 `Pretendard-Regular`를 쓴다.
- 지도 WebView는 번들 폰트 스코프 밖이라 숫자 서브셋(`src/constants/mapFont.ts`)을
  base64로 인라인한다. 재생성 방법은 그 파일 주석에 있다.

## 토큰을 쓰지 않는 예외

의도된 것이므로 통일 대상이 아니다.

| 예외 | 예 |
|---|---|
| 의미 색 | 상태 배지 초록·노랑·파랑, 에러/성공 |
| 어두운 배경 위 반투명 흰 보더 | 히어로 검색바, 지도 버튼, 프로필 헤더 |
| 배경과 맞춰 파내는 장식 링 | 아바타 흰 링, 썸네일 겹침 |
| 골든아워 계열 | `PhotogenicScoreCard`의 `COLORS.golden`, 히어로 그라디언트 |
| 핑크 글로우 | 지도 핀 그림자·펄스 애니메이션. 배경 틴트가 아니라 발광 효과라 4단계 밖 |
| `AdminDashboardScreen` | 내부 관리자 도구라 앱 디자인 시스템 미적용 |

> **스팟 상세(`ConvenienceInfoSection`, `PhotogenicScoreCard`)는 되돌리지 말 것.**
> 한때 자체 웜그레이 팔레트(`#1F1E1D` `#8B8680` `#F7F6F4` 등)를 썼으나,
> 목업 원본(`src/components/ui/spot/spot-detail.html`)이 표준 토큰을 쓰는 것을 확인하고 편입했다.
> 목업의 `.transport-card` / `.info-cell`은 `var(--color-surface)`(=`#f5f5f7`)에 테두리가 없다.

## 아직 통일되지 않은 것

후속 브랜치용 계획 문서가 `docs/ai/plans/refactor/ui-consistency/`에 있다.

| 항목 | 규모 | 계획 문서 |
|---|---|---|
| `border-radius` | 상수 7개가 있으나 생값이 3.7배(432곳), 값 종류 30가지 | `border-radius-plan.md` |
| 화면 헤더 | 뒤로가기가 있는 32개 화면이 공용 컴포넌트 없이 각자 구현 | `screen-header-plan.md` |
| 폰트 크기 | `fontSize` 생값 299곳 중 **164곳이 8단계 스케일 밖** (42개 파일) | `font-scale-plan.md` |

셋 다 값 하나로 수렴시킬 수 없는 성격이다. radius는 요소 크기에, 폰트는 텍스트 역할에 종속되고,
헤더는 토큰이 아니라 컴포넌트가 없는 문제다.
