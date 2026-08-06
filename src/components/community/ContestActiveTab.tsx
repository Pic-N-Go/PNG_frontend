import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Check, ChevronRight, ThumbsUp } from 'lucide-react-native';
import ContestPhotoLightbox from '@/components/community/ContestPhotoLightbox';
import { ContestGoalInfo, ContestPhotoEntry, ContestVoteEntry } from '@/types/community';
import { BUTTON_HEIGHT, FONT_2XL, FONT_2XS, FONT_LG, FONT_MD, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

/**
 * 콘테스트 > 진행중 — 핸드오프 "시안 1b" (~/Desktop/handoff/golden-hour-contest.html,
 * ContestTab.native.jsx) 기준 재구현. 세그먼트/서브탭은 상위(CommunityFeedScreen/ContestSegment)
 * 담당이라 이 컴포넌트는 히어로부터 하단 CTA 바까지 본문만 그린다.
 * 투표는 낙관적 업데이트 — 확인 모달 없이 즉시 반영(상위에서 처리, 이 컴포넌트는 순수 프레젠테이션).
 * 사진은 실제 업로드본이 없어 원본의 Image를 프로젝트 관례(LinearGradient 플레이스홀더)로 대체.
 */

const PINK = '#E31B59';
const INK = '#000000';
const SUB = '#8a8580';
const FILL = '#f5f5f7';
const HAIRLINE = 'rgba(0,0,0,0.07)';

const TEXT_SHADOW = {
  textShadowColor: 'rgba(10,7,20,0.55)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 8,
};

// 히어로: 상단 라벨용 약한 스크림 → 중간 투명 → 하단 텍스트 영역 강한 스크림 (사진 밝기 무관 고정값)
const HERO_SCRIM: [string, string, string, string, string, string] = [
  'rgba(10,7,20,0.42)',
  'rgba(10,7,20,0.06)',
  'rgba(10,7,20,0.06)',
  'rgba(10,7,20,0.58)',
  'rgba(10,7,20,0.88)',
  'rgba(10,7,20,0.94)',
];
const HERO_SCRIM_STOPS: [number, number, number, number, number, number] = [0, 0.26, 0.4, 0.66, 0.88, 1];

const FIRST_SCRIM: [string, string, string] = ['rgba(12,9,24,0.3)', 'rgba(12,9,24,0)', 'rgba(12,9,24,0.86)'];
const FIRST_SCRIM_STOPS: [number, number, number] = [0, 0.26, 1];

function Scrim({
  colors,
  locations,
}: {
  colors: [string, string, string] | [string, string, string, string, string, string];
  locations: readonly [number, number, ...number[]];
}) {
  return (
    <LinearGradient
      colors={colors}
      locations={locations}
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
}

/**
 * 투표 버튼 — 28px 원형 아이콘. 라벨 pill을 쓰지 않는다(157px 카드에서 너무 크고 정렬 텍스트와 겹침).
 * 흰 정보 영역 위에 놓이므로 어떤 사진에서도 대비가 일정하다. 되돌리기 없음.
 */
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
        backgroundColor: voted ? 'rgba(227,27,89,0.1)' : spent ? '#e6e6ea' : PINK,
      }}
    >
      {voted ? (
        <Check size={normalize(14)} color={PINK} strokeWidth={2.6} />
      ) : (
        <ThumbsUp size={normalize(15)} color={spent ? '#b8b8be' : '#fff'} strokeWidth={1.9} />
      )}
    </Pressable>
  );
}

function SectionHeader({ title, right }: { title: string; right: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: normalize(28), paddingTop: normalize(28), paddingBottom: normalize(14) }}>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: INK }}>
        {title}
      </Text>
      {right}
    </View>
  );
}

/**
 * 순위 카드 (2위~) — 전체 출품작 목록 화면과 같은 컴포넌트.
 * 사진 위에 얹는 것은 순위 배지뿐이고(배경 rgba(255,255,255,.92)라 어떤 사진에서도 읽힘),
 * 닉네임·득표수·투표 버튼은 사진 아래 정보 영역에 둔다.
 * 좋아요 수 pill은 투표 버튼과 혼동돼 제거했고 득표수는 메타 텍스트로 내렸다.
 */
function EntryCard({ item, votesLeft, onVote, onPress }: { item: ContestVoteEntry; votesLeft: number; onVote: (id: string) => void; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ width: '48%', borderRadius: normalize(16), overflow: 'hidden', backgroundColor: FILL }}>
      <View style={{ width: '100%', aspectRatio: 1, backgroundColor: item.gradient[0] }}>
        <LinearGradient colors={item.gradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <View
          className="items-center justify-center"
          style={{ position: 'absolute', top: normalize(10), left: normalize(10), height: normalize(22), paddingHorizontal: normalize(8), borderRadius: normalize(11), backgroundColor: 'rgba(255,255,255,0.92)' }}
        >
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, letterSpacing: -0.1, color: '#111' }}>
            {item.rank}위
          </Text>
        </View>
      </View>
      <View className="flex-row items-center" style={{ paddingTop: normalize(9), paddingHorizontal: normalize(12), paddingBottom: normalize(11), gap: normalize(8) }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: '#111' }}>
            {item.author}
          </Text>
          <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB, marginTop: normalize(2) }}>
            {item.place ? `${item.votes}표 · ${item.place}` : `${item.votes}표`}
          </Text>
        </View>
        <VoteButton voted={item.voted} disabled={votesLeft <= 0} onPress={() => onVote(item.id)} />
      </View>
    </Pressable>
  );
}

interface Props {
  contest: ContestGoalInfo;
  ranking: ContestVoteEntry[]; // 1~3위
  submissions: ContestVoteEntry[]; // 4위~
  totalCount: number;
  votesLeft: number;
  hasSubmitted: boolean;
  onVote: (id: string) => void;
  onSubmit: () => void;
  onSeeAll: () => void;
}

function toLightboxEntry(item: ContestVoteEntry): ContestPhotoEntry {
  return {
    id: item.id,
    rank: item.rank,
    author: { handle: item.author },
    captionMeta: item.place ?? `${item.votes}표`,
    gradient: item.gradient,
    voteCount: item.votes,
    isMyVote: item.voted,
  };
}

export default function ContestActiveTab({ contest, ranking, submissions, totalCount, votesLeft, hasSubmitted, onVote, onSubmit, onSeeAll }: Props) {
  const [lightboxEntry, setLightboxEntry] = React.useState<ContestVoteEntry | null>(null);
  const [first, ...podiumTail] = ranking;
  // 2·3위(ranking)와 4위~(submissions)를 한 그리드로 합친다 — 카드 컴포넌트가 같으므로 나눌 이유가 없다.
  const rest = [...podiumTail, ...submissions];
  const progress = Math.min(1, contest.participants / (contest.goal || 1));

  const openLightbox = (item: ContestVoteEntry) => setLightboxEntry(item);
  const closeLightbox = () => setLightboxEntry(null);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: normalize(24) }}>
        {/* 히어로 — 280px로 압축, 내용 하단 정렬.
            배경은 콘테스트 주제 사진이 원칙이고, 사진이 없으면 골든아워 그라디언트가 폴백. */}
        <View style={{ height: normalize(280), overflow: 'hidden', borderBottomLeftRadius: normalize(24), borderBottomRightRadius: normalize(24), backgroundColor: '#1a1530' }}>
          <LinearGradient
            colors={['#1a1530', '#2d1b4e', '#8b4a6b', '#d4856a', '#f0c89a']}
            locations={[0, 0.3, 0.62, 0.84, 1]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <Scrim colors={HERO_SCRIM} locations={HERO_SCRIM_STOPS} />
          <View style={{ position: 'absolute', left: normalize(28), right: normalize(28), bottom: normalize(20) }}>
            <View style={{ alignSelf: 'flex-start', height: normalize(24), justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: normalize(12), paddingHorizontal: normalize(10) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, letterSpacing: 1.6, color: 'rgba(255,255,255,0.92)' }}>
                {contest.label}
              </Text>
            </View>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XL, letterSpacing: -1, color: '#fff', marginTop: normalize(10), ...TEXT_SHADOW }}>
              {contest.title}
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: 'rgba(255,255,255,0.78)', marginTop: normalize(4), ...TEXT_SHADOW }}>
              {contest.subtitle}
            </Text>
            <View className="flex-row items-baseline" style={{ marginTop: normalize(16) }}>
              <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: 'rgba(255,255,255,0.72)', ...TEXT_SHADOW }}>
                {contest.participants}명 참여 · 목표 {contest.goal}명
              </Text>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: '#fff', ...TEXT_SHADOW }}>
                {contest.daysLeft}일 남음
              </Text>
            </View>
            <View style={{ height: normalize(3), borderRadius: normalize(2), backgroundColor: 'rgba(255,255,255,0.24)', overflow: 'hidden', marginTop: normalize(8) }}>
              <View style={{ width: `${progress * 100}%`, height: '100%', borderRadius: normalize(2), backgroundColor: '#fff' }} />
            </View>
          </View>
        </View>

        {/* 현재 순위 */}
        <SectionHeader
          title="현재 순위"
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: SUB }}>
                오늘 남은 표
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4) }}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={{ width: normalize(6), height: normalize(6), borderRadius: normalize(3), backgroundColor: i < votesLeft ? PINK : '#e2e0dd' }} />
                ))}
              </View>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: INK }}>
                {votesLeft}/3
              </Text>
            </View>
          }
        />

        {/* 1위 */}
        {first && (
          <Pressable
            onPress={() => openLightbox(first)}
            style={{ marginHorizontal: normalize(28), height: normalize(238), borderRadius: normalize(20), overflow: 'hidden', backgroundColor: '#2b2338' }}
          >
            <LinearGradient colors={first.gradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            <Scrim colors={FIRST_SCRIM} locations={FIRST_SCRIM_STOPS} />
            <View style={{ flex: 1, padding: normalize(16), justifyContent: 'space-between' }}>
              <View style={{ alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: normalize(9), paddingHorizontal: normalize(10), paddingVertical: normalize(5) }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: '#111' }}>
                  1위 · {first.votes}표
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <View style={{ gap: normalize(3) }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#fff', ...TEXT_SHADOW }}>
                    {first.author}
                  </Text>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(255,255,255,0.66)', ...TEXT_SHADOW }}>
                    {first.place}
                  </Text>
                </View>
                <Pressable
                  onPress={() => onVote(first.id)}
                  disabled={first.voted || votesLeft <= 0}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: normalize(5),
                    height: normalize(36),
                    paddingHorizontal: normalize(18),
                    borderRadius: normalize(18),
                    backgroundColor: first.voted ? 'rgba(255,255,255,0.2)' : PINK,
                    opacity: !first.voted && votesLeft <= 0 ? 0.5 : 1,
                  }}
                >
                  {first.voted && <Check size={normalize(14)} color="#fff" strokeWidth={2.4} />}
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#fff' }}>
                    {first.voted ? '투표함' : '투표'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}

        {/* 2위~ — 목록 화면과 같은 카드로 통일. 2·3위에만 투표 버튼이 없던 문제가 여기서 해소된다. */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: normalize(20), paddingHorizontal: normalize(28), paddingTop: normalize(20) }}>
          {rest.map((item) => (
            <EntryCard key={item.id} item={item} votesLeft={votesLeft} onVote={onVote} onPress={() => openLightbox(item)} />
          ))}
        </View>

        <View style={{ paddingHorizontal: normalize(28), paddingTop: normalize(20) }}>
          <Pressable
            onPress={onSeeAll}
            style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_HEIGHT / 2, backgroundColor: FILL, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: normalize(5) }}
          >
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#31302e' }}>
              출품작 {totalCount}개 모두 보기
            </Text>
            <ChevronRight size={normalize(15)} color="#31302e" strokeWidth={1.9} />
          </Pressable>
        </View>

        {/* 출품 상태 안내 + 출품/교체 — 화면 하단 고정이 아니라 페이지 맨 아래에 흐름대로 둔다.
            상시 노출되는 CTA가 아니므로 primary(52px)보다 작은 44px 보조 버튼으로 맞춘다. */}
        <View
          className="flex-row items-center justify-between"
          style={{ paddingHorizontal: normalize(28), paddingTop: normalize(24), marginTop: normalize(4), borderTopWidth: 1, borderTopColor: HAIRLINE }}
        >
          <View style={{ gap: normalize(2) }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: SUB }}>
              {contest.title} · {contest.daysLeft}일 남음
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: INK }}>
              {hasSubmitted ? '내 출품작 보기' : '아직 출품하지 않았어요'}
            </Text>
          </View>
          <Pressable
            onPress={onSubmit}
            accessibilityRole="button"
            accessibilityLabel={hasSubmitted ? '교체하기' : '출품하기'}
            className="flex-row items-center"
            style={{ height: normalize(44), paddingHorizontal: normalize(20), borderRadius: normalize(22), backgroundColor: PINK, gap: normalize(6) }}
          >
            <Camera size={normalize(16)} color="#fff" strokeWidth={1.9} />
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: '#fff' }}>
              {hasSubmitted ? '교체하기' : '출품하기'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>


      <ContestPhotoLightbox
        entry={lightboxEntry ? toLightboxEntry(lightboxEntry) : null}
        isVoted={!!lightboxEntry?.voted}
        onClose={closeLightbox}
        onVotePress={() => {
          if (lightboxEntry) onVote(lightboxEntry.id);
          closeLightbox();
        }}
      />
    </View>
  );
}
