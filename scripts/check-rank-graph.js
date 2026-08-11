#!/usr/bin/env node
/**
 * 순위 그래프 좌표 검증. 사용법: node scripts/check-rank-graph.js
 *
 * 지원 폭(360~430dp) 전 구간에서 그래프 끝점이 잘리지 않고 "권외" 라벨이 데이터와 겹치지 않는지 본다.
 * SVG를 0~100으로 정규화하면 권외 변형의 좌측 거터를 표현할 수 없고 끝점이 경계에 붙는데,
 * 화면을 띄우지 않으면 드러나지 않아 이 스크립트로 잡는다.
 *
 * 좌표 상수는 **컴포넌트 소스에서 직접 읽는다** — 여기에 복사해두면 컴포넌트만 바뀌었을 때
 * 검사기가 옛 값을 통과시켜 무용지물이 된다.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

/** 소스에서 값을 뽑되, 못 찾으면 조용히 넘어가지 않고 즉시 실패시킨다 */
function extract(src, re, label) {
  const m = src.match(re);
  assert.ok(m, `${label}을(를) 소스에서 찾지 못했습니다 — 코드 구조가 바뀌었다면 이 스크립트도 함께 고치세요`);
  return m;
}

// ── ContestRankPanel에서 좌표계 읽기 ──────────────────────
const panel = read('src/components/community/ContestRankPanel.tsx');
const VIEW_W = Number(extract(panel, /const VIEW_W = (\d+)/, 'VIEW_W')[1]);
const geoSrc = extract(panel, /const GEOMETRY = \{([\s\S]*?)\n\} as const;/, 'GEOMETRY')[1];
const GEOMETRY = {};
for (const m of geoSrc.matchAll(/(\w+):\s*\{\s*height:\s*(\d+),\s*xStart:\s*(\d+),\s*xEnd:\s*(\d+)\s*\}/g)) {
  GEOMETRY[m[1]] = { height: +m[2], xStart: +m[3], xEnd: +m[4] };
}
assert.ok(GEOMETRY.normal && GEOMETRY.out, 'GEOMETRY에 normal/out 변형이 모두 있어야 합니다');
const rankYSrc = extract(panel, /const RANK_Y: Record<number, number> = \{([^}]*)\}/, 'RANK_Y')[1];
const RANK_Y = Object.fromEntries([...rankYSrc.matchAll(/(\d+):\s*(\d+)/g)].map((m) => [+m[1], +m[2]]));
const BAND_Y = Number(extract(panel, /const BAND_Y = (\d+)/, 'BAND_Y')[1]);
const THUMB = Number(extract(panel, /const THUMB = (\d+)/, 'THUMB')[1]);
const RING = Number(extract(panel, /const RING = (\d+)/, 'RING')[1]);

// ── ContestMyEntryTab에서 추이 그래프 좌표 읽기 ───────────
const myTab = read('src/components/community/ContestMyEntryTab.tsx');
const TREND_VIEW_W = Number(extract(myTab, /const TREND_VIEW_W = (\d+)/, 'TREND_VIEW_W')[1]);
const trendSrc = extract(myTab, /const RANK_TREND: \{ x: number; y: number \}\[\] = \[([\s\S]*?)\];/, 'RANK_TREND')[1];
const RANK_TREND = [...trendSrc.matchAll(/\{\s*x:\s*(\d+),\s*y:\s*(\d+)\s*\}/g)].map((m) => ({ x: +m[1], y: +m[2] }));
assert.ok(RANK_TREND.length >= 2, 'RANK_TREND 좌표를 읽지 못했습니다');

// ── 레이아웃 ─────────────────────────────────────────────
const BASE_WIDTH = 390;
const normalize = (size, w) => Math.round(size * (Math.min(Math.max(w, 360), 430) / BASE_WIDTH));
/** 패널: marginHorizontal 28 → paddingHorizontal 14 */
const graphWidth = (w) => w - normalize(28, w) * 2 - normalize(14, w) * 2;
/** 추이 카드: marginHorizontal CONTENT_PADDING(28) → 카드 내부 padding 20 */
const trendWidth = (w) => w - normalize(28, w) * 2 - normalize(20, w) * 2;
/** "권외" 라벨 폭 추정 — 10px 한글 2자 + 자간 */
const outLabelWidth = (w) => Math.round(10 * ((w / BASE_WIDTH - 1) * 0.5 + 1)) * 2 + 2;

const WIDTHS = [360, 390, 430];

for (const w of WIDTHS) {
  const gw = graphWidth(w);

  for (const [variant, geo] of Object.entries(GEOMETRY)) {
    const scaleX = gw / VIEW_W;
    const leftmost = geo.xStart * scaleX;
    const rightmost = geo.xEnd * scaleX;

    // (1) 데이터 좌우 끝이 그래프 박스 안에 있는가
    assert.ok(leftmost >= 0, `${w}dp ${variant}: 좌측 끝 음수 (${leftmost})`);
    assert.ok(rightmost <= gw + 0.01, `${w}dp ${variant}: 우측 끝이 박스 밖 (${rightmost} > ${gw})`);

    // (2) 마지막 점 썸네일 — 우측 끝에 있어 링 바깥쪽 일부는 원래 잘린다(목업도 동일).
    //     링 두께를 넘게 잘리면 원이 눈에 띄게 찌그러지므로 그 선만 지킨다.
    const outer = normalize(THUMB + RING * 2, w);
    const thumbLeft = (geo.xEnd / VIEW_W) * gw - normalize(THUMB / 2 + RING, w);
    assert.ok(thumbLeft >= 0, `${w}dp ${variant}: 썸네일 좌측 잘림`);
    const overflow = thumbLeft + outer - gw;
    assert.ok(overflow <= RING + 2, `${w}dp ${variant}: 썸네일 우측 ${overflow.toFixed(1)}px 잘림 — 링 두께 초과`);

    // (3) 권외 변형: "권외" 라벨(left:0)이 데이터 시작점과 겹치지 않는가.
    //     거터를 20 → 44로 넓힌 이유가 이 자리를 만들기 위해서다.
    if (variant === 'out') {
      const labelRight = outLabelWidth(w);
      const clearance = leftmost - labelRight;
      assert.ok(clearance >= 8, `${w}dp: "권외" 라벨 여백 부족 (${clearance.toFixed(1)}px) — 좌측 거터를 넓히세요`);

      // (4) 3위선과 권외 밴드가 붙어버리지 않는가 (viewBox 높이를 정규화하면 여기가 무너진다)
      const scaleY = normalize(geo.height, w) / geo.height;
      const gap = (BAND_Y - RANK_Y[3]) * scaleY;
      assert.ok(gap >= 30, `${w}dp: 3위-권외 간격 붕괴 (${gap.toFixed(1)}px)`);
    }
  }

  // (5) 내 출품 탭 추이 그래프 — 양 끝 원이 잘리지 않는가 (r=5.5가 최대)
  const tw = trendWidth(w);
  const trendScaleX = tw / TREND_VIEW_W;
  const R_MAX = 5.5;
  const first = RANK_TREND[0];
  const last = RANK_TREND[RANK_TREND.length - 1];
  assert.ok(first.x * trendScaleX - R_MAX * trendScaleX >= 0, `${w}dp trend: 첫 점 잘림 (x=${first.x})`);
  assert.ok(
    last.x * trendScaleX + R_MAX * trendScaleX <= tw + 0.01,
    `${w}dp trend: 마지막 점 잘림 (x=${last.x}, 폭 ${tw.toFixed(1)})`,
  );
}

console.log(`통과 — ${WIDTHS.join('/')}dp 전 구간`);
console.log(`  소스에서 읽음: viewBox ${VIEW_W}×${GEOMETRY.normal.height}/${GEOMETRY.out.height}, ` +
  `거터 ${GEOMETRY.normal.xStart}→${GEOMETRY.out.xStart}, 순위Y ${Object.values(RANK_Y).join('/')}, 밴드 ${BAND_Y}`);
