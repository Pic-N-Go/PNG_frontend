# 구현 계획 — 폰트 크기 8단계 스케일 정리

> 선행 브랜치: `refactor/design-token-unification`
> `border-radius-plan.md` · `screen-header-plan.md`와 독립적으로 진행 가능하다.
> 셋 중 **위험도가 가장 낮고 자동화 비율이 높다.** 먼저 해도 좋다.

## 1) 입력 스펙

CLAUDE.md는 폰트 크기를 **9개 토큰**으로 제한한다.

```
10 · 11 · 13 · 14 · 15 · 17 · 20 · 22 · 28  (px)
FONT_2XS · FONT_XS · FONT_SM · (없음) · FONT_MD · FONT_LG · FONT_TITLE · FONT_XL · FONT_2XL
```

`14px`만 상수가 없어 `normalizeFontSize(14)`를 그대로 쓴다. 그 사이값(`9 · 12 · 16 · 18` 등)은 금지이며 `12`는 `11` 또는 `13`으로 내리거나 올린다.

> **20px 편입 (2026-08-23).** Apple 타입 스케일의 Title3(20pt)이 빠져 17과 22 사이가 비어 있었다.
> 섹션 제목을 22로 올려 보니 카드가 촘촘한 MY 탭에서 과하게 읽히고, 17은 본문 대비가 죽었다.
> 실측상 시트 제목 9곳이 이미 20이었어서 20을 `FONT_TITLE`로 정식 편입했다.
> 크기명(`FONT_XL` 등) 래더에 17↔22 사이 자리가 없어 역할명으로 둔다.
> `FONT_XL`(22)은 콘테스트 표시 텍스트처럼 더 큰 표제가 계속 쓴다.

**현황** (선행 브랜치 HEAD 기준. `TravelNewScreen` 28곳은 이미 정리 완료)

| 지정 방식 | 개수 |
|---|---|
| `FONT_*` 상수 | 901 |
| `fontSize: normalizeFontSize(생값)` | 299 |
| raw 숫자 (`fontSize: 16,`) | 0 |
| className `text-xs` 등 | 2 |

**생값 299곳 중 164곳이 스케일 밖**이며 **42개 파일**에 걸쳐 있다.

| 위반값 | 곳 | 성격 |
|---|---|---|
| `12` | 73 | **최대 덩어리.** 캡션·라벨·메타 텍스트 |
| `16` | 29 | 본문·버튼·행 제목 |
| `20` | 25 | 섹션 제목·시트 제목 → `FONT_TITLE`로 편입 (아래 참고) |
| `18` | 18 | 화면 타이틀·모달 제목 |
| `9` `8` | 5 | 아주 작은 배지 |
| `11.5` `12.5` `14.5` `15.5` | 8 | 소수점 — 명백한 임의값 |
| `30` `36` `40` `44` `56` | 6 | 대형 디스플레이 숫자 (판단 필요) |

**위반이 많은 파일**

```
19  screens/wishlist/SpotAlertSettingScreen.tsx   (9×1, 12×8, 16×7, 18×2, 20×1)
10  components/travel/CourseMoreSheet.tsx         (12×4, 16×5, 20×1)
 9  screens/wishlist/SpotAlertScreen.tsx          (9×1, 12×4, 16×2, 18×2)
 8  screens/auth/LoginScreen.tsx                  (12×6, 20×1, 40×1)
 8  screens/mypage/PhotoMapScreen.tsx             (12×3, 18×3, 20×2)
 8  screens/mypage/components/sheets/SocialSheet.tsx (12×4, 16×3, 20×1)
 8  screens/travel/TravelListScreen.tsx           (12×6, 18×2)
 7  components/spot/BookmarkSheet.tsx             (12×1, 12.5×4, 18×2)
 7  components/spot/NaviSheet.tsx                 (12×5, 16×1, 18×1)
```

## 2) 구현 전략

**값만 보고 일괄 치환하면 안 된다.** `16`은 문맥에 따라 `15`가 맞을 때도 `17`이 맞을 때도 있다.
역할별 관례를 기준으로 배정한다. 아래는 `TravelNewScreen` 정리 때 코드에서 실측한 앱의 다수값이다.

| 역할 | 토큰 | 근거 |
|---|---|---|
| 화면 타이틀 (네비) | `FONT_LG` (17) | 앱 42곳 |
| 섹션 제목 · 시트 제목 | `FONT_TITLE` (20) | 홈·MY 탭 전 섹션, 설정 시트 9곳 |
| CTA 버튼 · 입력 텍스트 · 행 제목 | `FONT_MD` (15) | `BUTTON_HEIGHT` 사용처 34곳 |
| 폼 필드 라벨 | `FONT_SM` (13) | `ComposeInquiryScreen`의 `FieldLabel` |
| 모달 제목 | `FONT_MD` (15) | `ConfirmModal` |
| 모달 본문 · 모달 버튼 | `FONT_SM` (13) | `ConfirmModal` |
| 캘린더 날짜 셀 | `FONT_MD` (15) | `CalendarSection` |
| 행 설명 · 태그 · 요일 헤더 | `FONT_XS` (11) | 캡션 |
| 배지 | `FONT_2XS` (10) | CLAUDE.md 역할표 |
| 빈 상태 제목 | `FONT_MD` (15) | 알림 화면·새 출사 계획에서 확정 |

## 3) 작업 태스크 (작게 분할)

### Task 1 — 소수점 값 8곳 (즉시)

`11.5` `12.5×4` `14.5` `15.5×2`. 임의로 찍힌 값이 명백하므로 가까운 토큰으로 반올림한다.
판단이 거의 없고 파일도 몇 개 안 된다.

### Task 2 — `12` 73곳

가장 큰 덩어리이자 판단이 가장 단순하다. 대부분 캡션·라벨·메타 텍스트다.

- 행 아래 설명·태그·시간 등 **보조 정보** → `FONT_XS` (11)
- 폼 필드 라벨·우측 값·칩 텍스트 → `FONT_SM` (13)

두 갈래뿐이므로 파일별로 훑으면서 배정한다.

### Task 3 — `16` 29곳 · `18` 18곳 · `20` 25곳

문맥 판단이 필요하다. 위 역할표를 기준으로 배정한다.

- `20`은 대부분 섹션 제목·시트 제목 → `FONT_TITLE`(20). 홈·MY 탭 섹션 제목과 설정 시트 제목은 정리 완료
- `18`은 화면·모달 제목 → `FONT_LG`(17) 또는 `FONT_MD`(15)
- `16`은 본문·버튼 → `FONT_MD`(15)가 다수

### Task 4 — `9` `8` 5곳

`FONT_2XS`(10)로 올린다. 8~9px은 최소 가독 크기 아래다.

### Task 5 — 대형 디스플레이 값 6곳 (별도 판단)

`30` `36×2` `40` `44` `56`. 포토제닉 점수 게이지 숫자, 로그인 로고 등이다.

**규칙을 그대로 적용하면 `28`(`FONT_2XL`)로 내려야 하지만, 실제로는 디스플레이 숫자라
스케일의 취지 밖일 수 있다.** 두 가지 중 하나로 정한다.

1. `FONT_2XL`(28)로 흡수 — 규칙 단순, 게이지 숫자가 작아짐
2. `DISPLAY_*` 토큰을 신설해 예외로 명시 — CLAUDE.md에 근거를 남길 것

**어느 쪽이든 결정 후 CLAUDE.md와 `docs/guide/dev/design-tokens.md`에 반영해야 한다.**
지금처럼 규칙엔 없고 코드엔 있는 상태를 남기지 않는다.

### Task 6 — className `text-*` 2곳

`text-xs`(12) 등 Tailwind 기본 스케일은 8단계와 무관하다. `FONT_*`로 옮긴다.

## 4) 검증 체크포인트

- [ ] `npx tsc --noEmit` / `npx eslint` 통과
- [ ] 아래 스캔이 0을 반환하는지 (Task 5 결정에 따라 대형값은 제외 가능)

```bash
grep -rhoE "fontSize: normalizeFontSize\([0-9.]+\)" src --include="*.tsx" \
  | grep -oE "[0-9.]+" | sort -n | uniq -c \
  | awk '{ok=($2==10||$2==11||$2==13||$2==14||$2==15||$2==17||$2==22||$2==28); if(!ok) print}'
```

- [ ] 위반이 많던 화면 육안 확인 — 출사 알림 설정, 출사 코스 더보기 시트, 로그인, MY 사진 지도, 소셜 연동 시트, 북마크·길찾기 시트
- [ ] 한 화면 안에서 같은 역할의 텍스트가 서로 다른 크기가 아닌지

## 5) 롤백 계획

Task 단위로 커밋을 분리한다. Task 1·2·4는 되돌릴 일이 거의 없고,
Task 3·5는 시각 변화가 크므로 각각 별도 커밋으로 둔다.

## 6) PR 구성

- Task 1 + 2 + 4를 한 PR (판단이 단순한 것끼리)
- Task 3을 별도 PR (스크린샷 첨부)
- Task 5는 결정 후 별도 PR + 문서 반영

## 참고

- `docs/guide/dev/design-tokens.md` — 토큰 체계
- `docs/guide/dev/device-support.md` — `FONT_*` 상수 목록
- `docs/guide/dev/ui-publishing.md` — 역할별 크기 배정표 (목업 기준)
- `src/screens/travel/TravelNewScreen.tsx` — 28곳을 정리한 선례. 역할별 배정의 참고 사례
