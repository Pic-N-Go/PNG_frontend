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

// 카테고리 한글 라벨은 여기 두지 않는다 — @/constants/spotCategories의 categoryLabel()이
// 유일한 출처다. 예전에 이 파일이 별도 맵을 들고 있어서 같은 코드가 화면마다 다르게 보였다
// (설정 시트는 '문화유산', 마이페이지는 '유적지').

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
