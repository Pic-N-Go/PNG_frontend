# 구현 계획 — 화면 헤더(ScreenHeader) 공용화

> 선행 브랜치: `refactor/design-token-unification`
> 같은 폴더의 `border-radius-plan.md` · `font-scale-plan.md`와 독립적으로 진행 가능하다.
> 다만 radius와는 둘 다 시각 변화가 커서 동시 진행은 권하지 않는다.

## 1) 입력 스펙

뒤로가기 버튼이 있는 화면이 **32개**인데 공용 컴포넌트가 없어 전부 각자 구현돼 있다.
아이콘 라이브러리부터 크기·색·굵기·터치 영역·좌우 패딩·구분선 유무까지 갈린다.

**토큰 문제가 아니라 컴포넌트 부재 문제다.** 색을 통일해도 위치·구조는 그대로 갈린다.

### 대표 3화면 비교

| | 스팟 상세 | 출사 상세 | 게시글 상세 |
|---|---|---|---|
| 아이콘 | `IconChevronLeft` (tabler) | `IconChevronLeft` (tabler) | `ChevronLeft` (**lucide**) |
| 크기 | `normalize(20)` | `20` (**normalize 없음**) | `normalize(24)` |
| 색 | `#000` | `rgba(0,0,0,0.6)` | `#000` |
| strokeWidth | `2` | 기본값 | `1.8` |
| 버튼 배경 | 없음 | `bg-black/5` 원형 | 없음 |
| 터치 영역 | `36×36` | `32×32` | `32×32` |
| 좌우 패딩 | `12` | `14` (`px-3.5`) | `20` |
| 헤더 높이 | 없음 (히어로 오버레이) | `HEADER_HEIGHT` | `HEADER_HEIGHT` |
| 하단 구분선 | 없음 | 있음 | 있음 |
| 타이틀 | 없음 | 좌측 2줄(제목+날짜) | 좌측 `게시글` |
| 우측 액션 | 알림 벨 | 없음 | 더보기 |

### 전수 현황 (32개 화면)

- **아이콘 라이브러리**: tabler 24 / lucide 8 — 혼용
- **크기**: `normalize(14/18/20/22/24)` + raw `20` / `24`
- **색 9종**: `#000` `#111` `#111111` `#fff` `#37352F` `rgba(0,0,0,0.5)` `0.6` `0.65` `0.7` `0.8` + 지역 상수(`INK` `TEXT` `ICON_STRONG`)
- **strokeWidth**: `1.5` `1.75` `1.8` `2` `2.2` + 미지정

> `docs/guide/dev/ui-publishing.md`에 화면 헤더 규격이 없다. 목업 HTML에도 공통 `.nav` 클래스가
> 없어 화면마다 각자 만든 결과다. **규격 부재가 근본 원인**이므로 컴포넌트와 함께 문서화가 필요하다.

## 2) 구현 전략

**규격 확정 → 컴포넌트 도입 → 화면별 교체** 순서. 규격 없이 컴포넌트부터 만들면 슬롯이 계속 늘어난다.

교체는 자동화가 불가능하다. 헤더마다 타이틀 유무·우측 액션·오버레이 여부·SafeArea 처리가 달라
하나씩 봐야 한다. 32개를 한 PR에 넣지 말고 스택 단위로 쪼갠다.

## 3) 작업 태스크 (작게 분할)

### Task 1 — 헤더 규격 확정 (코드 변경 없음)

디자이너와 확정할 항목은 셋뿐이다.

1. **아이콘 라이브러리** — tabler(24곳 다수) vs lucide(8곳)
   > CLAUDE.md는 둘 다 허용하되 "한 컴포넌트/섹션 안에서는 한 세트"를 요구한다.
   > 헤더는 전 화면 공통 요소이므로 하나로 고정해야 한다.
2. **크기·색·strokeWidth** — 현재 최빈값은 `normalize(24)` / `#000` / `2`
3. **좌우 패딩** — `CONTENT_PADDING`(28)인지 별도값인지. 현재 12/14/20 혼재

부수 결정: 버튼 배경(원형 `bg-black/5`)을 표준으로 할지, 평문 아이콘으로 할지.
현재는 출사 상세만 원형 배경이다.

### Task 2 — `ScreenHeader` 컴포넌트 신규

`src/components/common/ScreenHeader.tsx`

```tsx
interface Props {
  title?: string;              // 없으면 타이틀 없는 형태
  subtitle?: string;           // 출사 상세처럼 2줄이 필요한 경우
  right?: React.ReactNode;     // 우측 액션 슬롯 (더보기, 알림 벨 등)
  variant?: 'solid' | 'overlay';  // overlay = 히어로 이미지 위 (스팟 상세)
  onBack?: () => void;         // 기본값 navigation.goBack()
  divider?: boolean;           // 하단 hairline. solid 기본 true
}
```

- 높이 `HEADER_HEIGHT`, 구분선 `HAIRLINE_WIDTH` + `HAIRLINE` (기존 토큰 재사용)
- SafeArea `edges={['top']}` 처리를 컴포넌트 안으로 흡수
- `overlay` variant는 배경 투명 + 아이콘 흰색 (히어로 위)

### Task 3 — 화면 교체 (스택별로 분할)

한 PR에 몰지 말고 스택 단위로 나눈다. 각 스택마다 스크린샷으로 확인.

| 묶음 | 화면 수 | 비고 |
|---|---|---|
| mypage | 13 | 가장 많고 형태가 단순해 먼저 하기 좋음 |
| community | 6 | lucide 사용처가 몰려 있음 |
| travel / wishlist | 5 | 출사 상세는 2줄 타이틀 |
| spot / search / home / admin | 8 | 스팟 상세는 `overlay` variant |

### Task 4 — 문서화

`docs/guide/dev/design-tokens.md`에 헤더 규격 절 추가, 또는 별도 컴포넌트 가이드.
`ui-publishing.md`에도 목업 기준 헤더 규격이 없으므로 함께 보완.

## 4) 검증 체크포인트

- [ ] `npx tsc --noEmit` / `npx eslint` 통과
- [ ] 스택별 교체 후 스크린샷 — 특히 **SafeArea 이중 적용**(컴포넌트와 화면 양쪽에서 `insets.top`) 확인
- [ ] 히어로 오버레이형(스팟 상세)에서 아이콘이 이미지에 묻히지 않는지
- [ ] 뒤로가기 동작이 모든 화면에서 유지되는지 — 일부 화면은 `goBack()` 외에 커스텀 로직이 있다
      (`PostDetailScreen`은 삭제 토스트 후 `goBack`)
- [ ] 우측 액션이 있는 화면에서 타이틀이 밀리지 않는지

## 5) 롤백 계획

Task 3을 스택 단위 커밋으로 분리한다. 문제가 생긴 스택만 되돌릴 수 있다.
`ScreenHeader` 자체(Task 2)는 추가만 하므로 롤백 사유가 없다.

## 6) PR 구성

- Task 2 + mypage 교체를 첫 PR (컴포넌트 검증 겸)
- 이후 스택별 PR

## 함께 처리할 작은 것

헤더는 아니지만 같은 성격(화면 간 표현 불일치)이라 여기 적어둔다.

- **MY 탭 섹션 헤더 우측 버튼** — `PIC MAP`/`지난 촬영`/`출사 알림 스팟`은 평문인데
  `내 장비`만 핑크 틴트 pill이었다. 선행 브랜치에서 평문으로 통일 완료.
- 다른 섹션 헤더에도 같은 편차가 있는지 커뮤니티·여행 탭에서 확인 필요.

## 참고

- `docs/guide/dev/design-tokens.md` — `HAIRLINE` `HAIRLINE_WIDTH` 등 기존 토큰
- `docs/guide/dev/ui-publishing.md` — 목업 구조 (헤더 규격은 **없음**, 이번에 보완 대상)
- `src/constants/layout.ts` — `HEADER_HEIGHT`(52), `CONTENT_PADDING`(28)
