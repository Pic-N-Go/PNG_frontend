import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Check, ChevronLeft, ChevronRight, CircleAlert, Image as ImageIcon, RotateCw, ThumbsUp } from 'lucide-react-native';
import MyVotesSheet from '@/components/community/MyVotesSheet';
import Toast from '@/components/common/Toast';
import DevStateSwitch from '@/components/common/DevStateSwitch';
import { CommunityDetailStackParamList } from '@/navigation/stacks/CommunityDetailStack';
import { ContestEntry, ContestSortKey, MyVoteEntry } from '@/types/community';
import { BUTTON_RADIUS, CARD_RADIUS, CONTENT_PADDING, FONT_2XS, FONT_LG, FONT_MD, FONT_SM, FONT_XS, HAIRLINE_WIDTH, HEADER_HEIGHT } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { voteHaptic } from '@/utils/haptics';
import { BRAND, BRAND_TINT, CARD, HAIRLINE } from '@/constants/colors';

/**
 * 콘테스트 > 전체 출품작 목록 — 목업 contest-all-entries.html 1:1, 두 가지 용도로 쓰인다.
 * (1) 투표 기간(1a·1c·1d·1e): 정렬 최신순(기본)·득표순 2종, 순위·득표수 비공개, 투표 28px 원형 버튼
 * (2) 지난 콘테스트(1b): route.params.mode === 'past' — 결과가 확정된 뒤라 순위 배지·득표수를 노출하고
 *     투표 UI는 없다(그 자리에 마감일). ContestResultScreen의 "전체 보기"에서 이 모드로 들어온다.
 */

const PINK = BRAND;
const INK = '#000000';
const FILL = CARD;
const GRAY_DISABLED = '#c7c7cc';
const GRAY_SUB = '#8e8e93';
const GRAY_SPENT = '#e6e6ea';
const GRAY_SPENT_ICON = '#b8b8be';

const GAP = 20;
const MAX_VOTES = 3;
const TOTAL_COUNT = 214;

const SORTS: { key: ContestSortKey; label: string }[] = [
  { key: 'latest', label: '최신순' },
  { key: 'votes', label: '득표순' },
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
// 투표 기간에는 득표수를 노출하지 않는다. 메타는 "스팟 · 출품 시각"
const LATEST_NAMES = ['@rimi', '@dokyum', '@haneul', '@jiwoo_p', '@seora', '@taeho', '@nayeon', '@eunji'];
const SPOTS = ['다대포', '청사포', '송정', '이기대', '광안리', '해운대', '태종대', '감천'];
const SHOT_TIMES = ['05:32', '18:04', '05:48', '19:12', '05:21', '18:37', '05:44', '19:02'];
// 랜덤이 없어지면서 커서 페이징의 seed 파라미터도 필요 없어졌다
const VOTE_ORDER = [4, 0, 2, 6, 1, 5, 3, 7];

const PAST_NAMES = ['@sunset_jk', '@minsoo', '@yujin', '@haneul', '@jiwoo_p', '@seora', '@taeho', '@nayeon'];
const PAST_VOTES = [214, 187, 156, 98, 74, 61, 45, 32];

function buildVoteEntries(sort: ContestSortKey): ContestEntry[] {
  const order = sort === 'votes' ? VOTE_ORDER : [0, 1, 2, 3, 4, 5, 6, 7];
  return order.map((i) => ({
    id: String(i),
    author: LATEST_NAMES[i],
    spot: SPOTS[i],
    shotAtLabel: SHOT_TIMES[i],
    votes: 0,
    voted: false,
    gradient: GRADIENTS[i],
  }));
}

function buildPastEntries(sort: 'ranked' | 'latest'): ContestEntry[] {
  const order = sort === 'ranked' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  return order.map((i, pos) => ({
    id: String(i),
    author: PAST_NAMES[i],
    rank: sort === 'ranked' ? pos + 1 : i + 1,
    votes: PAST_VOTES[i],
    voted: false,
    gradient: GRADIENTS[i],
    spot: SPOTS[i],
  }));
}

/* ── 투표 버튼 (28px 원형) ─────────────────────────────── */

function VoteButton({ voted, disabled, onPress }: { voted: boolean; disabled: boolean; onPress: () => void }) {
  // 이미 투표한 카드는 표가 없어도 눌러서 취소할 수 있어야 한다 — 막히는 건 "표가 없는데 새로 투표"뿐이다.
  const spent = disabled && !voted;
  return (
    <Pressable
      onPress={onPress}
      disabled={spent}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={voted ? '투표함' : '투표'}
      className="items-center justify-center"
      style={{
        width: normalize(28),
        height: normalize(28),
        borderRadius: normalize(14),
        flexShrink: 0,
        backgroundColor: voted ? BRAND_TINT : spent ? GRAY_SPENT : PINK,
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
  mode,
  votesLeft,
  onVote,
  onPress,
}: {
  item: ContestEntry;
  width: number;
  mode: 'voting' | 'past';
  votesLeft: number;
  onVote: (id: string) => void;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ width, borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: FILL }}>
      {/* 투표 기간에는 사진 위에 아무것도 얹지 않는다. 지난 콘테스트만 순위 배지 예외 */}
      <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#ededf1' }}>
        <LinearGradient colors={item.gradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        {mode === 'past' && (
          <View
            className="items-center justify-center"
            style={{ position: 'absolute', top: normalize(10), left: normalize(10), height: normalize(22), paddingHorizontal: normalize(8), borderRadius: normalize(11), backgroundColor: 'rgba(255,255,255,0.92)' }}
          >
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, letterSpacing: -0.1, color: INK }}>
              {`${item.rank}위`}
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
            {mode === 'past' ? `${item.votes}표 · ${item.spot}` : `${item.spot} · ${item.shotAtLabel}`}
          </Text>
        </View>
        {mode === 'voting' && <VoteButton voted={item.voted} disabled={votesLeft <= 0} onPress={() => onVote(item.id)} />}
      </View>
    </Pressable>
  );
}

function SkeletonCard({ width }: { width: number }) {
  return (
    <View style={{ width, borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: FILL, opacity: 0.7 }}>
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
  /** 없으면 CTA를 렌더하지 않는다 — 누를 수 없는 버튼을 보여주지 않는다 */
  onPressCta?: () => void;
}) {
  return (
    // 네비 아래 영역의 기하학적 중앙은 화면 전체로 보면 아래로 치우친다 — paddingBottom만큼 끌어올려 시각 중앙에 맞춘다
    <View className="flex-1 items-center justify-center" style={{ paddingHorizontal: CONTENT_PADDING, paddingBottom: normalize(96) }}>
      <View className="items-center justify-center" style={{ width: normalize(56), height: normalize(56), borderRadius: normalize(28), backgroundColor: FILL, marginBottom: normalize(14) }}>
        {icon}
      </View>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: INK, marginTop: normalize(4) }}>
        {title}
      </Text>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: GRAY_SUB, marginTop: normalize(6) }}>
        {desc}
      </Text>
      {onPressCta && (
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
      )}
    </View>
  );
}

/* ── 화면 ─────────────────────────────────────────────── */

export default function ContestAllEntriesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CommunityDetailStackParamList>>();
  const route = useRoute<RouteProp<CommunityDetailStackParamList, 'ContestAllEntries'>>();
  const mode = route.params?.mode ?? 'voting';
  const submitTarget = route.params?.submitTarget;

  const [sort, setSort] = useState<ContestSortKey>('latest');
  const [pastSort, setPastSort] = useState<'ranked' | 'latest'>('ranked');
  const [votesLeft, setVotesLeft] = useState(MAX_VOTES);
  const [votedIds, setVotedIds] = useState<Record<string, true>>({});
  const [votedAtLabel, setVotedAtLabel] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);
  const [myVotesSheetVisible, setMyVotesSheetVisible] = useState(false);
  // 목록 fetch가 붙기 전까지 빈·에러 상태에는 도달 경로가 없다. __DEV__ 스위처로만 열린다.
  const [devState, setDevState] = useState<'list' | 'empty' | 'error'>('list');

  const voteEntries = useMemo(
    () => buildVoteEntries(sort).map((entry) => ({ ...entry, voted: !!votedIds[entry.id] })),
    [sort, votedIds],
  );
  const pastEntries = useMemo(() => buildPastEntries(pastSort), [pastSort]);
  const entries = mode === 'past' ? pastEntries : voteEntries;

  const openEntry = useCallback(
    (id: string) => navigation.navigate('ContestEntryDetail', { entryId: id, isEnded: mode === 'past' }),
    [navigation, mode],
  );

  // 투표 취소는 투표 기간 내 자유 — 완료 버튼을 다시 누르면 표 1개가 복구된다.
  const handleVote = useCallback(
    (id: string) => {
      const target = voteEntries.find((entry) => entry.id === id);
      if (!target) return;

      if (target.voted) {
        setVotedIds((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        const remaining = Math.min(MAX_VOTES, votesLeft + 1);
        setVotesLeft(remaining);
        voteHaptic();
        setToastMessage(`${target.author} 투표를 취소했어요 · ${remaining}/${MAX_VOTES}`);
        setToastVisible(true);
        return;
      }

      if (votesLeft <= 0) return;
      voteHaptic();
      setVotedIds((prev) => ({ ...prev, [id]: true }));
      setVotedAtLabel((prev) => ({ ...prev, [id]: '오늘 14:20' }));
      const remaining = votesLeft - 1;
      setVotesLeft(remaining);
      setToastMessage(`${target.author} 님에게 투표했어요 · ${remaining}/${MAX_VOTES}`);
      setToastVisible(true);
    },
    [votesLeft, voteEntries],
  );

  const myVoteEntries: MyVoteEntry[] = voteEntries
    .filter((entry) => entry.voted)
    .map((entry) => ({ id: entry.id, author: entry.author, spotLabel: entry.spot ?? '', votedAtLabel: votedAtLabel[entry.id] ?? '방금', gradient: entry.gradient }));

  const cardWidth = gridWidth > 0 ? (gridWidth - normalize(GAP)) / 2 : 0;
  const spent = mode === 'voting' && votesLeft <= 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right', 'bottom']}>
      <DevStateSwitch
        options={[
          { key: 'list', label: '목록' },
          { key: 'empty', label: '빈' },
          { key: 'error', label: '에러' },
        ]}
        value={devState}
        onChange={setDevState}
      />

      {/* 네비 — 히어로 없이 타이틀 + 총 개수. 검색 없음 */}
      <View className="flex-row items-center" style={{ height: HEADER_HEIGHT, paddingLeft: normalize(12), paddingRight: normalize(20), gap: normalize(4) }}>
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

      {devState === 'empty' && (
        <Placeholder
          icon={<ImageIcon size={normalize(24)} color={GRAY_SPENT_ICON} strokeWidth={1.7} />}
          title="아직 출품작이 없어요"
          desc={submitTarget ? `첫 번째로 ${submitTarget.theme} 사진을 올려보세요` : '첫 번째 출품작을 기다리고 있어요'}
          ctaLabel="출품하기"
          ctaIcon={<Camera size={normalize(16)} color="#fff" strokeWidth={1.9} />}
          ctaAccent
          // 남은 자리를 모르면 출품으로 보내지 않는다 — 화면이 기본값 3장으로 열려 상한이 무너진다
          onPressCta={submitTarget ? () => navigation.navigate('ContestSubmit', submitTarget) : undefined}
        />
      )}

      {devState === 'error' && (
        <Placeholder
          icon={<CircleAlert size={normalize(24)} color={GRAY_SPENT_ICON} strokeWidth={1.7} />}
          title="목록을 불러오지 못했어요"
          desc="네트워크 상태를 확인하고 다시 시도해주세요"
          ctaLabel="다시 시도"
          ctaIcon={<RotateCw size={normalize(16)} color={INK} strokeWidth={1.9} />}
          onPressCta={() => setDevState('list')}
        />
      )}

      {devState === 'list' && (
        <>
      {/* 정렬 바 — 칩(pill)이 아니라 배경 없는 텍스트 2개. 우측은 투표 기간엔 남은 표 pill, 지난 기간엔 마감일 */}
      <View className="flex-row items-center" style={{ paddingTop: normalize(6), paddingBottom: normalize(14), borderBottomWidth: HAIRLINE_WIDTH, borderBottomColor: HAIRLINE }}>
        <View className="flex-row items-center" style={{ height: normalize(34), paddingLeft: CONTENT_PADDING, gap: normalize(14) }}>
          {mode === 'voting'
            ? SORTS.map((option, index) => (
                <React.Fragment key={option.key}>
                  {index > 0 && <View style={{ width: normalize(3), height: normalize(3), borderRadius: normalize(2), backgroundColor: '#dcdce0' }} />}
                  <Pressable onPress={() => setSort(option.key)} hitSlop={{ top: 12, bottom: 12 }} accessibilityRole="button" accessibilityLabel={option.label}>
                    <Text allowFontScaling={false} style={{ fontFamily: sort === option.key ? 'Pretendard-SemiBold' : 'Pretendard-Medium', fontSize: FONT_SM, letterSpacing: -0.2, color: sort === option.key ? INK : GRAY_SUB }}>
                      {option.label}
                    </Text>
                  </Pressable>
                </React.Fragment>
              ))
            : (['ranked', 'latest'] as const).map((key, index) => (
                <React.Fragment key={key}>
                  {index > 0 && <View style={{ width: normalize(3), height: normalize(3), borderRadius: normalize(2), backgroundColor: '#dcdce0' }} />}
                  <Pressable onPress={() => setPastSort(key)} hitSlop={{ top: 12, bottom: 12 }} accessibilityRole="button" accessibilityLabel={key === 'ranked' ? '득표순' : '최신순'}>
                    <Text allowFontScaling={false} style={{ fontFamily: pastSort === key ? 'Pretendard-SemiBold' : 'Pretendard-Medium', fontSize: FONT_SM, letterSpacing: -0.2, color: pastSort === key ? INK : GRAY_SUB }}>
                      {key === 'ranked' ? '득표순' : '최신순'}
                    </Text>
                  </Pressable>
                </React.Fragment>
              ))}
        </View>
        <View style={{ flex: 1 }} />
        {mode === 'voting' ? (
          <Pressable
            onPress={() => setMyVotesSheetVisible(true)}
            className="flex-row items-center"
            style={{ height: normalize(32), paddingLeft: normalize(12), paddingRight: normalize(10), marginRight: CONTENT_PADDING, borderRadius: normalize(16), backgroundColor: FILL, gap: normalize(8) }}
          >
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
            <ChevronRight size={normalize(14)} color="#c7c7cc" strokeWidth={2} />
          </Pressable>
        ) : (
          <Text allowFontScaling={false} style={{ paddingRight: CONTENT_PADDING, fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: GRAY_SUB }}>
            7월 31일 종료
          </Text>
        )}
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(20), paddingBottom: normalize(28), rowGap: normalize(GAP) }}
        onLayout={(e) => setGridWidth(e.nativeEvent.layout.width - CONTENT_PADDING * 2)}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          spent ? (
            // 카드 전체를 흐리지 않는다 — 사진 감상이 목적인 화면이라 목록이 죽어 보인다.
            <View style={{ padding: normalize(12), borderRadius: normalize(12), backgroundColor: FILL, marginBottom: normalize(20) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, lineHeight: FONT_XS * 1.5, letterSpacing: -0.15, color: 'rgba(0,0,0,0.45)' }}>
                표 {MAX_VOTES}개를 모두 썼어요. 투표를 취소하면 다시 쓸 수 있어요
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) =>
          cardWidth > 0 ? (
            <EntryCard item={item} width={cardWidth} mode={mode} votesLeft={votesLeft} onVote={handleVote} onPress={() => openEntry(item.id)} />
          ) : (
            <SkeletonCard width={cardWidth || 1} />
          )
        }
        ListFooterComponent={
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: GRAY_DISABLED, textAlign: 'center', paddingTop: normalize(24) }}
          >
            {/* TODO(API): 커서 페이징(24개씩) 붙으면 onEndReached로 이어붙이고 이 문구는 마지막 페이지에만 */}
            출품작 {TOTAL_COUNT}개를 모두 봤어요
          </Text>
        }
      />
        </>
      )}

      {mode === 'voting' && (
        <MyVotesSheet
          visible={myVotesSheetVisible}
          onClose={() => setMyVotesSheetVisible(false)}
          entries={myVoteEntries}
          votesLeft={votesLeft}
          maxVotes={MAX_VOTES}
          onCancelVote={handleVote}
          onOpenEntry={openEntry}
        />
      )}

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

