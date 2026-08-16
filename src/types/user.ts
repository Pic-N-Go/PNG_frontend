export type SpotCategory =
  | 'PARK'
  | 'BEACH'
  | 'MOUNTAIN'
  | 'HANOK'
  | 'FOREST'
  | 'HERITAGE'
  | 'CAFE'
  | 'CITY'
  | 'NIGHT_VIEW'
  | 'FESTIVAL'
  | 'FLOWER'
  | 'SUNRISE_SUNSET'
  | 'MILKY_WAY'
  | 'ETC';

export const SPOT_CATEGORY_KOREAN_MAP: Record<string, string> = {
  PARK: '공원',
  BEACH: '바다',
  MOUNTAIN: '산',
  HANOK: '한옥',
  FOREST: '숲',
  HERITAGE: '유적지',
  CAFE: '카페',
  CITY: '도시',
  NIGHT_VIEW: '야경',
  FESTIVAL: '축제',
  FLOWER: '꽃',
  SUNRISE_SUNSET: '일출일몰',
  MILKY_WAY: '은하수',
  ETC: '기타',
};

export function getCategoryKoreanName(category: string): string {
  return SPOT_CATEGORY_KOREAN_MAP[category] || category;
}

export type UserResponse = {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  role: 'USER' | 'ADMIN';
  provider: 'LOCAL' | 'KAKAO';
  spotCategories: string[];
};

export type UserStatsResponse = {
  followerCount: number;
  followingCount: number;
  reviewCount: number;
  visitedSpotCount: number;
};

export type FollowUserResponse = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
};

export type ReviewPhotoResponse = {
  id: number;
  photoUrl: string;
  orderIndex: number;
};

export type MyReviewInfo = {
  reviewId: number;
  spotId: number;
  spotName: string;
  spotImageUrl?: string | null;
  rating: number;
  content: string;
  equipmentInfo?: string | null;
  timePeriod?: 'SUNRISE' | 'DAYTIME' | 'SUNSET' | 'NIGHT' | null;
  tags?: string[];
  photos?: ReviewPhotoResponse[];
  visitedAt?: string | null;
  createdAt: string;
};

export type MyReviewListResponse = {
  content: MyReviewInfo[];
  totalElements: number;
  totalPages: number;
  number: number;
};

export type UserProfileResponse = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  spotCategories: string[];
};

export type UserSpotCategoryUpdateRequest = {
  spotCategories: string[];
};

export type AlbumResponse = {
  id: number;
  name: string;
  category: string;
  isPublic: boolean;
  photoCount: number;
};
