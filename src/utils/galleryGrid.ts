const COLUMNS = 3;

export interface GalleryGridCell<T> {
  item: T;
  row: number;
  col: number;
  span: 1 | 2;
}

/**
 * 3열 그리드에 "인기" 항목만 2x2로 배치한다 (CSS grid-auto-flow: dense의 축소판).
 * 인기 항목이 마지막 열(2번 인덱스)에 걸리면 2x2가 안 들어가므로 다음 행으로 밀고,
 * 그때 비는 칸 1개는 뒤따르는 일반 항목을 한 칸 당겨와 채운다 — 그 외엔 원래 순서를 그대로 유지한다.
 */
export function layoutGalleryGrid<T>(items: T[], isPopular: (item: T) => boolean): GalleryGridCell<T>[] {
  const queue = [...items];
  const cells: GalleryGridCell<T>[] = [];
  const occupied = new Set<string>();
  let row = 0;
  let col = 0;

  const key = (r: number, c: number) => `${r},${c}`;
  const advance = () => {
    col += 1;
    if (col >= COLUMNS) {
      col = 0;
      row += 1;
    }
    while (occupied.has(key(row, col))) {
      col += 1;
      if (col >= COLUMNS) {
        col = 0;
        row += 1;
      }
    }
  };
  const placeWideAt = (item: T) => {
    cells.push({ item, row, col, span: 2 });
    occupied.add(key(row, col + 1));
    occupied.add(key(row + 1, col));
    occupied.add(key(row + 1, col + 1));
    advance();
  };

  while (queue.length > 0) {
    const item = queue.shift() as T;

    if (!isPopular(item)) {
      cells.push({ item, row, col, span: 1 });
      advance();
      continue;
    }

    if (col < COLUMNS - 1) {
      placeWideAt(item);
      continue;
    }

    // 마지막 열엔 2x2가 안 들어감 — 뒤따르는 일반 항목을 당겨와 이 칸부터 먼저 채운다.
    const fillerIndex = queue.findIndex((next) => !isPopular(next));
    if (fillerIndex !== -1) {
      const [filler] = queue.splice(fillerIndex, 1);
      cells.push({ item: filler, row, col, span: 1 });
    }
    row += 1;
    col = 0;
    while (occupied.has(key(row, col))) advance();
    placeWideAt(item);
  }

  return cells;
}
