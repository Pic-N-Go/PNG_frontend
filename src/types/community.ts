import { PhotoExifData } from '@/types/photo';

export interface PostAuthor {
  id: string;
  handle: string;
  initials: string;
  avatarGradient: [string, string];
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
  caption: string;
  location: string;
  createdAtLabel: string;
  likeCount: number;
  isLiked: boolean;
  commentCount: number;
  shareCount: number;
  isSaved: boolean;
  isFollowingAuthor: boolean;
  photogenicScore?: number;
  shotMeta?: PostShotMeta;
}

export interface PostDetail extends Post {
  exif: PhotoExifData;
}

export interface Comment {
  id: string;
  author: Pick<PostAuthor, 'handle' | 'initials'>;
  text: string;
  createdAtLabel: string;
  likeCount: number;
  isLiked: boolean;
}

/** 신고 사유는 별도 텍스트 입력 없이 5개 고정 사유 중 선택 */
export type ReportReasonId = 'spam' | 'abuse' | 'copyright' | 'inappropriate' | 'etc';

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

// ── 콘테스트 · 진행중 탭 (핸드오프 "시안 1b", ~/Desktop/handoff 참고) ──
// 낙관적 업데이트(투표 즉시 voted/votes/votesLeft 반영)는 상위(ContestSegment)에서 처리하고
// 이 컴포넌트는 순수 프레젠테이션 — 기존 ContestPhotoEntry(라이트박스용)와는 별도 타입.

export interface ContestGoalInfo {
  title: string;
  subtitle: string;
  label: string;
  daysLeft: number;
  participants: number;
  goal: number;
}

export interface ContestVoteEntry {
  id: string;
  rank: number;
  author: string;
  /** 1위 카드에만 노출되는 위치·시간 캡션 */
  place?: string;
  votes: number;
  voted: boolean;
  gradient: [string, string, string];
}

export interface ContestSubmission {
  hasEntry: boolean;
  entry?: {
    /** 목업 출품작용 대표색. 사용자가 직접 고른 사진은 photoUri를 쓴다(둘 중 하나만 존재). */
    photoGradient?: [string, string, string];
    /** 사용자가 갤러리에서 고른 사진의 로컬 uri. 업로드 연동 전까지는 기기 안에만 있다. */
    photoUri?: string;
    caption: string;
    rank: number;
    voteCount: number;
    totalParticipants: number;
    location: string;
    submittedAgoLabel: string;
    votesToNextRank: number;
  };
}

export interface ContestPastItem {
  id: string;
  theme: string;
  winnerHandle: string;
  voteCount: number;
  agoLabel: string;
  participantCount: number;
  gradient: [string, string, string];
  isMine?: boolean;
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

export interface UserProfileSummary {
  id: string;
  displayName: string;
  handle: string;
  initials: string;
  avatarGradient: [string, string];
  bio: string;
  winCount: number;
  postCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface ProfilePostItem {
  id: string;
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
