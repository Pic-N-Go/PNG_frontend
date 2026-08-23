import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, BellOff, Calendar, Camera, Check, ChevronRight, Clock, ThumbsUp } from 'lucide-react-native';
import ContestRankPanel from '@/components/community/ContestRankPanel';
import ContestPhoto from '@/components/community/ContestPhoto';
import {
  ContestEntry,
  ContestInfo,
  ContestAwardSummary,
  ContestPastMonthItem,
  ContestPhase,
  ContestSortKey,
  RankHistory,
} from '@/types/community';
import { BUTTON_HEIGHT, BUTTON_RADIUS, CARD_RADIUS, CONTENT_PADDING, FONT_2XL, FONT_2XS, FONT_MD, FONT_SM, FONT_XL, FONT_XS, HAIRLINE_WIDTH } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { BRAND, BRAND_TINT, CARD, HAIRLINE } from '@/constants/colors';

/**
 * 콘테스트 > 진행중 — 월간 주기 최종안 (핸드오프 contest-final-mockup.html 02~03 섹션,
 * 목업 community-feed.html의 .phase[data-phase] 4종을 그대로 따른다).
 * phase(SUBMITTING/VOTING/RESULT/ENDED)는 서버가 계산해 내려주는 값이라 이 컴포넌트는
 * 분기만 하고 판정 로직은 갖지 않는다. 세그먼트/서브탭은 상위(ContestSegment) 담당.
 */

const PINK = BRAND;
const INK = '#000000';
const GRAY_DISABLED = '#c7c7cc';

const SUB = '#8e8e93';
const FILL = CARD;

/**
 * 진행중 탭의 출품작 그리드는 전부 미리보기다 — 전체 목록과 무한 스크롤은 ContestAllEntries가 맡는다.
 * 여기서 상한을 두지 않으면 출품 200개인 달에 카드 200개가 한 번에 마운트되고,
 * 그보다 나쁜 건 하단의 "N개 출품 모두 보기"가 목록이 길수록 멀어져 도달할 수 없게 되는 것이다.
 * 둘 다 2열 그리드라 짝수로 끊는다.
 *
 * TODO(API): 서버가 limit 파라미터를 받으면 그쪽으로 옮긴다. 지금은 다 받아놓고 자르는 형태다.
 */
const FEED_PREVIEW_LIMIT = 4;
const VOTE_PREVIEW_LIMIT = 8;

/** 투표 하단 버튼 두 개의 좌우 끝 요소(썸네일·chevron) 여백 — pill이라 radius만큼 안쪽으로 들인다 */
const BUTTON_SIDE_INSET = normalize(16);

const SORT_OPTIONS: { key: ContestSortKey; label: string }[] = [
  { key: 'latest', label: '최신순' },
  { key: 'votes', label: '득표순' },
];

const HERO_GRADIENT: [string, string, string, string, string] = ['#1a1530', '#2d1b4e', '#8b4a6b', '#d4856a', '#f0c89a'];
const HERO_LOCATIONS: [number, number, number, number, number] = [0, 0.3, 0.62, 0.84, 1];
const HERO_SCRIM_COLORS: [string, string, string, string] = [
  'rgba(0,0,0,0)',
  'rgba(20,14,32,0.18)',
  'rgba(20,14,32,0.74)',
  'rgba(20,14,32,0.92)',
];
const HERO_SCRIM_LOCATIONS: [number, number, number, number] = [0, 0.28, 0.58, 1];

function HeroScrim() {
  return (
    <LinearGradient
      colors={HERO_SCRIM_COLORS}
      locations={HERO_SCRIM_LOCATIONS}
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
}

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', paddingTop: normalize(22), paddingBottom: normalize(12) }}>
      <Text allowFontScaling={false} style={{ flex: 1, paddingLeft: CONTENT_PADDING, fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, letterSpacing: -0.7, color: INK }}>
        {title}
      </Text>
      {right}
    </View>
  );
}

/** 지난 달 수상작 요약 행 — 상시 노출(화면이 비었을 때도 볼거리가 된다) */
function AwardRow({ award, onPress }: { award: ContestAwardSummary; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ margin: normalize(16), marginTop: normalize(16), marginHorizontal: CONTENT_PADDING, height: normalize(72), paddingHorizontal: normalize(14), borderRadius: CARD_RADIUS, backgroundColor: FILL, flexDirection: 'row', alignItems: 'center', gap: normalize(12) }}
    >
      {/* 1~3위 썸네일을 10씩 겹친다 — 뒤 순위가 위로 올라오도록 목업과 같은 순서로 렌더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
        {award.podiumGradients.map((gradient, index) => (
          <ContestPhoto
            key={index}
            gradient={gradient}
            photoUrl={award.podiumPhotoUrls?.[index]}
            radius={normalize(9)}
            style={{
              width: normalize(34),
              height: normalize(34),
              borderWidth: 2,
              borderColor: FILL,
              marginLeft: index === 0 ? 0 : -normalize(10),
            }}
          />
        ))}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: INK }}>
          {award.monthLabel} 수상작
        </Text>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB, marginTop: normalize(2) }}>
          {`${award.theme} · ${award.winnerHandle} ${award.rank}위`}
        </Text>
      </View>
      <ChevronRight size={normalize(18)} color="#c7c7cc" strokeWidth={2} />
    </Pressable>
  );
}

function SidePill({ label, value, dots, onPress }: { label: string; value: string; dots?: { total: number; left: number }; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ height: normalize(32), paddingLeft: normalize(12), paddingRight: normalize(10), marginRight: normalize(28), borderRadius: normalize(16), backgroundColor: FILL, flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: SUB }}>
        {label}
      </Text>
      {dots && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4) }}>
          {Array.from({ length: dots.total }).map((_, i) => (
            <View key={i} style={{ width: normalize(7), height: normalize(7), borderRadius: normalize(4), backgroundColor: i < dots.left ? PINK : '#e6e6ea' }} />
          ))}
        </View>
      )}
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: INK }}>
        {value}
      </Text>
      <ChevronRight size={normalize(14)} color="#c7c7cc" strokeWidth={2} />
    </Pressable>
  );
}

function Footbar({ topic, state, ctaLabel, ctaIcon, onPressCta, ctaDisabled }: { topic: string; state: string; ctaLabel: string; ctaIcon?: React.ReactNode; onPressCta: () => void; ctaDisabled?: boolean }) {
  return (
    // 아래 여백은 ScrollView의 contentContainer paddingBottom이 담당한다 — 여기서 또 주면 CTA 밑에 빈 흰 영역이 남는다
    <View style={{ margin: normalize(28), marginTop: normalize(24), marginBottom: 0, paddingTop: normalize(24), borderTopWidth: HAIRLINE_WIDTH, borderTopColor: HAIRLINE, flexDirection: 'row', alignItems: 'center', gap: normalize(12) }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB }}>
          {topic}
        </Text>
        <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: INK, marginTop: normalize(2) }}>
          {state}
        </Text>
      </View>
      <Pressable
        onPress={ctaDisabled ? undefined : onPressCta}
        disabled={ctaDisabled}
        style={{ height: normalize(44), paddingHorizontal: normalize(20), borderRadius: normalize(22), backgroundColor: ctaDisabled ? '#e6e6ea' : PINK, flexDirection: 'row', alignItems: 'center', gap: normalize(6), flexShrink: 0 }}
      >
        {ctaIcon}
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: ctaDisabled ? '#b8b8be' : '#fff' }}>
          {ctaLabel}
        </Text>
      </Pressable>
    </View>
  );
}

/** 출품 기간 · 결과 발표일 그리드 — 투표 버튼 없음, 탭하면 상세로 */
function PlainEntryCard({ entry, onPress }: { entry: ContestEntry; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ width: '48%', borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: FILL }}>
      <ContestPhoto gradient={entry.gradient} photoUrl={entry.photoUrl} style={{ width: '100%', aspectRatio: 1 }} />
      <View style={{ paddingTop: normalize(9), paddingHorizontal: normalize(12), paddingBottom: normalize(11) }}>
        <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: INK }}>
          {entry.author}
        </Text>
        <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB, marginTop: normalize(2) }}>
          {entry.createdAgoLabel}
        </Text>
      </View>
    </Pressable>
  );
}

/** 투표 기간 그리드 — 순위 배지·득표수 없음(투표 기간에는 집계를 노출하지 않는다). 메타는 "스팟 · 출품 시각" */
function VoteEntryCard({ entry, votesLeft, onVote, onPress }: { entry: ContestEntry; votesLeft: number; onVote: () => void; onPress: () => void }) {
  const spent = !entry.voted && votesLeft <= 0;
  // 내 출품작에는 투표할 수 없다(서버도 거절한다). 버튼 자리에 "내 작품"을 두어
  // 왜 못 누르는지 알린다 — 회색 버튼만 두면 "표 소진"과 구분되지 않는다.
  const mine = entry.isMine === true;
  return (
    <View style={{ width: '48%', borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: FILL }}>
      <Pressable onPress={onPress} style={{ width: '100%', aspectRatio: 1 }}>
        <ContestPhoto gradient={entry.gradient} photoUrl={entry.photoUrl} style={{ width: '100%', height: '100%' }} />
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: normalize(9), paddingHorizontal: normalize(12), paddingBottom: normalize(11), gap: normalize(8) }}>
        <Pressable onPress={onPress} style={{ flex: 1, minWidth: 0 }}>
          <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: INK }}>
            {entry.author}
          </Text>
          <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB, marginTop: normalize(2) }}>
            {[entry.spot, entry.shotAtLabel].filter(Boolean).join(' · ')}
          </Text>
        </Pressable>
        {mine ? (
          <Text allowFontScaling={false} style={{ flexShrink: 0, fontFamily: 'Pretendard-Medium', fontSize: FONT_2XS, letterSpacing: -0.1, color: SUB }}>
            내 작품
          </Text>
        ) : (
          <Pressable
            onPress={onVote}
            disabled={spent}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={entry.voted ? '투표함' : '투표'}
            style={{ width: normalize(28), height: normalize(28), borderRadius: normalize(14), alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: entry.voted ? BRAND_TINT : spent ? '#e6e6ea' : PINK }}
          >
            {entry.voted ? (
              <Check size={normalize(14)} color={PINK} strokeWidth={2.6} />
            ) : (
              <ThumbsUp size={normalize(15)} color={spent ? '#b8b8be' : '#fff'} strokeWidth={1.9} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** 진행중 탭 하단의 지난 회차 행 — 집계 중 화면과 "없음" 화면이 같은 목록을 쓴다 */
function PastRow({ item, onPress }: { item: ContestPastMonthItem; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ width: '100%', height: normalize(84), paddingHorizontal: CONTENT_PADDING, flexDirection: 'row', alignItems: 'center', gap: normalize(12) }}>
      <ContestPhoto
        gradient={item.gradient}
        photoUrl={item.photoUrl}
        radius={normalize(14)}
        style={{ width: normalize(60), height: normalize(60), flexShrink: 0 }}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: INK }}>
          {item.theme}
        </Text>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB, marginTop: normalize(3) }}>
          {[item.monthLabel, item.meta].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB }}>
        {item.myRank == null ? '출품하지 않음' : `내 순위 ${item.myRank}위`}
      </Text>
    </Pressable>
  );
}

function PastSectionHeader({ onSeeAll }: { onSeeAll: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', paddingTop: normalize(20), paddingBottom: normalize(12) }}>
      <Text allowFontScaling={false} style={{ flex: 1, paddingLeft: CONTENT_PADDING, fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: INK }}>
        지난 콘테스트
      </Text>
      <Pressable onPress={onSeeAll} style={{ paddingRight: CONTENT_PADDING }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: PINK }}>
          전체 보기
        </Text>
      </Pressable>
    </View>
  );
}

interface Props {
  phase: ContestPhase;
  /** ENDED(진행 중 회차 없음)에서는 null이다 */
  contest: ContestInfo | null;
  /** 직전 회차 수상 요약. 아직 끝난 회차가 없거나 결과 조회가 막히면 null이라 배너를 숨긴다 */
  lastAward: ContestAwardSummary | null;
  submitFeed: ContestEntry[];
  voteEntries: ContestEntry[];
  sort: ContestSortKey;
  onChangeSort: (sort: ContestSortKey) => void;
  /** 첫 집계 전이거나 조회가 막히면 null — 패널을 통째로 숨긴다 */
  rankHistory: RankHistory | null;
  votesLeft: number;
  maxVotes: number;
  myEntryCount: number;
  /** 투표 기간 "내 출품작" 버튼의 겹침 썸네일 — 개수만으로는 무엇을 냈는지 알 수 없다 */
  myEntryThumbs: { gradient: [string, string, string]; photoUrl?: string | null }[];
  maxEntries: number;
  /** 다음 회차 예고. 아직 개설되지 않았으면 null이고 화면은 "준비 중"으로 물러난다 */
  nextContest: ContestInfo | null;
  /** 알림 신청 완료 — 신청 후에는 CTA가 물러난다 */
  subscribed?: boolean;
  pastItems: ContestPastMonthItem[];
  onVote: (id: string) => void;
  onOpenEntry: (id: string) => void;
  onOpenSubmit: () => void;
  onSeeAll: () => void;
  onOpenMyVotes: () => void;
  onOpenMyEntries: () => void;
  onSelectPastItem: (item: ContestPastMonthItem) => void;
  /** 다음 콘테스트 시작 알림 신청 */
  onSubscribe: () => void;
  /** ENDED 섹션 헤더의 "전체 보기" — 지난 탭으로 이동 */
  onSeeAllPast: () => void;
}

export default function ContestActiveTab({
  phase,
  contest,
  lastAward,
  submitFeed,
  voteEntries,
  sort,
  onChangeSort,
  rankHistory,
  votesLeft,
  maxVotes,
  myEntryCount,
  myEntryThumbs,
  maxEntries,
  nextContest,
  subscribed = false,
  pastItems,
  onVote,
  onOpenEntry,
  onOpenSubmit,
  onSeeAll,
  onOpenMyVotes,
  onOpenMyEntries,
  onSelectPastItem,
  onSubscribe,
  onSeeAllPast,
}: Props) {
  const openAward = () => {
    if (!lastAward) return;
    onSelectPastItem({
      id: 'award',
      monthLabel: lastAward.monthLabel,
      theme: lastAward.theme,
      winnerHandle: lastAward.winnerHandle,
      meta: '',
      myRank: lastAward.rank || null,
      kind: 'award',
      gradient: lastAward.podiumGradients[0] ?? ['#1a1530', '#5a3355', '#d4856a'],
      photoUrl: lastAward.podiumPhotoUrls?.[0],
    });
  };
  const nextScheduled = nextContest != null;
  // 1인 3장이 상한 — 다 쓰면 출품 CTA를 잠근다(서버가 거절하기 전에 클라이언트에서 먼저 막는다)
  const isFull = myEntryCount >= maxEntries;
  // 펼치면 히어로를 줄여 그래프가 첫 화면에 들어오게 한다(목업 .is-expanded)
  const [rankPanelOpen, setRankPanelOpen] = React.useState(false);

  return (
    // flexGrow: 1 — 내용이 화면보다 짧을 때 빈 상태가 남은 공간을 차지해 세로 중앙에 설 수 있게 한다
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: normalize(24) }}>
      {phase === 'SUBMITTING' && contest && (
        <>
          <View style={{ height: normalize(280), overflow: 'hidden', borderBottomLeftRadius: normalize(24), borderBottomRightRadius: normalize(24) }}>
            <LinearGradient colors={HERO_GRADIENT} locations={HERO_LOCATIONS} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            <HeroScrim />
            <View style={{ position: 'absolute', left: normalize(28), right: normalize(28), bottom: normalize(20) }}>
              <View style={{ alignSelf: 'flex-start', height: normalize(24), justifyContent: 'center', paddingHorizontal: normalize(10), borderRadius: normalize(12), backgroundColor: PINK }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, letterSpacing: 1.6, color: '#fff' }}>
                  {`${contest.monthLabel} · 출품 기간`}
                </Text>
              </View>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XL, letterSpacing: -1, color: '#fff', marginTop: normalize(10) }}>
                {contest.theme}
              </Text>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: 'rgba(255,255,255,0.88)', marginTop: normalize(12) }}>
                {contest.themeDesc}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: normalize(16) }}>
                <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: 'rgba(255,255,255,0.86)' }}>
                  {`${contest.participantCount}명 · ${contest.entryCount}개 출품`}
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: '#fff' }}>
                  {`출품 마감 ${contest.submitDeadlineLabel}`}
                </Text>
              </View>
              <View style={{ height: normalize(4), borderRadius: normalize(2), backgroundColor: 'rgba(255,255,255,0.34)', overflow: 'hidden', marginTop: normalize(8) }}>
                <View style={{ width: `${Math.round(contest.submitProgress * 100)}%`, height: '100%', backgroundColor: '#fff' }} />
              </View>
            </View>
          </View>

          {lastAward && <AwardRow award={lastAward} onPress={openAward} />}

          {submitFeed.length === 0 ? (
            // flex: 1은 남는 공간만 채운다 — 히어로·수상작 행이 화면을 거의 채우면 거의 안 늘어나므로 최소 높이를 따로 준다
            <View style={{ flex: 1, minHeight: normalize(260), justifyContent: 'center', paddingHorizontal: CONTENT_PADDING, alignItems: 'center' }}>
              <View style={{ width: normalize(56), height: normalize(56), borderRadius: normalize(28), backgroundColor: FILL, alignItems: 'center', justifyContent: 'center', marginBottom: normalize(16) }}>
                <Camera size={normalize(24)} color="#b8b8be" strokeWidth={1.7} />
              </View>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: INK }}>
                첫 출품작을 기다리고 있어요
              </Text>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: SUB, marginTop: normalize(6) }}>
                가장 먼저 올리면 2주 내내 보여요
              </Text>
            </View>
          ) : (
            <>
              <SectionHeader
                title="새로 올라온 출품작"
                right={<SidePill label="내 출품작" value={`${myEntryCount}/${maxEntries}`} onPress={onOpenMyEntries} />}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: normalize(20), paddingHorizontal: CONTENT_PADDING }}>
                {submitFeed.slice(0, FEED_PREVIEW_LIMIT).map((entry) => (
                  <PlainEntryCard key={entry.id} entry={entry} onPress={() => onOpenEntry(entry.id)} />
                ))}
              </View>
            </>
          )}

          <Footbar
            topic={`${contest.theme} · 출품 마감 ${contest.submitDeadlineLabel}`}
            state={isFull ? '출품을 다 썼어요' : myEntryCount > 0 ? `${maxEntries - myEntryCount}개 더 낼 수 있어요` : '아직 출품하지 않았어요'}
            ctaLabel="출품하기"
            ctaIcon={<Camera size={normalize(16)} color={isFull ? '#b8b8be' : '#fff'} strokeWidth={1.9} />}
            onPressCta={onOpenSubmit}
            ctaDisabled={isFull}
          />
        </>
      )}

      {phase === 'VOTING' && contest && (
        <>
          <View style={{ height: normalize(rankPanelOpen ? 160 : 200), overflow: 'hidden', borderBottomLeftRadius: normalize(24), borderBottomRightRadius: normalize(24) }}>
            <LinearGradient colors={HERO_GRADIENT} locations={HERO_LOCATIONS} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            <HeroScrim />
            <View style={{ position: 'absolute', left: normalize(28), right: normalize(28), bottom: normalize(18) }}>
              <View style={{ alignSelf: 'flex-start', height: normalize(24), justifyContent: 'center', paddingHorizontal: normalize(10), borderRadius: normalize(12), backgroundColor: PINK }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, letterSpacing: 1.6, color: '#fff' }}>
                  {`${contest.monthLabel} · 투표 기간`}
                </Text>
              </View>
              {/* 투표 히어로는 22px — 출품 히어로(28px)보다 작다. 순위 패널이 아래 붙어 자리를 나눠 쓰기 때문 */}
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, letterSpacing: -0.7, color: '#fff', marginTop: normalize(8) }}>
                {`${contest.theme} · ${contest.entryCount}개 출품`}
              </Text>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: 'rgba(255,255,255,0.88)', marginTop: normalize(4) }}>
                {`${contest.resultAnnounceLabel} 결과 발표`}
              </Text>
            </View>
          </View>

          {rankHistory && (
            <ContestRankPanel history={rankHistory} open={rankPanelOpen} onToggle={() => setRankPanelOpen((v) => !v)} onOpenEntry={onOpenEntry} />
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: normalize(14), borderBottomWidth: HAIRLINE_WIDTH, borderBottomColor: HAIRLINE }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', height: normalize(34), paddingLeft: CONTENT_PADDING, gap: normalize(14) }}>
              {/* 정렬은 "무엇을 보는가"라 활성색이 블랙 — CLAUDE.md 색상 규칙.
                  목업(.vote-sort.is-active)은 accent를 쓰지만 그건 목업 쪽 오류다. */}
              {SORT_OPTIONS.map((option, index) => (
                <React.Fragment key={option.key}>
                  {index > 0 && <View style={{ width: normalize(3), height: normalize(3), borderRadius: normalize(2), backgroundColor: '#dcdce0' }} />}
                  <Pressable
                    onPress={() => onChangeSort(option.key)}
                    hitSlop={{ top: 12, bottom: 12 }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sort === option.key }}
                    accessibilityLabel={option.label}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: sort === option.key ? 'Pretendard-SemiBold' : 'Pretendard-Medium',
                        fontSize: FONT_SM,
                        letterSpacing: -0.2,
                        color: sort === option.key ? INK : SUB,
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                </React.Fragment>
              ))}
            </View>
            <View style={{ flex: 1 }} />
            <SidePill label="남은 표" value={`${votesLeft}/${maxVotes}`} dots={{ total: maxVotes, left: votesLeft }} onPress={onOpenMyVotes} />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: normalize(20), paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(20) }}>
            {voteEntries.slice(0, VOTE_PREVIEW_LIMIT).map((entry) => (
              <VoteEntryCard key={entry.id} entry={entry} votesLeft={votesLeft} onVote={() => onVote(entry.id)} onPress={() => onOpenEntry(entry.id)} />
            ))}
          </View>

          {/* 투표 기간에도 내 출품작은 확인·삭제할 수 있다(추가 출품만 막힌다) — 시트 8f로 가는 유일한 경로.
              아래 "모두 보기" 버튼과 같은 규격 — 높이·radius·글자 크기·chevron 위치까지 맞춘다 */}
          {myEntryCount > 0 && (
            <Pressable
              onPress={onOpenMyEntries}
              accessibilityRole="button"
              style={{ marginHorizontal: CONTENT_PADDING, marginTop: normalize(20), height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, backgroundColor: FILL, alignItems: 'center', justifyContent: 'center' }}
            >
              {/* 썸네일·chevron은 흐름에서 빼 좌우 끝에 고정한다 — 흐름에 두면 그 폭만큼 문구가 밀려
                  아래 "모두 보기" 버튼의 문구와 축이 어긋난다(양옆 요소 크기가 서로 다르다) */}
              <View style={{ position: 'absolute', left: BUTTON_SIDE_INSET, flexDirection: 'row', alignItems: 'center' }} pointerEvents="none">
                {myEntryThumbs.map((thumb, index) => (
                  <ContestPhoto
                    key={index}
                    gradient={thumb.gradient}
                    photoUrl={thumb.photoUrl}
                    radius={normalize(8)}
                    style={{
                      width: normalize(28),
                      height: normalize(28),
                      borderWidth: 2,
                      borderColor: FILL,
                      marginLeft: index === 0 ? 0 : -normalize(9),
                    }}
                  />
                ))}
              </View>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: INK }}>
                {`내 출품작 ${myEntryCount}개`}
              </Text>
              <ChevronRight size={normalize(18)} color="#c7c7cc" strokeWidth={2} style={{ position: 'absolute', right: BUTTON_SIDE_INSET }} />
            </Pressable>
          )}

          {/* 투표 기간 하단은 버튼 두 줄만 — 주제·마감일은 이미 히어로에 있어 Footbar의 정보 텍스트는 중복이었다.
              구분선도 두지 않는다(시안 9b). 출품·발표 단계는 성격이 달라 Footbar를 그대로 쓴다. */}
          <Pressable
            onPress={onSeeAll}
            accessibilityRole="button"
            style={{ marginHorizontal: CONTENT_PADDING, marginTop: normalize(12), height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, backgroundColor: PINK, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#fff' }}>
              {`${contest.entryCount}개 출품 모두 보기`}
            </Text>
            {/* 위 "내 출품작" 버튼과 같은 위치에 — 흐름에 두면 chevron 폭만큼 문구가 왼쪽으로 밀린다 */}
            <ChevronRight size={normalize(18)} color="#fff" strokeWidth={2} style={{ position: 'absolute', right: BUTTON_SIDE_INSET }} />
          </Pressable>
        </>
      )}

      {/* 집계 중 — 투표는 끝났고 발표(투표 종료 다음 날 09:00) 전이다.
          이 구간에는 서버가 순위·득표수를 내려주지 않으므로 보여줄 결과가 아예 없다.
          발표가 나면 이 회차는 지난 목록으로 넘어가고 다음 회차가 곧바로 출품 기간으로 잡힌다. */}
      {phase === 'RESULT' && contest && (
        <>
          <View style={{ marginTop: normalize(18), marginHorizontal: CONTENT_PADDING, padding: normalize(28), paddingHorizontal: normalize(24), borderRadius: normalize(20), backgroundColor: FILL, alignItems: 'center' }}>
            <View style={{ width: normalize(56), height: normalize(56), borderRadius: normalize(28), backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: normalize(16) }}>
              <Clock size={normalize(24)} color="#b8b8be" strokeWidth={1.7} />
            </View>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, letterSpacing: -0.7, color: INK }}>
              집계 중이에요
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: SUB, marginTop: normalize(6), textAlign: 'center', lineHeight: FONT_SM * 1.5 }}>
              {`${contest.resultAnnounceLabel}에 결과를 발표해요`}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8), marginTop: normalize(14) }}>
              <Calendar size={normalize(15)} color={INK} strokeWidth={2} />
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: INK }}>
                {`${contest.theme} · ${contest.entryCount}개 출품`}
              </Text>
            </View>
          </View>

          {pastItems.length > 0 && (
            <>
              <PastSectionHeader onSeeAll={onSeeAllPast} />
              {pastItems.map((item) => (
                <PastRow key={item.id} item={item} onPress={() => onSelectPastItem(item)} />
              ))}
            </>
          )}
        </>
      )}

      {phase === 'ENDED' && (
        <>
          <View style={{ margin: normalize(18), marginTop: normalize(18), marginHorizontal: CONTENT_PADDING, padding: normalize(28), paddingHorizontal: normalize(24), borderRadius: normalize(20), backgroundColor: FILL, alignItems: 'center' }}>
            <View style={{ height: normalize(24), paddingHorizontal: normalize(12), borderRadius: normalize(12), backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: nextScheduled ? SUB : GRAY_DISABLED }}>
                다음 콘테스트
              </Text>
            </View>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, letterSpacing: -0.7, color: INK, marginTop: normalize(12) }}>
              {nextContest ? nextContest.theme : '준비 중이에요'}
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: SUB, marginTop: normalize(6), textAlign: 'center', lineHeight: FONT_SM * 1.5 }}>
              {nextContest ? nextContest.themeDesc : '주제와 일정이 정해지면 알려드릴게요'}
            </Text>
            {/* 7b는 약속할 날짜가 없다 — 아이콘·글자를 한 단계 낮추고 굵기도 뺀다 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8), marginTop: normalize(14) }}>
              <Calendar size={normalize(15)} color={nextScheduled ? INK : GRAY_DISABLED} strokeWidth={2} />
              <Text
                allowFontScaling={false}
                style={{ fontFamily: nextScheduled ? 'Pretendard-SemiBold' : 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: nextScheduled ? INK : SUB }}
              >
                {nextContest ? `${nextContest.submitStartLabel} 시작` : '일정 미정'}
              </Text>
            </View>
            {/* 알림 신청은 데이터를 바꾸는 동작이라 accent — 목업은 블랙이지만 CLAUDE.md 규칙이 우선한다
                (정렬 색상과 같은 판단: 어디로 가는가·무엇을 바꾸는가 → 핑크).
                신청 완료·7b는 흰 배경으로 물러난다 — 카드 배경이 FILL이라 FILL을 쓰면 버튼이 사라진다 */}
            <Pressable
              onPress={onSubscribe}
              accessibilityRole="button"
              accessibilityState={{ selected: subscribed }}
              style={{
                width: '100%',
                height: normalize(44),
                marginTop: normalize(18),
                borderRadius: normalize(22),
                backgroundColor: subscribed || !nextScheduled ? '#fff' : PINK,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: normalize(7),
              }}
            >
              {subscribed ? (
                <BellOff size={normalize(16)} color={SUB} strokeWidth={2} />
              ) : (
                <Bell size={normalize(16)} color={nextScheduled ? '#fff' : INK} strokeWidth={2} />
              )}
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: subscribed ? SUB : nextScheduled ? '#fff' : INK }}
              >
                {subscribed ? '알림 받는 중' : nextScheduled ? '시작하면 알림 받기' : '열리면 알림 받기'}
              </Text>
            </Pressable>
          </View>

          {pastItems.length > 0 && (
            <>
              <PastSectionHeader onSeeAll={onSeeAllPast} />
              {pastItems.map((item) => (
                <PastRow key={item.id} item={item} onPress={() => onSelectPastItem(item)} />
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}
