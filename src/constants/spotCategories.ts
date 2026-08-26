// 스팟 카테고리 단일 출처. 백엔드 `SpotCategory` enum(14개)과 1:1로 대응한다.
//
// 이전에는 화면마다 목록을 따로 들고 있어서 같은 값이 다르게 보였다 —
// HERITAGE가 문화유산/유적지/역사·전통, BEACH가 해변/바다로 갈렸고,
// 회원가입에는 공원·산·숲·도심 풍경이 아예 없었으며 홈·마이페이지에는
// 백엔드에 없는 인물·커플·반려동물·드론·비오는날·필름이 섞여 있었다.
// 라벨을 바꿔야 하면 이 파일만 고친다.
import type { ComponentType } from 'react';
import {
  Trees,
  Umbrella,
  Mountain,
  House,
  TreePine,
  Landmark,
  Coffee,
  Building2,
  MoonStar,
  Calendar,
  Flower2,
  Sunset,
  Sparkles,
  MapPin,
  type LucideProps,
} from 'lucide-react-native';

export type CategoryGroup = 'PLACE' | 'SCENE' | 'ETC';

export interface CategoryMeta {
  Icon: ComponentType<LucideProps>;
  label: string;
  group: CategoryGroup;
}

// 장소형(TourAPI cat3 매핑, 신뢰도 높음) · 장면형(name/overview 키워드 추출, 오탐 가능 → 소재형 라벨)
export const SPOT_CATEGORY_MAP: Record<string, CategoryMeta> = {
  CAFE: { Icon: Coffee, label: '감성 카페', group: 'PLACE' },
  FESTIVAL: { Icon: Calendar, label: '축제 · 행사', group: 'SCENE' },
  HERITAGE: { Icon: Landmark, label: '문화 · 전시', group: 'PLACE' },
  BEACH: { Icon: Umbrella, label: '바다 · 해변', group: 'PLACE' },
  FOREST: { Icon: TreePine, label: '숲 · 수목원', group: 'PLACE' },
  HANOK: { Icon: House, label: '고궁 · 한옥', group: 'PLACE' },
  NIGHT_VIEW: { Icon: MoonStar, label: '야경 명소', group: 'SCENE' },
  FLOWER: { Icon: Flower2, label: '꽃 · 벚꽃', group: 'SCENE' },
  PARK: { Icon: Trees, label: '도심 공원', group: 'PLACE' },
  MOUNTAIN: { Icon: Mountain, label: '산 · 계곡', group: 'PLACE' },
  CITY: { Icon: Building2, label: '도시 풍경', group: 'SCENE' },
  SUNRISE_SUNSET: { Icon: Sunset, label: '일출 · 일몰', group: 'SCENE' },
  MILKY_WAY: { Icon: Sparkles, label: '은하수 · 별', group: 'SCENE' },
  // 표시용 라벨만 둔다. 사용자가 고르는 목록에는 넣지 않는다 — "기타"를 관심사로
  // 선택하거나 태그로 다는 건 의미가 없다. 스팟 히어로는 ETC일 때 지역명을 우선 쓴다.
  ETC: { Icon: MapPin, label: '기타', group: 'ETC' },
};

/**
 * 사용자에게 보여줄 카테고리 순서. 관심 테마·게시글 태그·지도/홈 필터가 모두 이 순서를 쓴다.
 * TourAPI 4대 분류와 인기 출사 테마를 우선 배치. ETC는 제외한다.
 */
export const CATEGORY_CODES = [
  'CAFE',
  'FESTIVAL',
  'HERITAGE',
  'BEACH',
  'FOREST',
  'HANOK',
  'NIGHT_VIEW',
  'FLOWER',
  'PARK',
  'MOUNTAIN',
  'CITY',
  'SUNRISE_SUNSET',
  'MILKY_WAY',
] as const;

export type SpotCategoryCode = (typeof CATEGORY_CODES)[number];

/** 표시 순서대로의 한글 라벨 (선택 칩·필터 칩 공용) */
export const CATEGORY_LABELS: string[] = CATEGORY_CODES.map((code) => SPOT_CATEGORY_MAP[code].label);

/** 한글 라벨 → enum 코드. 칩 라벨만 들고 있는 화면이 서버 값으로 되돌릴 때 쓴다. */
export const CODE_BY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORY_CODES.map((code) => [SPOT_CATEGORY_MAP[code].label, code]),
);

/** 미매핑 코드도 화면을 깨뜨리지 않도록 '기타'로 떨어뜨린다. */
export function categoryLabel(code: string | null | undefined): string {
  return (code && SPOT_CATEGORY_MAP[code]?.label) || SPOT_CATEGORY_MAP.ETC.label;
}

const PLACE_ORDER = ['CAFE', 'PARK', 'BEACH', 'MOUNTAIN', 'HANOK', 'FOREST', 'HERITAGE'];

/**
 * 카테고리 배열 → 노출할 항목 1개.
 * 장소형 우선(PLACE_ORDER 순서), 없으면 장면형 배열 첫 번째, 둘 다 없으면 ETC.
 */
export function pickSpotCategory(categories: string[] | undefined | null): string {
  const list = (categories ?? []).filter((c) => SPOT_CATEGORY_MAP[c]);
  const place = PLACE_ORDER.find((code) => list.includes(code));
  if (place) return place;
  const scene = list.find((c) => SPOT_CATEGORY_MAP[c].group === 'SCENE');
  if (scene) return scene;
  return 'ETC';
}

// ponytail: dev 전용 self-check — 카테고리 선택 우선순위 회귀 방지 (프로덕션 no-op)
if (__DEV__) {
  console.assert(pickSpotCategory(['CAFE']) === 'CAFE', 'CAFE 단독 장소형 우선순위 오류');
  console.assert(pickSpotCategory(['MOUNTAIN', 'BEACH']) === 'BEACH', '장소형 내부 우선순위(PLACE_ORDER) 오류');
  console.assert(pickSpotCategory(['CAFE', 'NIGHT_VIEW']) === 'CAFE', '장소형 우선순위 오류');
  console.assert(pickSpotCategory(['UNKNOWN_CODE']) === 'ETC', '미매핑 코드 → ETC 오류');
  console.assert(pickSpotCategory([]) === 'ETC', '빈 배열 → ETC 오류');
  console.assert(pickSpotCategory(undefined) === 'ETC', 'undefined → ETC 오류');
  console.assert(CATEGORY_CODES.length === Object.keys(SPOT_CATEGORY_MAP).length - 1, 'ETC 외 코드가 목록에서 누락됨');
  console.assert(new Set(CATEGORY_LABELS).size === CATEGORY_LABELS.length, '라벨 중복 — CODE_BY_LABEL이 덮어써진다');
  console.assert(categoryLabel('HERITAGE') === '문화 · 전시', 'categoryLabel이 이 파일의 라벨을 그대로 써야 한다');
  console.assert(categoryLabel('UNKNOWN_CODE') === '기타', '모르는 코드는 기타로 떨어져야 한다');
}
