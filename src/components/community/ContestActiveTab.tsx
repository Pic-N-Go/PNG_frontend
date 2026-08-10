import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, BellOff, Calendar, Camera, Check, ChevronRight, ThumbsUp } from 'lucide-react-native';
import ContestRankPanel from '@/components/community/ContestRankPanel';
import {
  ContestEntry,
  ContestInfo,
  ContestAwardSummary,
  ContestPastMonthItem,
  ContestPhase,
  ContestSortKey,
  RankHistory,
} from '@/types/community';
import { FONT_2XL, FONT_2XS, FONT_LG, FONT_MD, FONT_SM, FONT_XL, FONT_XS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

/**
 * 콘테스트 > 진행중 — 월간 주기 최종안 (핸드오프 contest-final-mockup.html 02~03 섹션,
 * 목업 community-feed.html의 .phase[data-phase] 4종을 그대로 따른다).
 * phase(SUBMITTING/VOTING/RESULT/ENDED)는 서버가 계산해 내려주는 값이라 이 컴포넌트는
 * 분기만 하고 판정 로직은 갖지 않는다. 세그먼트/서브탭은 상위(ContestSegment) 담당.
 */

const PINK = '#E31B59';
const INK = '#000000';
const GRAY_DISABLED = '#c7c7cc';
const SUB = '#8e8e93';
const FILL = '#f5f5f7';
const HAIRLINE = 'rgba(0,0,0,0.07)';

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
      <Text allowFontScaling={false} style={{ flex: 1, paddingLeft: normalize(28), fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, letterSpacing: -0.7, color: INK }}>
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
      style={{ margin: normalize(16), marginTop: normalize(16), marginHorizontal: normalize(28), height: normalize(72), paddingHorizontal: normalize(14), borderRadius: normalize(16), backgroundColor: FILL, flexDirection: 'row', alignItems: 'center', gap: normalize(12) }}
    >
      {/* 1~3위 썸네일을 10씩 겹친다 — 뒤 순위가 위로 올라오도록 목업과 같은 순서로 렌더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
        {award.podiumGradients.map((gradient, index) => (
          <LinearGradient
            key={index}
            colors={gradient}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={{
              width: normalize(34),
              height: normalize(34),
              borderRadius: normalize(9),
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
    <View style={{ margin: normalize(28), marginTop: normalize(24), marginBottom: 0, paddingTop: normalize(24), borderTopWidth: 1, borderTopColor: HAIRLINE, flexDirection: 'row', alignItems: 'center', gap: normalize(12) }}>
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
    <Pressable onPress={onPress} style={{ width: '48%', borderRadius: normalize(16), overflow: 'hidden', backgroundColor: FILL }}>
      <View style={{ width: '100%', aspectRatio: 1 }}>
        <LinearGradient colors={entry.gradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      </View>
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
  return (
    <View style={{ width: '48%', borderRadius: normalize(16), overflow: 'hidden', backgroundColor: FILL }}>
      <Pressable onPress={onPress} style={{ width: '100%', aspectRatio: 1 }}>
        <LinearGradient colors={entry.gradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: normalize(9), paddingHorizontal: normalize(12), paddingBottom: normalize(11), gap: normalize(8) }}>
        <Pressable onPress={onPress} style={{ flex: 1, minWidth: 0 }}>
          <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: INK }}>
            {entry.author}
          </Text>
          <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB, marginTop: normalize(2) }}>
            {`${entry.spot} · ${entry.shotAtLabel}`}
          </Text>
        </Pressable>
        <Pressable
          onPress={onVote}
          disabled={spent}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={entry.voted ? '투표함' : '투표'}
          style={{ width: normalize(28), height: normalize(28), borderRadius: normalize(14), alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: entry.voted ? 'rgba(227,27,89,0.1)' : spent ? '#e6e6ea' : PINK }}
        >
          {entry.voted ? (
            <Check size={normalize(14)} color={PINK} strokeWidth={2.6} />
          ) : (
            <ThumbsUp size={normalize(15)} color={spent ? '#b8b8be' : '#fff'} strokeWidth={1.9} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

interface Props {
  phase: ContestPhase;
  contest: ContestInfo;
  lastMonthAward: ContestAwardSummary;
  submitFeed: ContestEntry[];
  voteEntries: ContestEntry[];
  sort: ContestSortKey;
  onChangeSort: (sort: ContestSortKey) => void;
  rankHistory: RankHistory;
  votesLeft: number;
  maxVotes: number;
  myEntryCount: number;
  maxEntries: number;
  nextContest: ContestInfo;
  /**
   * 7b — 다음 콘테스트의 주제·일정이 아직 정해지지 않은 상태. ENDED에서만 의미가 있다.
   * nextContest를 nullable로 두면 RESULT(발표 당일)에서도 null 검사를 강요받는데,
   * 그쪽은 새 주기가 반드시 있으므로 플래그로 분리한다.
   */
  nextScheduled?: boolean;
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
  lastMonthAward,
  submitFeed,
  voteEntries,
  sort,
  onChangeSort,
  rankHistory,
  votesLeft,
  maxVotes,
  myEntryCount,
  maxEntries,
  nextContest,
  nextScheduled = true,
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
  const openAward = () => onSelectPastItem({ id: 'award', monthLabel: lastMonthAward.monthLabel, theme: lastMonthAward.theme, winnerHandle: lastMonthAward.winnerHandle, meta: '', myRank: null, kind: 'award', gradient: ['#1a1530', '#5a3355', '#d4856a'] });
  // 1인 3장이 상한 — 다 쓰면 출품 CTA를 잠근다(서버가 거절하기 전에 클라이언트에서 먼저 막는다)
  const isFull = myEntryCount >= maxEntries;
  // 펼치면 히어로를 줄여 그래프가 첫 화면에 들어오게 한다(목업 .is-expanded)
  const [rankPanelOpen, setRankPanelOpen] = React.useState(false);

  return (
    // flexGrow: 1 — 내용이 화면보다 짧을 때 빈 상태가 남은 공간을 차지해 세로 중앙에 설 수 있게 한다
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: normalize(24) }}>
      {phase === 'SUBMITTING' && (
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
                <View style={{ width: '41%', height: '100%', backgroundColor: '#fff' }} />
              </View>
            </View>
          </View>

          <AwardRow award={lastMonthAward} onPress={openAward} />

          {submitFeed.length === 0 ? (
            // flex: 1은 남는 공간만 채운다 — 히어로·수상작 행이 화면을 거의 채우면 거의 안 늘어나므로 최소 높이를 따로 준다
            <View style={{ flex: 1, minHeight: normalize(260), justifyContent: 'center', paddingHorizontal: normalize(28), alignItems: 'center' }}>
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
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: normalize(20), paddingHorizontal: normalize(28) }}>
                {submitFeed.map((entry) => (
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

      {phase === 'VOTING' && (
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
                다음 달 1일 결과 발표
              </Text>
            </View>
          </View>

          <ContestRankPanel history={rankHistory} open={rankPanelOpen} onToggle={() => setRankPanelOpen((v) => !v)} onOpenEntry={onOpenEntry} />

          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: normalize(14), borderBottomWidth: 1, borderBottomColor: HAIRLINE }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', height: normalize(34), paddingLeft: normalize(28), gap: normalize(14) }}>
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

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: normalize(20), paddingHorizontal: normalize(28), paddingTop: normalize(20) }}>
            {voteEntries.map((entry) => (
              <VoteEntryCard key={entry.id} entry={entry} votesLeft={votesLeft} onVote={() => onVote(entry.id)} onPress={() => onOpenEntry(entry.id)} />
            ))}
          </View>

          {/* 투표 기간에도 내 출품작은 확인·삭제할 수 있다(추가 출품만 막힌다) — 시트 8f로 가는 유일한 경로 */}
          {myEntryCount > 0 && (
            <Pressable onPress={onOpenMyEntries} style={{ marginHorizontal: normalize(28), marginTop: normalize(20), height: normalize(44), paddingHorizontal: normalize(16), borderRadius: normalize(22), backgroundColor: FILL, flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}>
              <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: INK }}>
                {`내 출품작 ${myEntryCount}개`}
              </Text>
              <ChevronRight size={normalize(16)} color="#c7c7cc" strokeWidth={2} />
            </Pressable>
          )}

          <Footbar
            topic={`${contest.theme} · 투표 마감 ${contest.voteDeadlineLabel}`}
            state={`내 출품작 ${myEntryCount}개`}
            ctaLabel={`${contest.entryCount}개 출품 모두 보기`}
            onPressCta={onSeeAll}
          />
        </>
      )}

      {phase === 'RESULT' && (
        <>
          <View style={{ marginHorizontal: normalize(28), marginTop: normalize(16) }}>
            <Pressable onPress={openAward} style={{ width: '100%', padding: normalize(18), paddingHorizontal: normalize(20), borderRadius: normalize(20), backgroundColor: 'rgba(227,27,89,0.06)', flexDirection: 'row', alignItems: 'center', gap: normalize(14) }}>
              <View style={{ width: normalize(56), height: normalize(56), borderRadius: normalize(14), backgroundColor: '#5a3355', flexShrink: 0 }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: PINK }}>
                  결과 발표 · 오늘
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: INK, marginTop: normalize(3) }}>
                  {`${lastMonthAward.monthLabel} · ${lastMonthAward.rank}위`}
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB, marginTop: normalize(2) }}>
                  {`${lastMonthAward.theme} · ${lastMonthAward.voteCount}표`}
                </Text>
              </View>
              <ChevronRight size={normalize(18)} color="#c7c7cc" strokeWidth={2} />
            </Pressable>
          </View>

          <View style={{ position: 'relative', height: normalize(280), overflow: 'hidden', margin: normalize(16), marginTop: normalize(16), marginHorizontal: normalize(28), borderRadius: normalize(24) }}>
            <LinearGradient colors={['#0d0b22', '#241f4a', '#4b4380', '#8a7fb0', '#c9bfe0']} locations={[0, 0.32, 0.64, 0.88, 1]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            <HeroScrim />
            <View style={{ position: 'absolute', left: normalize(20), right: normalize(20), bottom: normalize(20) }}>
              <View style={{ alignSelf: 'flex-start', height: normalize(24), justifyContent: 'center', paddingHorizontal: normalize(10), borderRadius: normalize(12), backgroundColor: PINK }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, letterSpacing: 1.6, color: '#fff' }}>
                  {`${nextContest.monthLabel} · 출품 기간`}
                </Text>
              </View>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XL, letterSpacing: -1, color: '#fff', marginTop: normalize(10) }}>
                {nextContest.theme}
              </Text>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: 'rgba(255,255,255,0.88)', marginTop: normalize(12) }}>
                {nextContest.themeDesc}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: normalize(16) }}>
                <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: 'rgba(255,255,255,0.86)' }}>
                  {`${nextContest.participantCount}명 · ${nextContest.entryCount}개 출품`}
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: '#fff' }}>
                  {`출품 마감 ${nextContest.submitDeadlineLabel}`}
                </Text>
              </View>
              <View style={{ height: normalize(4), borderRadius: normalize(2), backgroundColor: 'rgba(255,255,255,0.34)', overflow: 'hidden', marginTop: normalize(8) }}>
                <View style={{ width: '4%', height: '100%', backgroundColor: '#fff' }} />
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: normalize(28), paddingTop: normalize(22), paddingBottom: normalize(12) }}>
            <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, letterSpacing: -0.7, color: INK }}>
              새로 올라온 출품작
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: SUB }}>
              {submitFeed.length}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: normalize(20), paddingHorizontal: normalize(28) }}>
            {submitFeed.map((entry) => (
              <PlainEntryCard key={entry.id} entry={entry} onPress={() => onOpenEntry(entry.id)} />
            ))}
          </View>

          <Footbar
            topic={`${nextContest.theme} · 출품 마감 ${nextContest.submitDeadlineLabel}`}
            state={isFull ? '출품을 다 썼어요' : myEntryCount > 0 ? `${maxEntries - myEntryCount}개 더 낼 수 있어요` : '아직 출품하지 않았어요'}
            ctaLabel="출품하기"
            ctaIcon={<Camera size={normalize(16)} color={isFull ? '#b8b8be' : '#fff'} strokeWidth={1.9} />}
            onPressCta={onOpenSubmit}
            ctaDisabled={isFull}
          />
        </>
      )}

      {phase === 'ENDED' && (
        <>
          <View style={{ margin: normalize(18), marginTop: normalize(18), marginHorizontal: normalize(28), padding: normalize(28), paddingHorizontal: normalize(24), borderRadius: normalize(20), backgroundColor: FILL, alignItems: 'center' }}>
            <View style={{ height: normalize(24), paddingHorizontal: normalize(12), borderRadius: normalize(12), backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: nextScheduled ? SUB : GRAY_DISABLED }}>
                다음 콘테스트
              </Text>
            </View>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, letterSpacing: -0.7, color: INK, marginTop: normalize(12) }}>
              {nextScheduled ? nextContest.theme : '준비 중이에요'}
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: SUB, marginTop: normalize(6), textAlign: 'center', lineHeight: FONT_SM * 1.5 }}>
              {nextScheduled ? nextContest.themeDesc : '주제와 일정이 정해지면 알려드릴게요'}
            </Text>
            {/* 7b는 약속할 날짜가 없다 — 아이콘·글자를 한 단계 낮추고 굵기도 뺀다 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8), marginTop: normalize(14) }}>
              <Calendar size={normalize(15)} color={nextScheduled ? INK : GRAY_DISABLED} strokeWidth={2} />
              <Text
                allowFontScaling={false}
                style={{ fontFamily: nextScheduled ? 'Pretendard-SemiBold' : 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: nextScheduled ? INK : SUB }}
              >
                {nextScheduled ? `${nextContest.monthLabel} 1일 시작` : '일정 미정'}
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

          <View style={{ flexDirection: 'row', alignItems: 'baseline', paddingTop: normalize(20), paddingBottom: normalize(12) }}>
            <Text allowFontScaling={false} style={{ flex: 1, paddingLeft: normalize(28), fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: INK }}>
              지난 콘테스트
            </Text>
            <Pressable onPress={onSeeAllPast} style={{ paddingRight: normalize(28) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: PINK }}>
                전체 보기
              </Text>
            </Pressable>
          </View>
          {pastItems.map((item) => (
            <Pressable key={item.id} onPress={() => onSelectPastItem(item)} style={{ width: '100%', height: normalize(84), paddingHorizontal: normalize(28), flexDirection: 'row', alignItems: 'center', gap: normalize(12) }}>
              <View style={{ width: normalize(60), height: normalize(60), borderRadius: normalize(14), flexShrink: 0, backgroundColor: item.gradient[0] }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: INK }}>
                  {item.theme}
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB, marginTop: normalize(3) }}>
                  {`${item.monthLabel} · ${item.meta}`}
                </Text>
              </View>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB }}>
                {item.myRank == null ? '출품하지 않음' : `내 순위 ${item.myRank}위`}
              </Text>
            </Pressable>
          ))}
        </>
      )}
    </ScrollView>
  );
}
