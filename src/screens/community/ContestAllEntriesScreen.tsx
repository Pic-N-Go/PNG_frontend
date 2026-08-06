import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Check, ChevronLeft, CircleAlert, Image as ImageIcon, RotateCw, ThumbsUp } from 'lucide-react-native';
import Toast from '@/components/common/Toast';
import { ContestVoteEntry } from '@/types/community';
import { BUTTON_RADIUS, FONT_2XS, FONT_LG, FONT_MD, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { voteHaptic } from '@/utils/haptics';

/**
 * 콘테스트 > 전체 출품작 목록 — 핸드오프 시안 1a~1e
 * (~/Desktop/handoff/contest-all-entries-mockup.html, 목업 `contest-all-entries.html`).
 *
 * 진행중 탭의 "출품작 N개 모두 보기"에서 push로 열린다. 히어로를 다시 넣지 않고 네비 타이틀만 둔다.
 * 검색은 없다 — 훑어보며 투표하는 화면이고 내 작품은 "내 출품" 탭에 있다.
 *
 * 투표 수·남은 표는 이 화면의 로컬 state다. 서버 판정으로 옮기기 전까지는 진행중 탭과
 * 공유되지 않으므로, 두 화면을 오가면 표가 어긋나 보인다(API 연동 시 함께 해소).
 */

const PINK = '#E31B59';
const INK = '#111111';
const FILL = '#f5f5f7';
const GRAY_DISABLED = '#c7c7cc';
const GRAY_SUB = '#8e8e93';
const GRAY_SPENT = '#e6e6ea';
const GRAY_SPENT_ICON = '#b8b8be';
const HAIRLINE = 'rgba(0,0,0,0.06)';

const SIDE = 28;
const GAP = 20;
const MAX_VOTES = 3;
const TOTAL_COUNT = 128;

type SortKey = 'latest' | 'ranked' | 'random';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'latest', label: '최신순' },
  { key: 'ranked', label: '득표순' },
  { key: 'random', label: '랜덤' },
];

const GRADIENTS: [string, string, string][] = [
  ['#1a1530', '#5a3355', '#d4856a'],
  ['#12333a', '#2f5f5a', '#8fae9b'],
  ['#241a33', '#8b4a6b', '#e8a87c'],
  ['#2d1b4e', '#8b4a6b', '#f0c89a'],
  ['#1c1c2b', '#4a3a5e', '#c98f7a'],
  ['#0f1f2e', '#3f5a6b', '#d9a882'],
  ['#301c28', '#7a4152', '#e8a87c'],
  ['#171d33', '#4c4a72', '#caa27f'],
];
const LATEST_NAMES = ['@rimi', '@dokyum', '@haneul', '@jiwoo_p', '@seora', '@taeho', '@nayeon', '@eunji'];
const RANKED_NAMES = ['@sunset_jk', '@minsoo', '@yujin', '@haneul', '@jiwoo_p', '@seora', '@taeho', '@nayeon'];
const SPOTS = ['다대포', '청사포', '송정', '이기대', '광안리', '해운대', '태종대', '감천'];
const RANKED_VOTES = [67, 42, 31, 28, 21, 17, 14, 9];
const LATEST_VOTES = [3, 2, 6, 1, 4, 0, 2, 5];

interface Entry extends ContestVoteEntry {
  spot: string;
}

function buildEntries(sort: SortKey, order: number[]): Entry[] {
  const ranked = sort === 'ranked';
  return order.map((i, pos) => ({
    id: `${sort}-${i}`,
    rank: pos + 1,
    author: ranked ? RANKED_NAMES[i] : LATEST_NAMES[i],
    spot: SPOTS[i],
    votes: ranked ? RANKED_VOTES[i] : LATEST_VOTES[i],
    voted: false,
    gradient: GRADIENTS[i],
  }));
}

function shuffle(source: number[]): number[] {
  const a = source.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── 투표 버튼 (28px 원형) ─────────────────────────────── */

function VoteButton({ voted, disabled, onPress }: { voted: boolean; disabled: boolean; onPress: () => void }) {
  const spent = disabled && !voted;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || voted}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={voted ? '투표함' : '투표'}
      className="items-center justify-center"
      style={{
        width: normalize(28),
        height: normalize(28),
        borderRadius: normalize(14),
        flexShrink: 0,
        backgroundColor: voted ? 'rgba(227,27,89,0.1)' : spent ? GRAY_SPENT : PINK,
      }}
    >
      {voted ? (
        <Check size={normalize(14)} color={PINK} strokeWidth={2.6} />
      ) : (
        <ThumbsUp size={normalize(15)} color={spent ? GRAY_SPENT_ICON : '#fff'} strokeWidth={1.9} />
      )}
    </Pressable>
  );
}

/* ── 카드 ─────────────────────────────────────────────── */

function EntryCard({
  item,
  width,
  showRank,
  votesLeft,
  onVote,
}: {
  item: Entry;
  width: number;
  showRank: boolean;
  votesLeft: number;
  onVote: (id: string) => void;
}) {
  return (
    <View style={{ width, borderRadius: normalize(16), overflow: 'hidden', backgroundColor: FILL }}>
      {/* 사진 위에 텍스트를 얹지 않는다. 예외는 득표순의 순위 배지 하나뿐 */}
      <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#ededf1' }}>
        <LinearGradient colors={item.gradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        {showRank && (
          <View
            className="items-center justify-center"
            style={{ position: 'absolute', top: normalize(10), left: normalize(10), height: normalize(22), paddingHorizontal: normalize(8), borderRadius: normalize(11), backgroundColor: 'rgba(255,255,255,0.92)' }}
          >
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, letterSpacing: -0.1, color: INK }}>
              {item.rank}위
            </Text>
          </View>
        )}
      </View>
      <View className="flex-row items-center" style={{ paddingTop: normalize(9), paddingHorizontal: normalize(12), paddingBottom: normalize(11), gap: normalize(8) }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: INK }}>
            {item.author}
          </Text>
          <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: GRAY_SUB, marginTop: normalize(2) }}>
            {showRank ? `${item.votes}표 · ${item.spot}` : `${item.spot} · ${item.votes}표`}
          </Text>
        </View>
        <VoteButton voted={item.voted} disabled={votesLeft <= 0} onPress={() => onVote(item.id)} />
      </View>
    </View>
  );
}

function SkeletonCard({ width }: { width: number }) {
  return (
    <View style={{ width, borderRadius: normalize(16), overflow: 'hidden', backgroundColor: FILL, opacity: 0.7 }}>
      <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#ededf1' }} />
      <View style={{ paddingTop: normalize(9), paddingHorizontal: normalize(12), paddingBottom: normalize(11) }}>
        <View style={{ height: normalize(10), borderRadius: normalize(5), backgroundColor: GRAY_SPENT }} />
        <View style={{ height: normalize(10), width: '60%', borderRadius: normalize(5), backgroundColor: GRAY_SPENT, marginTop: normalize(6) }} />
      </View>
    </View>
  );
}

/* ── 빈 상태 · 에러 ────────────────────────────────────── */

function Placeholder({
  icon,
  title,
  desc,
  ctaLabel,
  ctaIcon,
  ctaAccent,
  onPressCta,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  ctaLabel: string;
  ctaIcon: React.ReactNode;
  ctaAccent?: boolean;
  onPressCta: () => void;
}) {
  return (
    <View className="items-center" style={{ paddingTop: normalize(96), paddingHorizontal: normalize(SIDE) }}>
      <View className="items-center justify-center" style={{ width: normalize(56), height: normalize(56), borderRadius: normalize(28), backgroundColor: FILL, marginBottom: normalize(14) }}>
        {icon}
      </View>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: INK, marginTop: normalize(4) }}>
        {title}
      </Text>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: GRAY_SUB, marginTop: normalize(6) }}>
        {desc}
      </Text>
      <Pressable
        onPress={onPressCta}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
        className="flex-row items-center"
        style={{ height: normalize(44), paddingHorizontal: normalize(22), borderRadius: BUTTON_RADIUS, marginTop: normalize(20), gap: normalize(6), backgroundColor: ctaAccent ? PINK : FILL }}
      >
        {ctaIcon}
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: ctaAccent ? '#fff' : INK }}>
          {ctaLabel}
        </Text>
      </Pressable>
    </View>
  );
}

/* ── 화면 ─────────────────────────────────────────────── */

export default function ContestAllEntriesScreen() {
  const navigation = useNavigation();

  const [sort, setSort] = useState<SortKey>('latest');
  const [votesLeft, setVotesLeft] = useState(MAX_VOTES);
  const [votedIds, setVotedIds] = useState<Record<string, true>>({});
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);

  // 랜덤은 세션 시드 고정 — 스크롤 중 순서가 흔들리지 않고, 재진입 시에만 재추첨된다.
  const randomOrder = useRef(shuffle([0, 1, 2, 3, 4, 5, 6, 7])).current;

  const entries = useMemo(() => {
    const order = sort === 'random' ? randomOrder : [0, 1, 2, 3, 4, 5, 6, 7];
    return buildEntries(sort, order).map((entry) => ({ ...entry, voted: !!votedIds[entry.id] }));
  }, [sort, randomOrder, votedIds]);


  // 되돌리기 없음 — 한 번 투표한 카드는 완료 상태로 고정된다.
  // 표가 하루 3개뿐이라 소비된 감각이 즉시 보여야 해서 토스트에 남은 표를 함께 넣는다.
  const handleVote = useCallback(
    (id: string) => {
      if (votesLeft <= 0 || votedIds[id]) return;
      const remaining = votesLeft - 1;
      const target = entries.find((entry) => entry.id === id);
      voteHaptic();
      setVotedIds((prev) => ({ ...prev, [id]: true }));
      setVotesLeft(remaining);
      setToastMessage(`${target?.author ?? ''} 님에게 투표했어요 · ${remaining}/${MAX_VOTES}`);
      setToastVisible(true);
    },
    [votesLeft, votedIds, entries],
  );

  const cardWidth = gridWidth > 0 ? (gridWidth - normalize(GAP)) / 2 : 0;
  const spent = votesLeft <= 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right', 'bottom']}>
      {/* 네비 — 히어로 없이 타이틀 + 총 개수. 검색 없음 */}
      <View className="flex-row items-center" style={{ height: normalize(52), paddingLeft: normalize(12), paddingRight: normalize(20), gap: normalize(4) }}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          className="items-center justify-center"
          style={{ width: normalize(40), height: normalize(40) }}
        >
          <ChevronLeft size={normalize(22)} color={INK} strokeWidth={2} />
        </Pressable>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: INK }}>
          전체 출품작
        </Text>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: GRAY_DISABLED, marginLeft: normalize(6) }}>
          {TOTAL_COUNT}
        </Text>
      </View>

      {/* 정렬 바 — 칩(pill)이 아니라 배경 없는 텍스트 3개. 투표 버튼과 형태가 겹치지 않게 한다. */}
      <View className="flex-row items-center" style={{ paddingTop: normalize(6), paddingBottom: normalize(14), borderBottomWidth: 1, borderBottomColor: HAIRLINE }}>
        <View className="flex-row items-center" style={{ height: normalize(34), paddingLeft: normalize(SIDE), gap: normalize(14) }}>
          {SORTS.map((option, index) => (
            <React.Fragment key={option.key}>
              {index > 0 && <View style={{ width: normalize(3), height: normalize(3), borderRadius: normalize(2), backgroundColor: '#dcdce0' }} />}
              <Pressable onPress={() => setSort(option.key)} hitSlop={{ top: 12, bottom: 12 }} accessibilityRole="button" accessibilityLabel={option.label}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: sort === option.key ? 'Pretendard-SemiBold' : 'Pretendard-Medium',
                    fontSize: FONT_SM,
                    letterSpacing: -0.2,
                    color: sort === option.key ? PINK : GRAY_SUB,
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            </React.Fragment>
          ))}
        </View>
        <View className="flex-row items-center" style={{ marginLeft: 'auto', paddingRight: normalize(SIDE), gap: normalize(8) }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: spent ? GRAY_DISABLED : GRAY_SUB }}>
            남은 표
          </Text>
          <View className="flex-row items-center" style={{ gap: normalize(4) }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ width: normalize(7), height: normalize(7), borderRadius: normalize(4), backgroundColor: i < votesLeft ? PINK : GRAY_SPENT }} />
            ))}
          </View>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: spent ? GRAY_DISABLED : INK }}>
            {votesLeft}/{MAX_VOTES}
          </Text>
        </View>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingHorizontal: normalize(SIDE), paddingTop: normalize(20), paddingBottom: normalize(28), rowGap: normalize(GAP) }}
        onLayout={(e) => setGridWidth(e.nativeEvent.layout.width - normalize(SIDE) * 2)}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.6}
        ListHeaderComponent={
          spent ? (
            // 카드 전체를 흐리지 않는다 — 사진 감상이 목적인 화면이라 목록이 죽어 보인다.
            <View style={{ padding: normalize(12), borderRadius: normalize(12), backgroundColor: FILL, marginBottom: normalize(20) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, lineHeight: FONT_XS * 1.5, letterSpacing: -0.15, color: 'rgba(0,0,0,0.45)' }}>
                오늘 쓸 수 있는 표를 모두 썼어요. 내일 다시 {MAX_VOTES}표가 채워집니다.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) =>
          cardWidth > 0 ? (
            <EntryCard item={item} width={cardWidth} showRank={sort === 'ranked'} votesLeft={votesLeft} onVote={handleVote} />
          ) : (
            <SkeletonCard width={cardWidth || 1} />
          )
        }
        ListFooterComponent={
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: GRAY_DISABLED, textAlign: 'center', paddingTop: normalize(24) }}
          >
            출품작 {TOTAL_COUNT}개를 모두 봤어요
          </Text>
        }
      />

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

/* 빈 상태·에러는 목록 fetch가 붙기 전까지 도달 경로가 없다. API 연동 시 아래를 렌더 분기에 연결한다. */
export function ContestAllEntriesEmpty({ onSubmit }: { onSubmit: () => void }) {
  return (
    <Placeholder
      icon={<ImageIcon size={normalize(24)} color={GRAY_SPENT_ICON} strokeWidth={1.7} />}
      title="아직 출품작이 없어요"
      desc="첫 번째로 골든아워를 담아보세요"
      ctaLabel="출품하기"
      ctaIcon={<Camera size={normalize(16)} color="#fff" strokeWidth={1.9} />}
      ctaAccent
      onPressCta={onSubmit}
    />
  );
}

export function ContestAllEntriesError({ onRetry }: { onRetry: () => void }) {
  return (
    <Placeholder
      icon={<CircleAlert size={normalize(24)} color={GRAY_SPENT_ICON} strokeWidth={1.7} />}
      title="목록을 불러오지 못했어요"
      desc="잠시 후 다시 시도해 주세요"
      ctaLabel="다시 시도"
      ctaIcon={<RotateCw size={normalize(16)} color={INK} strokeWidth={1.9} />}
      onPressCta={onRetry}
    />
  );
}
