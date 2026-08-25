// 콘테스트 서버 DTO → 화면 뷰모델 변환. API 파일과 화면 사이에서 이 파일만 두 타입을 모두 안다.
// communityMappers.ts와 같은 규칙 — 서버에 없는 값을 여기서 만들어내지 않는다.
//
// 서버 LocalDateTime은 오프셋 없이 `2026-08-17T12:34:56`으로 온다. JS는 이 형식을 기기 로컬
// 시각으로 파싱하는데, 서버와 사용자가 모두 KST라 실무상 맞는다(communityMappers와 같은 전제).
import { formatRelativeTime } from '@/utils/communityMappers';
import { BRAND } from '@/constants/colors';
import type {
  ContestAwardSummary,
  ContestEntry,
  ContestPhotoEntry,
  ContestHistoryRow,
  ContestInfo,
  ContestMyHistory,
  ContestPastMonthItem,
  ContestRankTrendPoint,
  MyVoteEntry,
  RankHistory,
  RankLegendEntry,
  RankSeries,
  RankVariant,
} from '@/types/community';
import type {
  ContestEntryDTO,
  ContestResultEntryDTO,
  ContestHistoryItemDTO,
  ContestMyHistoryDTO,
  ContestMyVoteDTO,
  ContestPastDTO,
  ContestRankingHistoryDTO,
  ContestResponseDTO,
  ContestResultDTO,
} from '@/types/contest';

/**
 * 사진이 아직 없거나 URL이 실패했을 때 카드를 채우는 대체 색. 목업 팔레트의 어두운 톤이고,
 * 같은 id면 항상 같은 색이 나오도록 id를 인덱스로 쓴다(랜덤이면 리렌더마다 색이 바뀐다).
 * communityMappers.PHOTO_FALLBACKS와 같은 역할이지만 그쪽은 export되지 않는다.
 */
const PHOTO_FALLBACKS: [string, string, string][] = [
  ['#1a1530', '#5a3355', '#d4856a'],
  ['#12333a', '#2f5f5a', '#8fae9b'],
  ['#241a33', '#8b4a6b', '#e8a87c'],
  ['#2d1b4e', '#8b4a6b', '#f0c89a'],
  ['#0f1f2e', '#3f5a6b', '#d9a882'],
  ['#1c1c2b', '#4a3a5e', '#c98f7a'],
];

function fallbackGradient(seed: number | string): [string, string, string] {
  const n = typeof seed === 'number' ? seed : [...String(seed)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PHOTO_FALLBACKS[Math.abs(n) % PHOTO_FALLBACKS.length];
}

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : new Date(t);
}

/** `8월` — 회차를 부르는 짧은 이름 */
export function monthLabel(iso: string | null | undefined): string {
  const d = parse(iso);
  return d ? `${d.getMonth() + 1}월` : '';
}

/** `8월 14일` */
export function dayLabel(iso: string | null | undefined): string {
  const d = parse(iso);
  return d ? `${d.getMonth() + 1}월 ${d.getDate()}일` : '';
}

/** `9월 18일 오전 9시` — 발표 시각 안내. 분이 0이 아니면 분까지 붙인다 */
export function announceLabel(iso: string | null | undefined): string {
  const d = parse(iso);
  if (!d) return '';
  const hour = d.getHours();
  const meridiem = hour < 12 ? '오전' : '오후';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const minute = d.getMinutes();
  const time = minute === 0 ? `${hour12}시` : `${hour12}시 ${minute}분`;
  return `${dayLabel(iso)} ${meridiem} ${time}`;
}

/** `오늘 14:20` / `어제 14:20` / `8월 6일 14:20` — 투표 시각처럼 시·분이 의미 있을 때 */
export function votedAtLabel(iso: string | null | undefined): string {
  const d = parse(iso);
  if (!d) return '';
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const today = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return `오늘 ${hm}`;
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (sameDay(d, yesterday)) return `어제 ${hm}`;
  return `${dayLabel(iso)} ${hm}`;
}

/** `05:32` — 촬영 시각. EXIF가 없으면 빈 문자열이라 호출부가 메타에서 통째로 빼야 한다 */
export function shotAtLabel(iso: string | null | undefined): string {
  const d = parse(iso);
  if (!d) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Date → 서버 LocalDateTime 문자열(`2026-08-23T05:32:00`).
 * 오프셋을 붙이면 안 된다 — 서버가 LocalDateTime이라 파싱에 실패한다.
 * toISOString()은 UTC로 바꿔버리므로 기기 로컬 시각을 그대로 조립한다.
 */
export function toServerDateTime(date: Date): string {
  const p2 = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${p2(date.getMonth() + 1)}-${p2(date.getDate())}` +
    `T${p2(date.getHours())}:${p2(date.getMinutes())}:${p2(date.getSeconds())}`
  );
}

/** 0~1. 시작 전이면 0, 끝났으면 1 */
function progress(startIso: string, endIso: string): number {
  const start = parse(startIso)?.getTime();
  const end = parse(endIso)?.getTime();
  if (start == null || end == null || end <= start) return 0;
  const ratio = (Date.now() - start) / (end - start);
  return Math.min(1, Math.max(0, ratio));
}

export function mapContestInfo(dto: ContestResponseDTO): ContestInfo {
  return {
    monthLabel: monthLabel(dto.submitStartAt),
    theme: dto.title,
    themeDesc: dto.description ?? '',
    submitDeadlineLabel: dayLabel(dto.submitEndAt),
    voteDeadlineLabel: dayLabel(dto.voteEndAt),
    resultAnnounceLabel: announceLabel(dto.resultOpenAt),
    submitStartLabel: dayLabel(dto.submitStartAt),
    submitProgress: progress(dto.submitStartAt, dto.submitEndAt),
    participantCount: dto.participantCount,
    entryCount: dto.entryCount,
  };
}

/**
 * 출품작 카드.
 *
 * votes는 발표 전까지 서버가 null로 내린다 — 투표 기간에 개별 작품의 득표수를 공개하지 않기
 * 때문이다. 화면 타입이 `votes: number`라 0으로 채우지만, 카드가 이 값을 그리는 건
 * 지난 콘테스트 모드뿐이라 투표 기간에 "0표"가 보일 일은 없다.
 */
export function mapContestEntry(dto: ContestEntryDTO): ContestEntry {
  return {
    id: String(dto.entryId),
    author: dto.authorNickname,
    spot: dto.spotName ?? undefined,
    shotAtLabel: shotAtLabel(dto.shotAt) || undefined,
    createdAgoLabel: formatRelativeTime(dto.createdAt),
    rank: dto.rank ?? undefined,
    votes: dto.voteCount ?? 0,
    voted: dto.voted,
    gradient: fallbackGradient(dto.entryId),
    photoUrl: dto.photoUrl,
    caption: dto.caption ?? undefined,
    isMine: dto.mine,
  };
}

export function mapPastItem(dto: ContestPastDTO): ContestPastMonthItem {
  const metaParts = [`${dto.participantCount}명 출품`, `${dto.totalVoteCount.toLocaleString()}표`];
  return {
    id: String(dto.contestId),
    monthLabel: monthLabel(dto.submitStartAt),
    theme: dto.title,
    winnerHandle: dto.winnerNickname ?? '',
    meta: metaParts.join(' · '),
    myRank: dto.myRank,
    // 1위면 수상 강조, 출품했으면 보통, 안 냈으면 회색
    kind: dto.myRank == null ? 'none' : dto.myRank === 1 ? 'award' : 'plain',
    gradient: fallbackGradient(dto.contestId),
    photoUrl: dto.winnerPhotoUrl,
  };
}

/**
 * 진행중 탭 상단의 직전 회차 수상 요약.
 *
 * 대응하는 단일 API가 없어 지난 목록 [0]과 그 회차의 결과를 합쳐 만든다.
 * 우승자가 없는 회차(출품 0건)는 배너에 쓸 게 없으므로 null을 돌려주고 호출부가 숨긴다.
 *
 * rank는 **우승자의 순위**다 — 화면이 `${theme} · ${winnerHandle} ${rank}위`로
 * 핸들 바로 옆에 붙여 그린다. 내 순위로 채우면 출품하지 않은 회차에서 "0위"가 뜬다.
 */
/**
 * 발표(resultOpenAt) 이후 1개월이 노출 기간이다. 지나면 배너를 내린다.
 *
 * setMonth는 말일에서 다음 달로 넘칠 수 있다(1/31 → 3/3). 노출 기간 판정이라
 * 하루 이틀 오차는 감수하고, 대신 "30일"로 고정하지 않아 월 길이를 따라간다.
 */
function isWithinAwardWindow(resultOpenAt: string | null | undefined): boolean {
  const opened = parse(resultOpenAt);
  if (!opened) return false;
  const until = new Date(opened);
  until.setMonth(until.getMonth() + 1);
  return Date.now() < until.getTime();
}

export function mapAwardSummary(
  past: ContestPastDTO,
  result: ContestResultDTO,
): ContestAwardSummary | null {
  if (!result.winner) return null;
  // 발표 후 1개월이 지난 회차는 더 이상 띄우지 않는다
  if (!isWithinAwardWindow(past.resultOpenAt)) return null;

  const podium = result.rankings.slice(0, 3);
  return {
    contestId: String(past.contestId),
    monthLabel: monthLabel(past.submitStartAt),
    rank: result.winner.rank,
    myRank: past.myRank,
    theme: past.title,
    winnerHandle: result.winner.authorNickname,
    voteCount: result.winner.voteCount,
    podiumGradients: podium.map((entry) => fallbackGradient(entry.entryId)),
    podiumPhotoUrls: podium.map((entry) => entry.photoUrl),
  };
}

export function mapMyVotes(dto: ContestMyVoteDTO): MyVoteEntry[] {
  return dto.votedEntries.map((entry) => ({
    id: String(entry.entryId),
    author: entry.authorNickname,
    spotLabel: entry.spotName ?? '',
    votedAtLabel: votedAtLabel(entry.votedAt),
    gradient: fallbackGradient(entry.entryId),
    photoUrl: entry.photoUrl,
  }));
}

/** 그래프는 최근 7일까지만 그린다 — 그 이상은 x축 라벨이 뭉개진다 */
const RANK_DAY_LIMIT = 7;
/** 1위만 accent, 나머지는 회색 농도. 사진 색이 아니라 순위 서열 표시라 고정값이다 */
const SERIES_STROKE = [BRAND, '#b8b8be', '#d2d2d8', '#5c5c60'];

/**
 * 순위 변동 패널.
 *
 * 서버는 매일 자정 상위 3개만 스냅샷으로 남긴다. 어떤 날 순위권 밖이면 그 날 스냅샷에
 * 그 작품이 없고, 그게 곧 화면의 "권외"(rank: null)다. 한 번이라도 권외 구간이 있으면
 * 패널이 권외 밴드가 있는 레이아웃(variant 'out')으로 바뀐다.
 */
export function mapRankHistory(dto: ContestRankingHistoryDTO, contest: ContestResponseDTO): RankHistory {
  const snapshots = dto.snapshots.slice(-RANK_DAY_LIMIT);
  const periodLabel = `투표 시작 ${dayLabel(contest.voteStartAt)} · 마감 ${dayLabel(contest.voteEndAt)}`;

  if (snapshots.length === 0) {
    return { variant: 'first', subtitle: '첫 집계는 내일 자정에 나와요', periodLabel, days: [], legend: [], series: [] };
  }

  const days = snapshots.map((snapshot) => String(Number(snapshot.snapshotDate.slice(8, 10))));
  const latest = snapshots[snapshots.length - 1];

  // 기간 안에 한 번이라도 순위권에 들었던 작품 전부가 선 하나씩을 갖는다
  const entryIds: number[] = [];
  snapshots.forEach((snapshot) =>
    snapshot.rankings.forEach((ranking) => {
      if (!entryIds.includes(ranking.entryId)) entryIds.push(ranking.entryId);
    }),
  );

  const rankAt = (entryId: number, index: number): number | null =>
    snapshots[index].rankings.find((r) => r.entryId === entryId)?.rank ?? null;

  // 마지막 날 순위 우선, 권외로 끝난 작품은 뒤로
  const ordered = [...entryIds].sort(
    (a, b) => (rankAt(a, snapshots.length - 1) ?? 99) - (rankAt(b, snapshots.length - 1) ?? 99),
  );

  const series: RankSeries[] = ordered.map((entryId, index) => {
    const points = snapshots.map((snapshot, i) => ({ dateLabel: days[i], rank: rankAt(entryId, i) }));
    // 권외로 내려간 뒤로는 그릴 값이 없다 — 마지막 순위권 지점에서 선을 끊는다
    const lastKnown = points.reduce((acc, point, i) => (point.rank != null ? i : acc), -1);
    const info = snapshots.flatMap((s) => s.rankings).find((r) => r.entryId === entryId);
    return {
      gradient: fallbackGradient(entryId),
      // 그래프의 원형 썸네일은 "누가"를 보여주는 자리라 출품 사진이 아니라 프로필 사진이다.
      photoUrl: info?.authorProfileImageUrl ?? null,
      strokeColor: SERIES_STROKE[Math.min(index, SERIES_STROKE.length - 1)],
      strokeWidth: index === 0 ? 2.4 : 2,
      points: points.slice(0, lastKnown + 1),
    };
  });

  const previous = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;
  const legend: RankLegendEntry[] = latest.rankings.map((ranking) => {
    const isNew = previous != null && !previous.rankings.some((r) => r.entryId === ranking.entryId);
    const where = ranking.spotName ? ` · ${ranking.spotName}` : '';
    return {
      id: String(ranking.entryId),
      author: ranking.authorNickname,
      meta: isNew
        ? `${ranking.voteCount}표 · ${Number(latest.snapshotDate.slice(8, 10))}일 ${ranking.rank}위권 진입`
        : `${ranking.voteCount}표${where}`,
      rank: ranking.rank,
      gradient: fallbackGradient(ranking.entryId),
      // 목록의 사각 썸네일은 출품 사진, 헤더의 원형 아바타는 프로필 사진 — 자리마다 다르다.
      photoUrl: ranking.photoUrl,
      profilePhotoUrl: ranking.authorProfileImageUrl,
      isNew,
    };
  });

  const variant: RankVariant = series.some((s) => s.points.some((p) => p.rank == null)) ? 'out' : 'normal';
  const top = latest.rankings[0];

  return {
    variant,
    subtitle: top ? `어제 집계 · ${top.authorNickname} 1위` : '어제 집계',
    periodLabel,
    days,
    legend,
    series,
  };
}

/** 순위 추이 그래프 좌표계. 목업 viewBox와 같다 */
const TREND_VIEW_W = 294;
const TREND_VIEW_H = 110;
/** 원(r=5.5)이 잘리지 않도록 위아래를 비운다 */
const TREND_PAD_Y = 20;
/** 최근 몇 회를 그릴지. 더 넣으면 X축 라벨(월 + 테마)이 겹친다 */
const TREND_LIMIT = 6;

/**
 * 내 출품 기록.
 *
 * 서버는 **출품작 단위**로 내려준다 — 한 회차에 3장을 내면 같은 contestId가 3번 나온다.
 * 화면은 "회차별 기록"이라 회차마다 한 줄이어야 해서, 같은 회차는 가장 좋은 순위 하나로 접는다.
 * (집계 중이라 순위가 없는 것끼리는 첫 번째를 남긴다.)
 * ponytail: 서버가 회차 단위로 묶어주면 이 접기는 통째로 지운다.
 */
export function mapMyHistory(dto: ContestMyHistoryDTO): ContestMyHistory {
  const byContest = new Map<number, ContestHistoryItemDTO>();
  dto.items.forEach((item) => {
    const kept = byContest.get(item.contestId);
    if (!kept) {
      byContest.set(item.contestId, item);
      return;
    }
    // null(집계 중)은 순위가 있는 쪽에 항상 진다
    const keptRank = kept.myRank ?? Number.MAX_SAFE_INTEGER;
    const rank = item.myRank ?? Number.MAX_SAFE_INTEGER;
    if (rank < keptRank) byContest.set(item.contestId, item);
  });

  const rows: ContestHistoryRow[] = [...byContest.values()].map((item) => {
    const month = monthLabel(item.submitStartAt);
    const pending = item.myRank == null;
    return {
      id: String(item.contestId),
      title: item.title,
      monthLabel: month,
      // 참가자 수는 이 API에 없다 — 없는 값을 지어내지 않고 있는 것만 적는다
      meta: pending ? `${month} · 집계 중` : [month, `${item.voteCount ?? 0}표`].join(' · '),
      badge: pending ? '집계 중' : `${item.myRank}위`,
      myRank: item.myRank,
      kind: pending ? 'pending' : item.myRank === 1 ? 'award' : 'plain',
      gradient: fallbackGradient(item.contestId),
      photoUrl: item.thumbnailUrl,
    };
  });

  // 그래프는 순위가 확정된 회차만, 오래된 것부터. rows는 최신순이라 뒤집는다
  const ranked = rows.filter((row) => row.myRank != null).slice(0, TREND_LIMIT).reverse();
  const ranks = ranked.map((row) => row.myRank as number);
  const worst = Math.max(...ranks, 1);
  const span = TREND_VIEW_H - TREND_PAD_Y * 2;

  const trend: ContestRankTrendPoint[] = ranked.map((row, index) => ({
    // 라벨 칸의 중앙에 점을 둔다 — 등간격이라 라벨과 어긋나지 않는다
    x: (TREND_VIEW_W * (2 * index + 1)) / (2 * ranked.length),
    // 1위가 위. 전부 같은 순위면 나눌 수 없으니 가운데 선으로 눕힌다
    y: worst === 1 ? TREND_PAD_Y : TREND_PAD_Y + (((row.myRank as number) - 1) / (worst - 1)) * span,
    monthLabel: row.monthLabel,
    theme: row.title,
  }));

  const best = ranks.length > 0 ? Math.min(...ranks) : null;
  return {
    totalEntryCount: dto.totalEntryCount,
    bestRank: dto.bestRank,
    totalVoteCount: dto.totalVoteCount,
    rows,
    trend,
    bestIndex: best == null ? -1 : ranked.findIndex((row) => row.myRank === best),
  };
}

/** 결과 화면의 사진 카드 하나 */
export function mapResultEntry(dto: ContestResultEntryDTO): ContestPhotoEntry {
  return {
    id: String(dto.entryId),
    rank: dto.rank,
    // 원형 아바타는 프로필 사진, 큰 사진 자리는 출품 사진(photoUrl) — 자리마다 다르다.
    // id는 Avatar가 폴백 색을 고르는 씨앗이다. 커뮤니티는 문자열 id를 넘기는 쪽으로 통일돼 있다.
    author: {
      id: String(dto.authorId),
      handle: dto.authorNickname,
      profileImageUrl: dto.authorProfileImageUrl,
    },
    // 순위표·수상 카드가 같은 줄에 쓰는 메타. 스팟을 직접 입력하지 않은 출품작도 있어 비면 뺀다
    captionMeta: [`${dto.voteCount}표`, dto.spotName].filter(Boolean).join(' · '),
    gradient: fallbackGradient(dto.entryId),
    photoUrl: dto.photoUrl,
    spotId: dto.spotId,
    spotName: dto.spotName,
    caption: dto.caption ?? undefined,
    voteCount: dto.voteCount,
  };
}
