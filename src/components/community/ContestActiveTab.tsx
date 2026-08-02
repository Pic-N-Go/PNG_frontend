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

const PODIUM_SCRIM: [string, string, string] = ['rgba(12,9,24,0.28)', 'rgba(12,9,24,0)', 'rgba(12,9,24,0.82)'];
const PODIUM_SCRIM_STOPS: [number, number, number] = [0, 0.34, 1];

const GRID_SCRIM: [string, string, string] = ['rgba(10,7,20,0.34)', 'rgba(10,7,20,0.02)', 'rgba(10,7,20,0.78)'];
const GRID_SCRIM_STOPS: [number, number, number] = [0, 0.3, 1];

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

function VotePill({ voted, count, disabled, onPress }: { voted: boolean; count: number; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || voted}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(4),
        height: normalize(28),
        paddingHorizontal: normalize(10),
        borderRadius: normalize(14),
        backgroundColor: voted ? PINK : 'rgba(255,255,255,0.2)',
        opacity: disabled && !voted ? 0.5 : 1,
      }}
    >
      {voted ? <Check size={normalize(12)} color="#fff" strokeWidth={2.4} /> : <ThumbsUp size={normalize(12)} color="#fff" strokeWidth={1.9} />}
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: '#fff' }}>
        {count}
      </Text>
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

function GridCard({ item, votesLeft, onVote, onPress }: { item: ContestVoteEntry; votesLeft: number; onVote: (id: string) => void; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ width: '48%', height: normalize(196), borderRadius: normalize(16), overflow: 'hidden', backgroundColor: '#efedea' }}>
      <LinearGradient colors={item.gradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <Scrim colors={GRID_SCRIM} locations={GRID_SCRIM_STOPS} />
      <View style={{ flex: 1, padding: normalize(10), justifyContent: 'space-between' }}>
        <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(10,7,20,0.45)', borderRadius: normalize(7), paddingHorizontal: normalize(7), paddingVertical: normalize(3) }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: '#fff' }}>
            {item.rank}위
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: normalize(6) }}>
          <Text allowFontScaling={false} numberOfLines={1} style={{ flexShrink: 1, fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: '#fff', ...TEXT_SHADOW }}>
            {item.author}
          </Text>
          <VotePill voted={item.voted} count={item.votes} disabled={votesLeft <= 0} onPress={() => onVote(item.id)} />
        </View>
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
  const [first, second, third] = ranking;
  const progress = Math.min(1, contest.participants / (contest.goal || 1));

  const openLightbox = (item: ContestVoteEntry) => setLightboxEntry(item);
  const closeLightbox = () => setLightboxEntry(null);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: normalize(24) }}>
        {/* 히어로 */}
        <View style={{ marginTop: normalize(14), height: normalize(372), overflow: 'hidden', borderBottomLeftRadius: normalize(30), borderBottomRightRadius: normalize(30), backgroundColor: '#1a1530' }}>
          <LinearGradient
            colors={['#1a1530', '#2d1b4e', '#8b4a6b', '#d4856a', '#f0c89a']}
            locations={[0, 0.32, 0.58, 0.78, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <Scrim colors={HERO_SCRIM} locations={HERO_SCRIM_STOPS} />
          <View style={{ flex: 1, paddingHorizontal: normalize(28), paddingTop: normalize(24), paddingBottom: normalize(26), justifyContent: 'space-between' }}>
            <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(10,7,20,0.42)', borderRadius: 999, paddingHorizontal: normalize(12), paddingVertical: normalize(6) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, letterSpacing: 2, color: '#fff' }}>
                {contest.label}
              </Text>
            </View>

            <View style={{ gap: normalize(18) }}>
              <View style={{ gap: normalize(8) }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XL, letterSpacing: -1.1, color: '#fff', ...TEXT_SHADOW }}>
                  {contest.title}
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, letterSpacing: -0.3, color: 'rgba(255,255,255,0.88)', ...TEXT_SHADOW }}>
                  {contest.subtitle}
                </Text>
              </View>

              <View style={{ gap: normalize(9) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(255,255,255,0.82)', ...TEXT_SHADOW }}>
                    {contest.participants}명 참여 · 목표 {contest.goal}명
                  </Text>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: '#fff', ...TEXT_SHADOW }}>
                    {contest.daysLeft}일 남음
                  </Text>
                </View>
                <View style={{ height: normalize(3), borderRadius: normalize(2), backgroundColor: 'rgba(255,255,255,0.28)', overflow: 'hidden' }}>
                  <View style={{ width: `${progress * 100}%`, height: '100%', borderRadius: normalize(2), backgroundColor: '#fff' }} />
                </View>
              </View>
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

        {/* 2·3위 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: normalize(28), paddingTop: normalize(12) }}>
          {[second, third].filter((item): item is ContestVoteEntry => !!item).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => openLightbox(item)}
              style={{ width: '48%', height: normalize(150), borderRadius: normalize(16), overflow: 'hidden', backgroundColor: '#1d2a2e' }}
            >
              <LinearGradient colors={item.gradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              <Scrim colors={PODIUM_SCRIM} locations={PODIUM_SCRIM_STOPS} />
              <View style={{ flex: 1, padding: normalize(11), justifyContent: 'space-between' }}>
                <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: normalize(8), paddingHorizontal: normalize(8), paddingVertical: normalize(3) }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: '#111' }}>
                    {item.rank}위
                  </Text>
                </View>
                <View style={{ gap: normalize(2) }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#fff', ...TEXT_SHADOW }}>
                    {item.author}
                  </Text>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(255,255,255,0.66)', ...TEXT_SHADOW }}>
                    {item.votes}표
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* 전체 출품작 */}
        <SectionHeader
          title="전체 출품작"
          right={
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: SUB }}>
              {totalCount}개 작품
            </Text>
          }
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: normalize(12), paddingHorizontal: normalize(28) }}>
          {submissions.map((item) => (
            <GridCard key={item.id} item={item} votesLeft={votesLeft} onVote={onVote} onPress={() => openLightbox(item)} />
          ))}
        </View>

        <View style={{ paddingHorizontal: normalize(28), paddingTop: normalize(14) }}>
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
      </ScrollView>

      {/* 하단 고정 CTA */}
      <View style={{ height: normalize(72), backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: HAIRLINE, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: normalize(28) }}>
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
          style={{ height: BUTTON_HEIGHT, paddingHorizontal: normalize(26), borderRadius: BUTTON_HEIGHT / 2, backgroundColor: PINK, flexDirection: 'row', alignItems: 'center', gap: normalize(7) }}
        >
          <Camera size={normalize(17)} color="#fff" strokeWidth={1.9} />
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#fff' }}>
            {hasSubmitted ? '교체하기' : '출품하기'}
          </Text>
        </Pressable>
      </View>

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
