const COLUMNS = 3;

export interface GalleryGridCell<T> {
  item: T;
  row: number;
  col: number;
  span: 1 | 2;
}

/**
 * 3열 그리드에 "인기" 항목만 2x2로 배치한다 (CSS `grid-auto-flow: row dense`의 축소판).
 *
 * 항목마다 "차지할 칸이 전부 비어 있는 가장 이른 자리"를 찾아 넣는다. 커서를 들고
 * 앞으로만 나아가는 방식으로는 2x2가 예약해 둔 칸과 겹치거나, 마지막 열에서 오른쪽으로
 * 삐져나가는 배치가 나온다 — 실제로 그렇게 깨졌다.
 *
 * dense 규칙대로 앞선 행에 빈칸이 남아 있으면 뒤 항목이 당겨와 채운다. 그래서 원래 순서와
 * 화면 순서가 완전히 같지는 않다(CSS도 마찬가지다).
 */
export function layoutGalleryGrid<T>(items: T[], isPopular: (item: T) => boolean): GalleryGridCell<T>[] {
  const occupied = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;

  /** (row, col)부터 span×span 칸이 격자 안에 있고 전부 비었는지. */
  const fits = (row: number, col: number, span: number) => {
    if (col + span > COLUMNS) return false;
    for (let r = row; r < row + span; r += 1) {
      for (let c = col; c < col + span; c += 1) {
        if (occupied.has(key(r, c))) return false;
      }
    }
    return true;
  };

  /** 위에서부터 훑어 처음 들어가는 자리. 행 수에 상한이 없어 반드시 찾는다. */
  const findSlot = (span: number) => {
    for (let row = 0; ; row += 1) {
      for (let col = 0; col + span <= COLUMNS; col += 1) {
        if (fits(row, col, span)) return { row, col };
      }
    }
  };

  const cells: GalleryGridCell<T>[] = [];
  for (const item of items) {
    const span: 1 | 2 = isPopular(item) ? 2 : 1;
    const { row, col } = findSlot(span);
    for (let r = row; r < row + span; r += 1) {
      for (let c = col; c < col + span; c += 1) {
        occupied.add(key(r, c));
      }
    }
    cells.push({ item, row, col, span });
  }
  return cells;
}

// ponytail: dev 전용 self-check — 겹침·격자 밖 배치를 막는다 (프로덕션 no-op)
if (__DEV__) {
  const check = (popularAt: number[], count: number) => {
    const items = Array.from({ length: count }, (_, i) => i);
    const cells = layoutGalleryGrid(items, (i) => popularAt.includes(i));
    const seen = new Set<string>();
    let ok = cells.length === count;
    for (const { row, col, span } of cells) {
      if (col + span > COLUMNS) ok = false; // 오른쪽으로 삐져나감
      for (let r = row; r < row + span; r += 1) {
        for (let c = col; c < col + span; c += 1) {
          if (seen.has(`${r},${c}`)) ok = false; // 겹침
          seen.add(`${r},${c}`);
        }
      }
    }
    return ok;
  };
  // 마지막 열에서 시작하는 2x2가 격자를 벗어나던 회귀를 막는다.
  console.assert(check([2], 6), '마지막 열 인기 항목 배치 오류');
  console.assert(check([0, 2], 4), '인기 항목 2개 배치 오류 (실제로 깨졌던 조합)');
  console.assert(check([0, 1, 2, 3], 8), '연속 인기 항목 배치 오류');
  console.assert(check([], 7), '인기 없는 배치 오류');
  console.assert(check([0], 1), '인기 항목 하나만 있는 배치 오류');
}
