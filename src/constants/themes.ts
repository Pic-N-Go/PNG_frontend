// 백엔드 SpotCategory enum과 매핑되는 항목만 노출 (커플/드론/비오는날/필름은 enum에 대응값 없어 제외)
export const THEME_CATEGORY_MAP = {
  야경: 'NIGHT_VIEW',
  바다: 'BEACH',
  한옥: 'HANOK',
  꽃: 'FLOWER',
  카페: 'CAFE',
  인물: 'PORTRAIT',
  축제: 'FESTIVAL',
  반려동물: 'PET',
  '일출/일몰': 'SUNRISE_SUNSET',
  은하수: 'MILKY_WAY',
} as const;

export const THEMES = Object.keys(THEME_CATEGORY_MAP) as (keyof typeof THEME_CATEGORY_MAP)[];
