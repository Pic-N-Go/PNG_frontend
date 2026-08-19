export type SpotBadge = 'HOT' | 'NEW';

// 홈 스팟 카드 표시 모델.
// badge·gradientColors는 서버(SpotResponse)가 주지 않는 값이라 optional —
// badge는 목업 전용(HOT/NEW)이고, gradientColors는 사진이 없을 때만 쓰는 폴백이다.
export interface SpotItem {
  id: string;
  name: string;
  location: string;
  category: string;
  rating: number;
  // 카드에 포토제닉 지수를 쓰지 않는다 — 그건 상세에서 날씨·대기질로 매번 계산하는 값이고,
  // spot.photogenicScore(고정 컬럼)를 카드에 띄우면 96 보고 들어가 35를 만나게 된다.
  reviewCount: number;
  badge?: SpotBadge;
  isBookmarked: boolean;
  imageUrl?: string | null;
  gradientColors?: [string, string, string];
}

export interface NearbySpotResponse {
  id: number;
  name: string;
  address: string;
  categories: string[];
  thumbnailUrl: string | null;
  badge: boolean;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export interface CalendarEvent {
  id: string;
  dateRange: string;
  eventName: string;
  place: string;
  tip: string;
  photoScore: number;
  tag: string;
  headerColor: string;
}

export interface CategoryItem {
  id: string;
  label: string;
}

// ── 스팟 상세 화면 ──────────────────────────────

export type NavigationStatus = 'DIRECT' | 'CORRECTED' | 'UNREACHABLE';

export interface SpotNavigationDTO {
  latitude: number;
  longitude: number;
  name: string;
  status: NavigationStatus;
}

export interface SpotDetailInfo {
  id: string;
  badge: string | null;
  imageUrl: string | null;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  photoCount: number;
  tags: string[];
  categories: string[];
  /** 대표 이미지 없을 때 ETC 폴백 라벨로 쓰는 행정구역 (예: '서울 중구'). address에서 파생, 없으면 null */
  regionLabel: string | null;
  heroPhotoCount: number;
  myReviewId: number | null;
  latitude?: number;
  longitude?: number;
  navigation?: SpotNavigationDTO;
}

export type PhotogenicFactorKey = 'weather' | 'goldenHour' | 'dust' | 'ozone' | 'season';

export interface PhotogenicFactor {
  key: PhotogenicFactorKey;
  label: string;
  value: string;
  score: number;
  valueColor: string;
  iconBg: string;
  iconColor: string;
  barPercent: number;
}

export interface PhotogenicGoldenHour {
  /** 원본 label (예: 골든아워 / 해당 없음 / 데이터 없음) */
  label: string;
  /** 다음 골든아워까지 남은 분. 진행 중이거나 오늘 종료면 null */
  minutesUntilStart: number | null;
  /** 현재/다음 골든아워 시작 시각 HH:mm. 오늘 더 없으면 null */
  startTime: string | null;
  /** minutesUntilStart=null & score=5 → 현재 진행 중 */
  isActive: boolean;
}

export interface PhotogenicScoreData {
  score: number;
  maxScore: number;
  grade: string;
  goldenHour: PhotogenicGoldenHour;
  factors: PhotogenicFactor[];
}

export type FacilityKey = 'parking' | 'wheel' | 'stroller' | 'pet' | 'subway' | 'holiday';
// good: 가능/있음(초록), neutral: 값 있음(없음 등), missing: 미제공(회색), accent: 강조(휴무일 핑크)
export type FacilityStatus = 'good' | 'neutral' | 'missing' | 'accent';

export interface FacilityChipData {
  key: FacilityKey;
  label: string;
  value: string;
  status: FacilityStatus;
}

// 이용시간 파싱 결과 — 이름-시간 행 / 값만 있는 행(범위 등) / 안내(note)
export type ScheduleRow = { name: string; time: string } | { value: string } | { note: string };
export interface ScheduleGroup {
  title: string;
  rows: ScheduleRow[];
}

export interface ConvenienceInfo {
  facilities: FacilityChipData[];
  /** 이용시간 파싱 성공 시 구조화 데이터, 실패 시 null */
  schedule: ScheduleGroup[] | null;
  /** 파싱 실패 시 원문(폴백). schedule·scheduleText 둘 다 null이면 미제공 */
  scheduleText: string | null;
  /** 문의 전화(infocenter 원문). null이면 미제공 */
  phone: string | null;
}

export interface ReviewStarDistribution {
  star: number;
  percent: number;
}

export interface ReviewSummaryData {
  score: number;
  reviewCount: number;
  distribution: ReviewStarDistribution[];
}

export type ReviewSortOption = '최신순' | '별점 높은순' | '별점 낮은순';

export interface Review {
  id: string;
  /** 작성자 id. 로그인 유저와 비교해 수정·삭제 진입점 노출을 판단한다. */
  userId: number;
  name: string;
  avatarInitial: string;
  avatarColor: string;
  /** 프로필 이미지 URL. 없으면 이니셜 아바타로 폴백 */
  avatarUrl?: string;
  rating: number;
  /** 촬영 시간대 라벨(일출/낮/일몰/야간). timePeriod가 null이면 undefined → 배지 미표시 */
  badge?: string;
  /** 수정 폼 프리필용 원본값. badge·date는 표시용으로 가공돼 역산이 불가능하다. */
  timePeriod: TimePeriodApi | null;
  visitedAtISO: string | null;
  date: string;
  text: string;
  /** 수정 폼 프리필용. 카드에는 노출하지 않는다(목업의 리뷰 카드에 태그 행이 없다). */
  tags: ReviewTagApi[];
  /** 리뷰 사진. 없으면 사진 영역을 그리지 않는다. */
  photos?: ReviewPhotoDTO[];
  equipment?: string;
}

export type ChatEntryType = 'message' | 'system' | 'date';

export interface ChatEntry {
  id: string;
  type: ChatEntryType;
  isMe?: boolean;
  senderName?: string;
  avatarInitial?: string;
  avatarColor?: string;
  text?: string;
  time?: string;
  isImage?: boolean;
}

export interface TravelPlanOption {
  id: string;
  name: string;
  meta: string;
  days: string[] | null;
  thumbGradient: [string, string];
}

export type NaviAppId = 'kakao' | 'naver' | 'apple';

// 북마크 컬렉션 (GET /bookmark-collections?spotId=). color/icon은 문자열 키.
export interface BookmarkCollectionDTO {
  id: number;
  name: string;
  color: string;
  icon: string;
  spotCount: number;
  /** 이 스팟이 해당 컬렉션에 이미 속해있는지 */
  contains: boolean;
}

// ── API DTO (서버 응답 원형) ──────────────────────
// 스펙: docs/ai/specs/feature/spot-detail-screen/spot-detail-api.md

/** 촬영 시간대. 백엔드 TimePeriod enum과 1:1 (낮은 DAY가 아니라 DAYTIME) */
export type TimePeriodApi = 'SUNRISE' | 'DAYTIME' | 'SUNSET' | 'NIGHT';

/**
 * 리뷰 태그. 자유 입력이 아니라 고정 9종 — 표기가 갈리면 "자주 쓰인 태그" 집계가 무의미해진다.
 * 한글 라벨은 서버가 주지 않고 프론트가 갖는다(ReviewWriteScreen의 REVIEW_TAGS).
 */
export type ReviewTagApi =
  | 'LIGHTING' | 'BEST_SHOT' | 'MOODY'
  | 'NIGHT_VIEW' | 'SUNRISE'
  | 'EASY_PARKING' | 'TRIPOD_NEEDED' | 'GOOD_ACCESS' | 'GOOD_FOR_SOLO';

/**
 * 리뷰 사진. url은 presigned라 요청마다 서명이 바뀌므로 식별자로 쓸 수 없다.
 * 삭제 대상 지정은 photoId로 한다(DELETE /reviews/{id}/photos/{photoId}).
 */
export interface ReviewPhotoDTO {
  photoId: number;
  url: string;
}

/**
 * GET /reviews/{id}/exif 의 사진별 EXIF. 업로드 시 서버가 추출해 저장한 값이라 이후 바뀌지 않는다.
 * 문자열 필드는 metadata-extractor의 영문 description 그대로 온다(예: meteringMode='Multi-segment')
 * → 표시용 한글 변환은 `mapPhotoExif`가 담당한다.
 * 카톡·인스타를 거친 사진은 EXIF가 제거돼 전 필드 null인 경우가 흔하다.
 */
export interface PhotoExifDTO {
  imageId: number;
  cameraModel: string | null;
  lensModel: string | null;
  iso: number | null;
  fNumber: string | null;
  exposureTime: string | null;
  focalLength: string | null;
  exposureMode: string | null;
  meteringMode: string | null;
  whiteBalance: string | null;
  flash: string | null;
  focalLength35mm: string | null;
  software: string | null;
  latitude: number | null;
  longitude: number | null;
  fileSize: number | null;
  fileFormat: string | null;
  fileName: string | null;
}

export interface ReviewExifResponse {
  reviewId: number;
  images: PhotoExifDTO[];
}

export type ReviewSortApi = 'LATEST' | 'RATING_HIGH' | 'RATING_LOW';

// 실데이터상 각 필드는 null·빈문자열·HTML(usetime)이 섞여 옴 → 전부 nullable
export interface ConvenienceDTO {
  parking: string | null;
  wheelchairAccess: string | null;
  strollerAccess: string | null;
  petFriendly: string | null;
  subwayAccess: string | null;
  usetime: string | null;
  restdate: string | null;
  infocenter: string | null;
}

export interface SpotDetailResponse {
  id: number;
  name: string;
  address: string;
  badge: boolean;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  navigation?: SpotNavigationDTO;
  categories: string[];
  overview: string;
  tags: string[];
  convenience: ConvenienceDTO;
  stats: { avgRating: number; reviewCount: number; photoCount: number };
  isBookmarked: boolean;
  /** 로그인 유저가 이 스팟에 쓴 리뷰 id. 없으면 null — 작성/수정 분기에 쓴다. */
  myReviewId: number | null;
}

// GET /spots/{id}/photos — TourAPI 사진만 포함 (유저 업로드 제외), stats.photoCount보다 적을 수 있음
export interface SpotPhotoDTO {
  originUrl: string;
  thumbnailUrl: string | null;
  imgName: string | null;
}

export interface SpotPhotosResponse {
  spotId: number;
  photos: SpotPhotoDTO[];
}

export interface ReviewDTO {
  id: number;
  userId: number;
  nickname: string;
  /** 소셜 로그인 프로필 이미지. LOCAL 가입·이미지 미동의 유저는 null */
  profileImageUrl: string | null;
  rating: number;
  /** 백엔드 필드명은 timePeriod (timeSlot 아님) */
  timePeriod: TimePeriodApi | null;
  content: string;
  equipmentInfo: string | null;
  tags: ReviewTagApi[];
  photos: ReviewPhotoDTO[];
  visitedAt: string | null;
  createdAt: string;
}

/**
 * POST /spots/{id}/reviews 의 `request` 파트 본문.
 * 서버 검증: rating 1~5, content 20~500자, timePeriod·visitedAt 필수, equipmentInfo 최대 5개(", "로 합쳐 저장).
 * tags는 최대 5개(중복은 서버가 Set으로 제거). null과 [] 모두 "태그 없음"이지만
 * 항상 배열을 보내 요청 모양을 하나로 고정한다. 응답은 계약상 항상 [] 이상이다.
 */
export interface ReviewCreateRequest {
  rating: number;
  content: string;
  timePeriod: TimePeriodApi;
  tags: ReviewTagApi[];
  equipmentInfo?: string[];
  visitedAt: string; // yyyy-MM-dd
}

/** POST/PUT 응답. 목록의 ReviewDTO와 달리 nickname이 없다. */
export interface ReviewResponseDTO {
  id: number;
  userId: number;
  rating: number;
  content: string;
  equipmentInfo: string | null;
  timePeriod: TimePeriodApi | null;
  tags: ReviewTagApi[];
  photos: ReviewPhotoDTO[];
  visitedAt: string | null;
  createdAt: string;
}

/**
 * GET /users/me/reviews 의 항목. 스팟별 리뷰(ReviewDTO)와 필드가 다르다 —
 * `id`가 아니라 `reviewId`이고, 내 리뷰라 userId·nickname·profileImageUrl이 없다.
 * 스펙: ~/Desktop/리뷰-API-응답-스펙.md
 */
export interface MyReviewDTO {
  reviewId: number;
  spotId: number;
  spotName: string;
  /** 서버가 thumbnailUrl → imageUrl 순으로 채운다. 화면에서 쓰지 않아 매핑하지 않는다(목업에 스팟 썸네일이 없다). */
  spotImageUrl: string | null;
  rating: number;
  content: string;
  /** 서버에서 ", "로 조인된 단일 문자열 (배열 아님) */
  equipmentInfo: string | null;
  timePeriod: TimePeriodApi | null;
  tags: ReviewTagApi[];
  /** presigned URL. 만료가 있어(환경 설정값, 로컬 60분) 캐싱·영구 저장하지 않는다 */
  photos: ReviewPhotoDTO[];
  visitedAt: string | null;
  createdAt: string;
}

export interface MyReviewListResponse {
  content: MyReviewDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
}

/** 내 리뷰 카드 뷰모델. 스팟명이 제목이라 Review와 형태가 다르다. */
export interface MyReview {
  reviewId: number;
  spotId: number;
  spotName: string;
  rating: number;
  /** 시간대 라벨(일출/낮/일몰/야간). null이면 배지 미표시 */
  badge?: string;
  /** 수정 폼 프리필용 원본값. badge·date는 표시용으로 가공돼 역산이 불가능하다. */
  timePeriod: TimePeriodApi | null;
  visitedAtISO: string | null;
  date: string;
  text: string;
  /** 수정 폼 프리필용. 카드에는 노출하지 않는다(목업의 리뷰 카드에 태그 행이 없다). */
  tags: ReviewTagApi[];
  photos: ReviewPhotoDTO[];
  equipment?: string;
}

export interface ReviewListResponse {
  summary: {
    avgRating: number;
    totalCount: number;
    distribution: Record<string, number>; // "1"~"5" → 개수
  };
  reviews: {
    content: ReviewDTO[];
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface PhotogenicFactorDTO {
  label: string;
  score: number;
}

export interface PhotogenicGoldenHourDTO extends PhotogenicFactorDTO {
  minutesUntilStart: number | null;
  startTime: string | null;
}

export interface PhotogenicScoreResponse {
  score: number;
  grade: string;
  weather: PhotogenicFactorDTO;
  fineDust: PhotogenicFactorDTO;
  ozone: PhotogenicFactorDTO;
  season: PhotogenicFactorDTO;
  goldenHour: PhotogenicGoldenHourDTO;
}

export interface SpotMapResponse {
  id: number;
  name: string;
  categories: string[];
  latitude: number;
  longitude: number;
  thumbnailUrl: string | null;
  photogenicScore: number;
  badge: boolean;
}

export interface SpotSummaryResponse {
  id: number;
  name: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  thumbnailUrl: string | null;
  photogenicScore: number;
  reviewAverage: number;
  bookmarkCount: number;
  badge: boolean;
}

// 백엔드 SpotResponse DTO — /spots 목록·검색·인기 응답 아이템
// zipcode·overview·source: 응답에서 누락되기도 하고 null로 오기도 해 optional + nullable 둘 다 받는다
/** `GET /spots/recommended` — 목록·검색 응답보다 항목이 적다(점수·리뷰 평균 없음) */
export interface RecommendedSpotResponse {
  id: number;
  name: string;
  address: string;
  categories: string[];
  thumbnailUrl: string | null;
  badge: boolean | null;
  latitude: number;
  longitude: number;
  reviewCount: number;
  bookmarkCount: number;
}

export interface SpotResponse {
  id: number;
  name: string;
  address: string;
  zipcode?: string | null;
  overview?: string | null;
  latitude: number;
  longitude: number;
  categories: string[];
  source?: string | null;
  badge: boolean;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  bookmarkCount: number;
  reviewCount: number;
  photogenicScore: number;
  /** 리뷰가 없는 스팟은 서버 AVG()가 null로 떨어진다. 표시 전에 반드시 null을 걸러야 한다. */
  reviewAverage: number | null;
  /**
   * 이 스팟이 내 북마크 컬렉션 중 하나 이상에 담겨 있는지. 유저별 값이라 토큰을 보내야 채워지고,
   * 비로그인 조회는 서버가 항상 false로 내려준다. 구버전 서버 호환을 위해 optional.
   */
  isBookmarked?: boolean;
}

export interface PageSpotResponse {
  content: SpotResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
}
