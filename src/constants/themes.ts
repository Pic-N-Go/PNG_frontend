// 관심 테마 = 스팟 카테고리와 같은 목록이다. 라벨·순서는 @/constants/spotCategories가 정한다.
// 예전에는 여기에 9개만 따로 적어둬서 공원·산·숲·도심 풍경이 회원가입에서 빠져 있었고,
// HERITAGE 라벨도 스팟 상세(문화유산)와 달랐다.
import { CATEGORY_CODES, CODE_BY_LABEL, CATEGORY_LABELS, SPOT_CATEGORY_MAP } from '@/constants/spotCategories';

/** 한글 라벨 → 백엔드 SpotCategory 코드. 회원가입이 서버로 보낼 때 쓴다. */
export const THEME_CATEGORY_MAP: Record<string, string> = CODE_BY_LABEL;

/** 화면에 뿌릴 순서대로의 한글 라벨. '기타'는 관심사로 고를 값이 아니라 빠져 있다. */
export const THEMES: string[] = CATEGORY_LABELS;

export { CATEGORY_CODES, SPOT_CATEGORY_MAP };
