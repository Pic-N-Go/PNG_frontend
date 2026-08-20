# 구현 계획 — border-radius 통일

> 선행 브랜치: `refactor/design-token-unification` (색·테두리·그림자·폰트 토큰화 완료)
> 이 작업은 그 후속이며 **선행 브랜치가 main에 머지된 뒤** 시작한다.

## 1) 입력 스펙

색·테두리·그림자·폰트는 토큰으로 통일했으나 `border-radius`는 범위 밖으로 남겼다.
`src/constants/layout.ts`에 상수 7개(`BUTTON_RADIUS` `CARD_RADIUS` `INPUT_RADIUS` `BADGE_RADIUS`
`SOCIAL_BUTTON_RADIUS` `BOTTOM_SHEET_RADIUS` `WHEEL_SELECTION_RADIUS`)가 있으나 실제로는 생값이 지배적이다.

**현황** (선행 브랜치 HEAD 기준)

| 지정 방식 | 개수 |
|---|---|
| `layout.ts` 상수 | 118 |
| `borderRadius: normalize(생값)` | **432** |
| raw 숫자 (`borderRadius: 16,`) | 21 |
| className `rounded-*` | 116 |

생값 종류 **30가지**: `1 2 2.5 3 3.5 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 22 24 27 28 32 44 50 999 9999`

**핵심**: radius는 요소 크기에 종속된다. 36px 아이콘 타일의 `10`과 200px 카드의 `16`은
둘 다 옳다. 따라서 값 하나로 수렴시키는 색 토큰 방식이 통하지 않고, **크기별 계층**을 먼저 정해야 한다.

## 2) 구현 전략

세 덩어리로 나누고 **위험도 낮은 것부터** 처리한다. ①②는 시각 변화가 없고 ③만 디자인 판단이 필요하다.

| 덩어리 | 규모 | 자동화 | 시각 변화 |
|---|---|---|---|
| ① 상수가 있는데 생값 사용 | 136곳 | 가능 | **없음** (값 동일) |
| ② pill 표현 4가지 | 178곳 | 반자동 | 없음 |
| ③ 카드 radius 5종 | 191곳 | 불가 | **있음** |

③ 착수 전에 계층을 확정하고, 확정 전까지는 ①②만 머지해도 된다.

## 3) 작업 태스크 (작게 분할)

### Task 1 — 상수가 이미 있는 생값 치환 (136곳)

값이 완전히 동일하므로 픽셀 변화가 없다.

| 생값 | 대상 상수 | 곳 |
|---|---|---|
| `normalize(12)` | `INPUT_RADIUS` | 86 |
| `normalize(16)` | `CARD_RADIUS` | 37 |
| `normalize(24)` | `BOTTOM_SHEET_RADIUS` | 7 |
| `normalize(6)` | `BADGE_RADIUS` | 6 |

- ⚠️ **`normalize(8)` 29곳은 치환하지 말 것.** `WHEEL_SELECTION_RADIUS`와 값은 같지만
  용도가 다르다(휠 선택 영역 전용). 실제로는 아이콘 타일 등에 쓰이고 있어 Task 3에서
  새 상수(`TILE_RADIUS`)로 분리한다.
- 검증: `npx tsc --noEmit`, `git diff`에 숫자 변화가 없는지 확인

### Task 2 — pill 표현 통일 (178곳)

같은 결과를 4가지 방법으로 만들고 있다.

| 방식 | 곳 | 문제 |
|---|---|---|
| `BUTTON_RADIUS` (고정 26) | 99 | **버튼 높이에 연동되지 않음** |
| `rounded-full` | 58 | 정상 |
| `normalize(9999)` / `normalize(999)` | 15 | 매직넘버 |
| `높이 / 2` 계산식 | 6 | 정상이나 반복 |

CLAUDE.md는 pill을 "높이의 50%"로 정의하는데 `BUTTON_RADIUS`는 고정값이다. 현재 버튼 높이가
52라 26이 맞아떨어질 뿐, 높이를 바꾸면 pill이 깨진다.

- `BUTTON_RADIUS`를 `BUTTON_HEIGHT / 2` 파생으로 변경 (현재 값과 동일 → 무변화)
- `normalize(9999)` / `normalize(999)` 15곳 → `rounded-full` 또는 `BUTTON_RADIUS`
- className과 style 중 어느 쪽을 관례로 할지 결정해 문서화

### Task 3 — 카드 radius 계층 확정 및 적용 (191곳)

```
12px : 86곳     14px : 40곳     16px : 37곳     18px : 12곳     20px : 16곳
```

`CARD_RADIUS`는 16인데 **실제 최빈값은 12**다. 한 화면 안에 섞인 곳도 있다
(스팟 상세 편의정보: 칩 14 / 이용시간 16 / 문의 카드 16).

**제안 계층** — 확정 전 디자이너 확인 필요

| 단계 | 값 | 용도 | 현재 해당 |
|---|---|---|---|
| XS | 4~6 | 배지, 인디케이터 | 56곳 |
| SM | 8~11 | 아이콘 타일 28~40px | 87곳 |
| MD | 12 | 인풋, 작은 카드 | 86곳 |
| LG | 16 | 콘텐츠 카드 | 37곳 |
| XL | 20~24 | 바텀시트, 큰 패널 | 23곳 |
| FULL | — | pill | 178곳 |

**미결 판단**: `14px`(40곳)를 MD(12)로 내릴지 LG(16)로 올릴지. 시뮬레이터에서 눈으로 봐야 한다.

- 계층 확정 후 `layout.ts`에 상수 추가 (`TILE_RADIUS` 등)
- 요소 크기를 보며 하나씩 배정 — **일괄 sed 금지**

## 4) 검증 체크포인트

- [ ] Task 1·2 후 `git diff`에 실제 픽셀 값 변화가 없는지 (상수 치환뿐이어야 함)
- [ ] `npx tsc --noEmit` / `npx eslint` 통과
- [ ] `npx tailwindcss -i global.css -o /tmp/probe.css` 후 `rounded-*` 클래스 생성 확인
- [ ] Task 3 후 시뮬레이터 확인: 스팟 상세, MY 탭, 커뮤니티 피드, 여행 계획, 바텀시트류
- [ ] 한 화면 안에 서로 다른 radius의 같은 역할 요소가 없는지

## 5) 롤백 계획

Task 단위로 커밋을 분리한다. Task 1·2는 값 무변화라 롤백 사유가 거의 없고,
Task 3만 시각 변화가 있으므로 별도 커밋으로 두어 되돌리기 쉽게 한다.

## 6) PR 구성

- Task 1·2를 한 PR (무변화, 리뷰 가벼움)
- Task 3을 별도 PR (스크린샷 첨부 필수)

## 참고

- `docs/guide/dev/design-tokens.md` — 색·테두리·그림자·폰트 토큰
- `docs/guide/dev/device-support.md` — `layout.ts` 상수 목록
- `src/components/ui/common/common.css` — 목업의 `--radius-*` 토큰 (`btn 26` / `card 16` / `input 12`)
  → 계층 확정 시 이 값과 대조할 것. 선행 브랜치에서 웜그레이 팔레트를 목업 대조로 판정한 전례가 있다.
