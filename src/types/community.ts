import { PhotoExifData } from '@/types/photo';

export interface PostAuthor {
  id: string;
  handle: string;
  /** 서버 프로필 사진. 없으면 Avatar가 id·닉네임으로 폴백을 그린다. */
  profileImageUrl?: string | null;
}

export interface PostShotMeta {
  time: string;
  weather: string;
  weatherIcon: string;
  gear: string;
}

export interface Post {
  id: string;
  author: PostAuthor;
  /** 내가 쓴 글이면 팔로우 버튼 미노출, 상세의 액션시트가 내글용으로 분기 */
  isMine: boolean;
  photoGradient: [string, string, string];
  /** 서버 게시 사진. 비면 photoGradient로 대체한다(목데이터 호환). */
  imageUrls: string[];
  caption: string;
  location: string;
  createdAtLabel: string;
  likeCount: number;
  isLiked: boolean;
  commentCount: number;
  shareCount: number;
  isBookmarked: boolean;
  bookmarkCount: number;
  isFollowingAuthor: boolean;
  /** 서버 PostResponse에 없는 값 — 연동 후에는 항상 undefined다 (백엔드 추가 시 매퍼에서 채운다) */
  photogenicScore?: number;
  shotMeta?: PostShotMeta;
}

export interface PostDetail extends Post {
  /**
   * 사진별 EXIF. imageUrls와 같은 순서·같은 길이다.
   * 서버가 사진마다 내려주는데 이전에는 첫 장만 썼다.
   */
  exifList: PhotoExifData[];
}

export interface Comment {
  id: string;
  author: Pick<PostAuthor, 'handle'> & { id?: string; profileImageUrl?: string | null };
  text: string;
  createdAtLabel: string;
  /** 내가 쓴 댓글이면 삭제 가능 */
  isMine?: boolean;
  likeCount?: number;
  isLiked?: boolean;
  /** 답글이면 원 댓글 id. 최상위 댓글은 undefined */
  parentId?: string;
  /** 최상위 댓글에 달린 답글 수 — "답글 N개 보기" 노출 조건 */
  replyCount: number;
}

/** 신고 사유는 별도 텍스트 입력 없이 5개 고정 사유 중 선택 */
export type ReportReasonId = 'spam' | 'abuse' | 'copyright' | 'inappropriate' | 'etc';

// ── 서버 DTO (PNG_backend `community` 모듈 · `/posts`, `/users`) ──────────────
// 위쪽 UI 타입과 1:1이 아니다. 변환은 utils/communityMappers.ts에서만 한다.

export type PostSortApi = 'POPULAR' | 'LATEST' | 'FOLLOWING' | 'MY_POSTS';
export type PostWeatherApi = 'CLEAR' | 'PARTLY_CLOUDY' | 'CLOUDY' | 'RAIN' | 'SNOW' | 'NIGHT';

export interface PostAuthorDTO {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
}

export interface PostImageDTO {
  id: number;
  imageUrl: string;
  width: number | null;
  height: number | null;
}

export interface PostResponseDTO {
  id: number;
  content: string;
  spotId: number | null;
  spotName: string | null;
  /** LocalTime 직렬화 — "05:30" 또는 "05:30:00" */
  shootingTime: string | null;
  weather: PostWeatherApi | null;
  cameraModel: string | null;
  lensModel: string | null;
  tags: string[] | null;
  author: PostAuthorDTO;
  images: PostImageDTO[];
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  liked: boolean;
  bookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostPageResponseDTO {
  posts: PostResponseDTO[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  hasNext: boolean;
}

export interface ReactionResponseDTO {
  active: boolean;
  count: number;
}

export interface CommentResponseDTO {
  id: number;
  content: string;
  author: PostAuthorDTO;
  /** 답글이면 원 댓글 id, 최상위 댓글이면 null */
  parentId: number | null;
  /** 최상위 댓글에 달린 답글 수. 답글 자신은 항상 0 */
  replyCount: number;
  likeCount: number;
  /** 토큰을 보냈을 때만 내 기준으로 채워진다(비로그인은 항상 false) */
  liked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentPageResponseDTO {
  comments: CommentResponseDTO[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  hasNext: boolean;
}

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

export interface PostExifResponseDTO {
  postId: number;
  images: PhotoExifDTO[];
}

export interface PostCreateRequestDTO {
  content: string;
  spotId?: number | null;
  shootingTime?: string | null;
  weather?: PostWeatherApi | null;
  cameraModel?: string | null;
  lensModel?: string | null;
  tags?: string[];
}

export interface PostUpdateRequestDTO extends PostCreateRequestDTO {
  /** 수정 시 남길 기존 이미지 id. 배열 순서가 그대로 사진 순서가 된다.
   *  생략(undefined)하면 기존 이미지를 전부 유지한다(PostService.resolveRetainedImages). */
  retainedImageIds?: number[];
}

/** `/users/{id}/profile` — 게시글 수·팔로우 여부는 서버에 없다 */
export interface UserProfileDTO {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  bio: string | null;
  spotCategories: string[];
  followerCount: number;
  followingCount: number;
}

export interface FollowUserDTO {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
}

export interface ContestPhotoEntry {
  id: string;
  rank: number;
  author: Pick<PostAuthor, 'handle'>;
  captionMeta: string;
  gradient: [string, string, string];
  voteCount: number;
  isMyVote?: boolean;
  /** 라이트박스 하단의 이탤릭 인용구. 없으면 캡션 블록 미노출 */
  caption?: string;
}

export interface ContestResultDetail {
  theme: string;
  dateRangeLabel: string;
  participantCount: number;
  podium: ContestPhotoEntry[];
  entries: ContestPhotoEntry[];
}

export type VoteModalMode = 'confirm' | 'cancel';
export type GearSheetKind = 'camera' | 'lens';

export interface ProfilePostItem {
  id: string;
  /** 서버 게시 사진. 없으면 photoGradient로 대체한다 */
  imageUrl?: string;
  photoGradient: [string, string, string];
  likeCount: number;
  contestRank?: number;
}

export interface ProfileContestItem {
  id: string;
  theme: string;
  rank: number;
  voteCount: number;
  gradient: [string, string, string];
  status?: 'active' | 'won' | 'ended';
}

export interface ProfileSpotItem {
  id: string;
  name: string;
  address: string;
  lastVisitLabel: string;
  visitCount: number;
  photoCount: number;
  gradient: [string, string, string];
}

export type ProfileTabKey = 'posts' | 'contests' | 'spots';

// ── 콘테스트 · 월간 주기 최종안 (핸드오프 contest-final-mockup.html + spec/ 11개) ──
// 매달 1~14일 출품 → 15일~말일 투표 → 다음 달 1일 결과 발표(그 달 내내 노출). phase는 서버가 계산한다.
export type ContestPhase = 'SUBMITTING' | 'VOTING' | 'RESULT' | 'ENDED';

/**
 * 출품작 정렬 — API 옵션이 LATEST / VOTES 두 개뿐이라 랜덤은 없다.
 * 투표 기간 기본은 최신순이다. 득표순을 기본으로 두면 상위 작품에 표가 더 몰린다.
 */
export type ContestSortKey = 'latest' | 'votes';

/**
 * 출품 화면으로 넘기는 값. 남은 자리 수를 반드시 함께 넘긴다 —
 * 출품 화면이 자체 기본값(3장)으로 열리면 1인 3장 상한이 무너진다.
 */
export interface ContestSubmitTarget {
  theme: string;
  monthLabel: string;
  remainingSlots: number;
}

export interface ContestInfo {
  monthLabel: string;
  theme: string;
  themeDesc: string;
  submitDeadlineLabel: string;
  /** 투표 마감은 출품 마감과 별개 값이다 — 표시 문자열을 가공해서 만들지 않는다 */
  voteDeadlineLabel: string;
  participantCount: number;
  entryCount: number;
}

/**
 * 출품작 하나. 노출되는 필드는 phase에 따라 다르다 —
 * 출품 기간은 createdAgoLabel만, 투표 기간은 spot·shotAtLabel, 결과 발표 후에만 rank.
 */
export interface ContestEntry {
  id: string;
  author: string;
  spot?: string;
  shotAtLabel?: string;
  createdAgoLabel?: string;
  rank?: number;
  votes: number;
  voted: boolean;
  gradient: [string, string, string];
  caption?: string;
  isMine?: boolean;
}

/** 결과 발표 당일 진행중 탭 상단에 뜨는 지난 달 요약 */
export interface ContestAwardSummary {
  monthLabel: string;
  rank: number;
  theme: string;
  winnerHandle: string;
  voteCount: number;
  /** 1~3위 썸네일 — 목업 .award-row__thumbs처럼 겹쳐 보여준다. 수상작이 3개 미만인 달도 있어 길이는 가변 */
  podiumGradients: [string, string, string][];
}

export interface RankLegendEntry {
  id: string;
  author: string;
  meta: string;
  rank: number;
  gradient: [string, string, string];
  /** 그 날 처음 순위권(1~3위)에 진입했으면 NEW 배지 */
  isNew: boolean;
}

export type RankVariant = 'normal' | 'first' | 'out';

export interface RankSnapshot {
  dateLabel: string;
  /** null = 그 날 순위권(1~3위) 밖(권외) */
  rank: number | null;
}

export interface RankSeries {
  /** 선 끝 썸네일에 채우는 사진 대표색 */
  gradient: [string, string, string];
  /** 선과 썸네일 링의 색 — 순위 서열을 나타내는 고정값(1위 accent, 이하 회색 계열)이라 사진색과 별개다 */
  strokeColor: string;
  /** 1위만 2.4, 나머지 2 */
  strokeWidth: number;
  /**
   * days보다 짧을 수 있다 — 순위권에서 이탈해 더 그릴 값이 없으면 그 지점에서 끝난다.
   * x 좌표는 배열 길이가 아니라 days 인덱스에 맞춘다.
   */
  points: RankSnapshot[];
}

/** 순위 변동 패널 — 매일 자정 1회 집계, 그래프는 최근 7일. variant별로 표시 내용이 다르다. */
export interface RankHistory {
  variant: RankVariant;
  subtitle: string;
  /** 집계 배지 옆 기간 안내 — "투표 시작 8월 15일 · 마감 8월 31일" */
  periodLabel?: string;
  days: string[];
  legend: RankLegendEntry[];
  series: RankSeries[];
}

export interface MyVoteEntry {
  id: string;
  author: string;
  spotLabel: string;
  votedAtLabel: string;
  gradient: [string, string, string];
}

export interface ContestPastMonthItem {
  id: string;
  monthLabel: string;
  theme: string;
  winnerHandle: string;
  meta: string;
  /** 미출품이면 null. 표시용 문자열(myRankLabel)에서 숫자를 파싱하지 않는다 */
  myRank: number | null;
  kind: 'award' | 'plain' | 'none';
  gradient: [string, string, string];
}
