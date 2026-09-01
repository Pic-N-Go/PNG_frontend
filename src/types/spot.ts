import type { ExifConsentStatus } from '@/types/photo';

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
  address: string | null;
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
  /** 카메라·렌즈·ISO·노출 등 기술 EXIF 추출 동의. 생성 시 필수. */
  technicalExifConsent: ExifConsentStatus;
  /** GPS 위도·경도 및 촬영 주소 추출 동의. 생성 시 필수. */
  locationExifConsent: ExifConsentStatus;
}

/** PUT /reviews/{id}. 생성 시 결정한 EXIF 동의 상태는 수정하지 않는다. */
export type ReviewUpdateRequest = Omit<
  ReviewCreateRequest,
  'technicalExifConsent' | 'locationExifConsent'
>;

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
  reviewAverage: number;
  isBookmarked: boolean;
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

/**
 * `GET /users/me/reviewed-spots` — PIC MAP의 리뷰 핀. 내가 리뷰를 남긴 스팟이다.
 *
 * MyReviewDTO와 별개인 이유: 지도는 핀을 한 번에 다 받아야 해 페이징이 없고,
 * 리뷰 본문·태그·사진을 쓰지 않는다. 특히 photos는 presigned URL이라 사진 수만큼
 * 서버 서명이 헛돌고 URL 하나가 700~1000자다.
 */
export interface ReviewedSpotResponse {
  spotId: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  /** 서버가 thumbnailUrl → imageUrl 순으로 채운다. 빈 문자열은 서버에서 null로 걸러져 온다. */
  imageUrl: string | null;
  /** 리뷰 작성 시각. 사용자가 입력한 방문일(visitedAt)이 아니다 — 지도는 리뷰 기준으로 표기한다. */
  reviewedAt: string;
  /** 내가 준 별점 1~5. 스팟의 photogenicScore가 아니다. */
  rating: number;
  /** SpotCategory enum 이름. 라벨은 프론트가 갖는다. 비어 있으면 서버가 ["ETC"]로 채운다. */
  categories: string[];
}

/**
 * PIC MAP의 핀 하나. 리뷰 핀(ReviewedSpotResponse)과 즐겨찾기 핀(SpotResponse)을
 * spotId 기준으로 합친 결과라, 한 핀이 두 속성을 동시에 가질 수 있다.
 */
export interface MapSpot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** "부산 수영구" 형태의 축약 지역명 */
  loc: string;
  photo: string | null;
  reviewed: boolean;
  bookmarked: boolean;
  /** 리뷰 작성일 "YYYY.MM.DD". 즐겨찾기만 한 스팟은 리뷰가 없어 null이다. */
  date: string | null;
  /** 내가 준 별점 1~5. 즐겨찾기만 한 스팟은 null이다. */
  rating: number | null;
  /**
   * 표시용 한글 라벨, 최대 2개. 서버가 주는 enum 코드를 SPOT_CATEGORY_MAP으로 바꾼 값이다.
   * ETC는 제외한다 — 라벨이 "기타"라 칩으로 달 의미가 없다(constants/spotCategories.ts 주석).
   */
  categories: string[];
}

export interface PageSpotResponse {
  content: SpotResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
}
