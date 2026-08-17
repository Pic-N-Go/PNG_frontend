// 커뮤니티 서버 DTO → 화면 뷰모델 변환. API 파일과 화면 사이에서 이 파일만 두 타입을 모두 안다.
// 서버에 없는 값(포토제닉 점수·댓글 좋아요·자기소개)은 여기서 만들어내지 않고 undefined로 둔다 —
// 없는 값을 채우면 화면이 "있는 것처럼" 보이고, 나중에 백엔드가 생겨도 티가 안 난다.
import type {
  Comment,
  CommentResponseDTO,
  PhotoExifDTO,
  Post,
  PostAuthor,
  PostAuthorDTO,
  PostDetail,
  PostExifResponseDTO,
  PostResponseDTO,
  PostShotMeta,
  PostWeatherApi,
} from '@/types/community';
import type { PhotoExifData } from '@/types/photo';

// 사진이 없는 게시글(이론상 서버가 막지만 방어)과 아바타의 대체 색. 목업 팔레트에서 가져온 어두운 톤.
const PHOTO_FALLBACKS: [string, string, string][] = [
  ['#0f2027', '#203a43', '#4a7c8a'],
  ['#1a1530', '#4a1942', '#e8855a'],
  ['#232526', '#8e7b5a', '#8e7b5a'],
  ['#0a1a0f', '#4a8060', '#a8c090'],
  ['#020010', '#1a1545', '#4a4080'],
];

const AVATAR_FALLBACKS: [string, string][] = [
  ['#2c5364', '#4a7c8a'],
  ['#8b4a6b', '#d4856a'],
  ['#3a506b', '#5bc0be'],
  ['#4a1942', '#e8855a'],
  ['#1c2541', '#3a506b'],
];

/** 같은 id면 항상 같은 색이 나오도록 id를 인덱스로 쓴다(랜덤이면 리렌더마다 색이 바뀐다). */
function pick<T>(list: T[], seed: number | string): T {
  const n = typeof seed === 'number' ? seed : [...String(seed)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return list[Math.abs(n) % list.length];
}

/** 닉네임 앞 2글자. 한글은 1글자, 영문은 2글자가 목업과 가장 비슷하다. */
export function initialsOf(nickname: string): string {
  const trimmed = nickname.trim();
  if (!trimmed) return '?';
  const isHangul = /[가-힣]/.test(trimmed[0]);
  return (isHangul ? trimmed.slice(0, 1) : trimmed.slice(0, 2)).toUpperCase();
}

/**
 * 서버 LocalDateTime은 오프셋 없이 "2026-08-17T12:34:56"로 온다 — JS는 이 형식을 기기 로컬
 * 시각으로 파싱한다. 서버와 사용자가 모두 KST라 실무상 맞지만, 해외 로밍 중이면 시차만큼 어긋난다.
 * ponytail: 서버가 오프셋을 붙여주면 그대로 정확해진다. 그전까지 이 근사로 둔다.
 */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMin = Math.floor((Date.now() - then) / 60_000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  const d = new Date(then);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

const WEATHER_LABELS: Record<PostWeatherApi, string> = {
  CLEAR: '맑음',
  PARTLY_CLOUDY: '구름 조금',
  CLOUDY: '흐림',
  RAIN: '비',
  SNOW: '눈',
  NIGHT: '야간',
};

// PostCard/PostDetail이 아는 아이콘은 3종뿐이라 6개 날씨를 여기로 접는다.
const WEATHER_ICONS: Record<PostWeatherApi, PostShotMeta['weatherIcon']> = {
  CLEAR: 'clear-day',
  PARTLY_CLOUDY: 'cloudy',
  CLOUDY: 'cloudy',
  RAIN: 'cloudy',
  SNOW: 'cloudy',
  NIGHT: 'clear-night',
};

/** "05:30:00" → "05:30" (LocalTime은 초까지 올 수도, 안 올 수도 있다) */
function trimSeconds(time: string): string {
  return time.length >= 5 ? time.slice(0, 5) : time;
}

function mapShotMeta(dto: PostResponseDTO): PostShotMeta | undefined {
  const gear = [dto.cameraModel, dto.lensModel].filter(Boolean).join(' · ');
  // 넷 다 없으면 촬영 정보 블록 자체를 띄우지 않는다(빈 칩이 남는 것보다 낫다).
  if (!dto.shootingTime && !dto.weather && !gear) return undefined;
  return {
    time: dto.shootingTime ? trimSeconds(dto.shootingTime) : '',
    weather: dto.weather ? WEATHER_LABELS[dto.weather] : '',
    weatherIcon: dto.weather ? WEATHER_ICONS[dto.weather] : 'cloudy',
    gear,
  };
}

export function mapAuthor(dto: PostAuthorDTO): PostAuthor {
  return {
    id: String(dto.id),
    handle: dto.nickname,
    initials: initialsOf(dto.nickname),
    avatarGradient: pick(AVATAR_FALLBACKS, dto.id),
    profileImageUrl: dto.profileImageUrl,
  };
}

export interface PostMapContext {
  /** 로그인한 사용자 id. 없으면(비로그인) isMine은 항상 false */
  myUserId?: number | null;
  /** 내가 팔로우 중인 사용자 id 집합 — PostResponse에 팔로우 여부가 없어 별도로 받는다 */
  followingIds?: Set<string>;
}

export function mapPost(dto: PostResponseDTO, ctx: PostMapContext = {}): Post {
  const authorId = String(dto.author.id);
  return {
    id: String(dto.id),
    author: mapAuthor(dto.author),
    isMine: ctx.myUserId != null && dto.author.id === ctx.myUserId,
    photoGradient: pick(PHOTO_FALLBACKS, dto.id),
    imageUrls: dto.images?.map((img) => img.imageUrl) ?? [],
    caption: dto.content,
    location: dto.spotName ?? '',
    createdAtLabel: formatRelativeTime(dto.createdAt),
    likeCount: dto.likeCount,
    isLiked: dto.liked,
    commentCount: dto.commentCount,
    // 공유 수는 서버에 없다. 화면에서도 숫자를 안 쓰고 아이콘만 노출한다.
    shareCount: 0,
    isSaved: dto.bookmarked,
    isFollowingAuthor: ctx.followingIds?.has(authorId) ?? false,
    // photogenicScore는 PostResponse에 없어 넣지 않는다 → 화면에서 칩이 숨는다.
    shotMeta: mapShotMeta(dto),
  };
}

export function mapPosts(list: PostResponseDTO[], ctx: PostMapContext = {}): Post[] {
  return list.map((dto) => mapPost(dto, ctx));
}

/** 파일 크기는 서버가 byte로 준다 — 목업의 "8.4 MB" 표기에 맞춘다. */
function formatFileSize(bytes: number | null): string | undefined {
  if (bytes == null || bytes <= 0) return undefined;
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function mapExif(dto: PhotoExifDTO | undefined, shootingTime?: string | null): PhotoExifData {
  if (!dto) return shootingTime ? { shotAtLabel: `${trimSeconds(shootingTime)} 촬영` } : {};
  const size = formatFileSize(dto.fileSize);
  return {
    shotAtLabel: shootingTime ? `${trimSeconds(shootingTime)} 촬영` : undefined,
    camera: dto.cameraModel ?? undefined,
    lens: dto.lensModel ?? undefined,
    iso: dto.iso ?? undefined,
    aperture: dto.fNumber ?? undefined,
    shutter: dto.exposureTime ?? undefined,
    focalLength: dto.focalLength ?? undefined,
    exposureMode: dto.exposureMode ?? undefined,
    metering: dto.meteringMode ?? undefined,
    whiteBalance: dto.whiteBalance ?? undefined,
    flash: dto.flash ?? undefined,
    focalLength35mm: dto.focalLength35mm ?? undefined,
    software: dto.software ?? undefined,
    gpsLat: dto.latitude ?? undefined,
    gpsLng: dto.longitude ?? undefined,
    filename: dto.fileName ?? undefined,
    fileSize: size,
    format: dto.fileFormat ?? undefined,
  };
}

/** 라이트박스는 메인(첫 번째) 사진의 EXIF만 보여준다. */
export function mapPostDetail(dto: PostResponseDTO, exif: PostExifResponseDTO | undefined, ctx: PostMapContext = {}): PostDetail {
  return {
    ...mapPost(dto, ctx),
    exif: mapExif(exif?.images?.[0], dto.shootingTime),
  };
}

export function mapComment(dto: CommentResponseDTO, myUserId?: number | null): Comment {
  return {
    id: String(dto.id),
    author: {
      id: String(dto.author.id),
      handle: dto.author.nickname,
      initials: initialsOf(dto.author.nickname),
      profileImageUrl: dto.author.profileImageUrl,
    },
    text: dto.content,
    createdAtLabel: formatRelativeTime(dto.createdAt),
    isMine: myUserId != null && dto.author.id === myUserId,
    // 댓글 좋아요는 서버에 없다 — likeCount/isLiked를 비워 화면에서 하트를 숨긴다.
  };
}
