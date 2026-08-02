import React from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Share } from 'lucide-react-native';
import { CommunityDetailStackParamList } from '@/navigation/stacks/CommunityDetailStack';
import { ContestResultDetail } from '@/types/community';
import { FONT_2XS, FONT_XS, FONT_SM, FONT_MD, FONT_LG, FONT_XL, GRID_PADDING } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

const SURFACE = '#f5f5f7';
const TEXT_SECONDARY = 'rgba(0,0,0,0.4)';
const ENTRY_GAP = normalize(8);

// 이번 스코프에서는 특정 회차와 동적으로 연결되지 않는 정적 목업 데이터
const RESULT: ContestResultDetail = {
  theme: '숲 산책',
  dateRangeLabel: '2026.06.30 – 07.06',
  participantCount: 65,
  podium: [
    { id: 'r1', rank: 1, author: { handle: '@forestday' }, captionMeta: '축령산 · 아침 6:20', gradient: ['#0a1a0f', '#4a8060', '#a8c090'], voteCount: 89 },
    { id: 'r2', rank: 2, author: { handle: '@moss.walk' }, captionMeta: '남해 편백숲', gradient: ['#1a1510', '#a08060', '#a08060'], voteCount: 54 },
    { id: 'r3', rank: 3, author: { handle: '@quiet.grove' }, captionMeta: '한라산 성판악', gradient: ['#020010', '#1a1545', '#1a1545'], voteCount: 37 },
  ],
  entries: [
    { id: 'r4', rank: 4, author: { handle: '' }, captionMeta: '', gradient: ['#0a1520', '#3a708a', '#3a708a'], voteCount: 28 },
    { id: 'r5', rank: 5, author: { handle: '' }, captionMeta: '', gradient: ['#232526', '#8e7b5a', '#8e7b5a'], voteCount: 22 },
    { id: 'r6', rank: 6, author: { handle: '' }, captionMeta: '', gradient: ['#1a0a0a', '#8a3030', '#8a3030'], voteCount: 18 },
    { id: 'r7', rank: 7, author: { handle: '' }, captionMeta: '', gradient: ['#0a2020', '#40a090', '#40a090'], voteCount: 14 },
  ],
};

const PODIUM_WIDTHS = [normalize(158), normalize(140), normalize(140)];

function rankBadgeColors(rank: number): [string, string] {
  if (rank === 2) return ['#c0c0c0', '#8a8a8a'];
  if (rank === 3) return ['#cd8c52', '#8a6030'];
  return ['#f0c89a', '#d4856a'];
}

export default function ContestResultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CommunityDetailStackParamList>>();
  const { width: windowWidth } = useWindowDimensions();
  // width:'%' + aspectRatio를 같은 노드에 함께 주면 flexWrap 컨테이너 안에서 높이가
  // 제대로 계산되지 않는 RN(Yoga) 이슈가 있어 실제 너비 기준 픽셀 크기를 직접 계산한다(2열).
  const entryCardSize = (windowWidth - GRID_PADDING * 2 - ENTRY_GAP) / 2;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View
        className="flex-row items-center"
        style={{ height: normalize(52), paddingHorizontal: normalize(20), gap: normalize(8), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}
      >
        <Pressable onPress={() => navigation.goBack()} className="items-center justify-center" style={{ width: normalize(32), height: normalize(32) }}>
          <ChevronLeft size={normalize(24)} color="#000" strokeWidth={1.8} />
        </Pressable>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.4 }}>
          콘테스트 결과
        </Text>
        <Pressable className="items-center justify-center" style={{ width: normalize(32), height: normalize(32), marginLeft: 'auto' }}>
          <Share size={normalize(18)} color="#000" strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: normalize(24) }}>
        {/* 결과 배너 */}
        <View style={{ paddingHorizontal: normalize(20), paddingTop: normalize(16), paddingBottom: normalize(12) }}>
          <LinearGradient
            colors={['#0a1a0f', '#4a8060', '#a8c090']}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: normalize(20), paddingVertical: normalize(18), borderRadius: normalize(16) }}
          >
            <View className="items-center justify-center self-start" style={{ height: normalize(22), paddingHorizontal: normalize(10), borderRadius: normalize(11), backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: '#fff', letterSpacing: 1 }}>
                종료
              </Text>
            </View>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, color: '#fff', letterSpacing: -0.6, marginTop: normalize(8) }}>
              {RESULT.theme}
            </Text>
            <View className="flex-row items-center" style={{ gap: normalize(8), marginTop: normalize(4) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(255,255,255,0.85)', letterSpacing: -0.15 }}>
                {RESULT.dateRangeLabel}
              </Text>
              <View style={{ width: normalize(2), height: normalize(2), borderRadius: normalize(1), backgroundColor: 'rgba(255,255,255,0.4)' }} />
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(255,255,255,0.85)', letterSpacing: -0.15 }}>
                참여 {RESULT.participantCount}명
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* 최종 순위 */}
        <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(6) }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2 }}>
            최종 순위
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: normalize(20), paddingTop: normalize(10), paddingBottom: normalize(8), gap: normalize(8) }}
        >
          {RESULT.podium.map((entry, index) => (
            <LinearGradient
              key={entry.id}
              colors={entry.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ width: PODIUM_WIDTHS[index], height: normalize(198), borderRadius: normalize(14), padding: normalize(10) }}
            >
              <LinearGradient
                colors={rankBadgeColors(entry.rank)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: normalize(10), left: normalize(10), width: normalize(26), height: normalize(26), borderRadius: normalize(13), alignItems: 'center', justifyContent: 'center' }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#fff' }}>
                  {entry.rank}
                </Text>
              </LinearGradient>
              <View style={{ position: 'absolute', bottom: normalize(10), left: normalize(10), right: normalize(10) }}>
                <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#fff', letterSpacing: -0.15 }}>
                  {entry.author.handle}
                </Text>
                <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(255,255,255,0.75)', marginTop: normalize(3) }}>
                  {entry.captionMeta}
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#fff', marginTop: normalize(4), letterSpacing: -0.15 }}>
                  {entry.voteCount}표
                </Text>
              </View>
            </LinearGradient>
          ))}
        </ScrollView>

        {/* 전체 참여작 */}
        <View className="flex-row items-baseline justify-between" style={{ paddingHorizontal: normalize(20), paddingTop: normalize(20), paddingBottom: normalize(12) }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2 }}>
            전체 참여작
          </Text>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: TEXT_SECONDARY, letterSpacing: -0.1 }}>
            {RESULT.participantCount}개
          </Text>
        </View>
        <View className="flex-row flex-wrap" style={{ paddingHorizontal: normalize(20), gap: ENTRY_GAP }}>
          {RESULT.entries.map((entry) => (
            <View key={entry.id} style={{ width: entryCardSize, height: entryCardSize, borderRadius: normalize(12), backgroundColor: entry.gradient[0], position: 'relative' }}>
              <View className="items-center justify-center absolute" style={{ top: normalize(8), left: normalize(8), height: normalize(20), paddingHorizontal: normalize(8), borderRadius: normalize(10), backgroundColor: 'rgba(0,0,0,0.35)' }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: '#fff' }}>
                  {entry.rank}
                </Text>
              </View>
              <View className="items-center justify-center absolute" style={{ top: normalize(8), right: normalize(8), height: normalize(20), paddingHorizontal: normalize(8), borderRadius: normalize(10), backgroundColor: 'rgba(0,0,0,0.35)' }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: '#fff' }}>
                  {entry.voteCount}표
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 전체 보기 */}
        <View style={{ paddingHorizontal: normalize(20), paddingTop: normalize(12) }}>
          <View className="items-center justify-center" style={{ height: normalize(44), borderRadius: normalize(22), backgroundColor: SURFACE }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#000', letterSpacing: -0.2 }}>
              전체 {RESULT.participantCount}개 보기
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
