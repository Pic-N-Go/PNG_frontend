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
  bio: string | null;
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
  bio: string | null;
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
  bio: string | null;
  spotCategories: string[];
};

/** `GET /users/search` — Spring Page 형태(스팟 검색과 동일) */
export type UserSearchPageResponse = {
  content: FollowUserResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  last: boolean;
};

/** `PUT /users/me` — 전체 교체다. 한 항목만 보내면 나머지가 비워지므로 항상 세 값을 함께 넘긴다. */
export type UserProfileUpdateRequest = {
  nickname: string;
  profileImageUrl: string | null;
  bio: string | null;
};

/** `PATCH /users/me/password` — 현재 비밀번호를 확인받고 바꾼다. 소셜 계정은 서버가 거부한다. */
export type PasswordChangeRequest = {
  currentPassword: string;
  newPassword: string;
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
