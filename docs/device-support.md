# 지원 기기 정책

## 지원 범위

**대상:** 스마트폰 (iOS / Android)  
**미지원:** 태블릿, 폴더블 기기

---

## 지원 기기 목록

### iOS

| 기기 | 화면 너비 | 지원 여부 |
|---|---|---|
| iPhone SE (2/3세대) | 375dp | ✅ |
| iPhone 12 mini / 13 mini | 375dp | ✅ |
| iPhone 12 / 13 / 14 / 15 | 390dp | ✅ |
| iPhone 14 Pro / 15 Pro | 393dp | ✅ |
| iPhone 14 Plus / 15 Plus | 428dp | ✅ |
| iPhone 14 Pro Max / 15 Pro Max | 430dp | ✅ |
| iPad (전 라인업) | 768dp+ | ❌ |

### Android

| 기기 | 화면 너비 | 지원 여부 |
|---|---|---|
| 갤럭시 A14 / A15 (보급형) | 360dp | ✅ |
| 갤럭시 A34 / A54 | 393dp | ✅ |
| 갤럭시 S23 / S24 | 393dp | ✅ |
| 갤럭시 S23+ / S24+ | 412dp | ✅ |
| 갤럭시 S23 Ultra / S24 Ultra | 412dp | ✅ |
| 구글 픽셀 7 / 8 | 393dp | ✅ |
| 360dp 미만 구형 보급형 | ~360dp | ❌ |
| 갤럭시 탭 (전 라인업) | 768dp+ | ❌ |

---

## 스케일링 기준

- **디자인 기준 너비**: `390dp` (iPhone 15 Pro)
- **지원 범위**: `360dp ~ 430dp`
- **스케일링 유틸**: `src/utils/normalize.ts`
- **레이아웃 상수**: `src/constants/layout.ts`

### 레이아웃 상수 (`src/constants/layout.ts`)

디자인 기준값을 상수로 정의해두었습니다. 화면 구현 시 raw 숫자 대신 상수를 사용하세요.

| 상수 | 값 (기준) | 용도 |
|---|---|---|
| `BUTTON_HEIGHT` | 52px | 기본 버튼 높이 |
| `INPUT_HEIGHT` | 52px | 인풋 필드 높이 |
| `BUTTON_RADIUS` | 26px | 버튼 pill shape radius |
| `INPUT_RADIUS` | 12px | 인풋 border-radius |
| `CARD_RADIUS` | 16px | 카드 border-radius |
| `CONTENT_PADDING` | 28px | 페이지 콘텐츠 좌우 패딩 |
| `GRID_PADDING` | 20px | 카드 그리드 좌우 패딩 |
| `SPACING_XS / SM / MD / LG / XL` | 4/8/16/24/32px | 섹션·컴포넌트 간격 |
| `ICON_SM / MD / LG` | 18/22/28px | 아이콘 크기 |
| `FONT_XS ~ 2XL` | 11~28px | 폰트 크기 |
| `TAB_BAR_HEIGHT` | 80px | 하단 탭바 높이 |
| `HEADER_HEIGHT` | 52px | 상단 네비게이션 바 높이 |
| `BOTTOM_SHEET_RADIUS` | 24px | 바텀시트 상단 border-radius |

### 사용 예시

```tsx
import { BUTTON_HEIGHT, BUTTON_RADIUS, CONTENT_PADDING, CARD_RADIUS, FONT_LG } from "@/constants/layout";

// 버튼
<TouchableOpacity
  className="w-full items-center justify-center bg-[#E31B59]"
  style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}
>
  <Text style={{ fontSize: FONT_LG }} className="text-white font-medium">
    로그인
  </Text>
</TouchableOpacity>

// 페이지 레이아웃
<View style={{ paddingHorizontal: CONTENT_PADDING }} className="flex-1 bg-white">
  {/* 콘텐츠 */}
</View>

// 카드
<View style={{ borderRadius: CARD_RADIUS }} className="bg-[#f5f5f7]">
  {/* 카드 내용 */}
</View>
```

### Safe Area

기기 모서리(Dynamic Island, 노치, 하단 홈 인디케이터)는 `ScreenContainer`가 자동으로 처리합니다.  
화면 구현 시 `SafeAreaView`를 직접 사용하지 말고 `ScreenContainer`를 사용하세요.

```tsx
import { ScreenContainer } from "@/components/ScreenContainer";

// 기본 — top/bottom/left/right 모두 처리
<ScreenContainer> ... </ScreenContainer>

// 히어로 화면 — top 제외 (이미지가 상단 끝까지 채워야 할 때)
<ScreenContainer edges={['left', 'right', 'bottom']}> ... </ScreenContainer>
```

> HTML 목업의 `.status-bar` 높이(54px)와 하단 인디케이터는 퍼블리싱 전용 수동 처리입니다.  
> 실제 구현에서는 `ScreenContainer`로 대체하면 됩니다.

### normalize vs className 사용 기준

| 상황 | 방법 |
|---|---|
| 패딩, 마진, gap, flex 비율 | NativeWind `className` (`px-7`, `gap-3`, `flex-1`) |
| 버튼/인풋 고정 높이 | `BUTTON_HEIGHT`, `INPUT_HEIGHT` |
| 카드 radius | `CARD_RADIUS` |
| 아이콘 크기 | `ICON_SM`, `ICON_MD`, `ICON_LG` |
| 폰트 크기 | `FONT_SM` ~ `FONT_2XL` |

---

## 태블릿 미지원 사유 및 향후 계획

### 현재 미지원 이유

- PNG는 야외 포토스팟 탐색 및 현장 촬영 조건 확인이 핵심 사용 시나리오로, 핸드폰 중심의 사용 패턴
- 태블릿 레이아웃은 2단 컬럼, 사이드바 등 별도 UI 설계가 필요하여 초기 개발 비용이 크게 증가
- 현재 HTML 목업이 전부 390×844 핸드폰 기준으로 설계되어 있음

### 향후 태블릿 지원 시 방향

태블릿 지원이 필요한 시점에는 아래 방식으로 확장합니다.

1. **`useWindowDimensions` 기반 분기**
   ```ts
   const { width } = useWindowDimensions();
   const isTablet = width >= 768;
   ```

2. **태블릿 전용 레이아웃 컴포넌트** — 핸드폰 레이아웃을 유지하면서 태블릿에서만 2단 레이아웃 적용

3. **별도 목업 설계** — 현재 HTML 목업을 기반으로 태블릿 전용 시안 추가 제작

> 태블릿 지원은 핸드폰 버전 안정화 이후 별도 스프린트로 진행합니다.

---

## 관련 문서

- [`docs/development-guide.md`](development-guide.md) — RN 구현 가이드 (레이아웃 상수 사용 예시 포함)
- [`docs/ui-publishing.md`](ui-publishing.md) — HTML 목업 구조 및 phone-frame 규칙
- [`CLAUDE.md`](../CLAUDE.md) — 프로젝트 전체 규칙 및 디자인 시스템
