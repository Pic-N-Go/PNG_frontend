import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ContestPastItem } from '@/types/community';
import { FONT_2XS, FONT_XS, FONT_SM, FONT_MD, FONT_LG } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';
const TEXT_SECONDARY = 'rgba(0,0,0,0.4)';

// 목업 고정 값 — 실제 회차 수 연동 전까지 정적 텍스트
const TOTAL_COUNT = 24;

interface Props {
  items: ContestPastItem[];
  onSelectItem: (item: ContestPastItem) => void;
}

export default function ContestPastTab({ items, onSelectItem }: Props) {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: normalize(24) }}>
      {/* 컴팩트 배너 */}
      <View style={{ paddingHorizontal: normalize(20), paddingVertical: normalize(16) }}>
        <LinearGradient
          colors={['#1a1530', '#2d1b4e', '#8b4a6b', '#d4856a', '#e8a87c', '#f0c89a']}
          locations={[0, 0.2, 0.45, 0.65, 0.82, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: normalize(120), borderRadius: normalize(16), overflow: 'hidden', padding: normalize(16), justifyContent: 'space-between' }}
        >
          <View className="flex-row items-baseline" style={{ gap: normalize(8) }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: 1, color: '#fff', opacity: 0.85 }}>
              WEEKLY
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.3, color: '#fff' }}>
              골든아워
            </Text>
          </View>
          <View className="flex-row items-center" style={{ gap: normalize(6) }}>
            <View className="items-center justify-center" style={{ height: normalize(22), paddingHorizontal: normalize(10), borderRadius: normalize(11), backgroundColor: 'rgba(0,0,0,0.35)' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: '#fff', letterSpacing: 0.3 }}>
                D-3
              </Text>
            </View>
            <View className="items-center justify-center" style={{ height: normalize(22), paddingHorizontal: normalize(10), borderRadius: normalize(11), backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: '#fff' }}>
                128명 참여
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* 지난 콘테스트 헤더 */}
      <View className="flex-row items-baseline justify-between" style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(12) }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2 }}>
          지난 콘테스트
        </Text>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: TEXT_SECONDARY, letterSpacing: -0.1 }}>
          총 {TOTAL_COUNT}회
        </Text>
      </View>

      {/* 2열 그리드 */}
      <View className="flex-row flex-wrap" style={{ paddingHorizontal: normalize(20), gap: normalize(10) }}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onSelectItem(item)}
            style={{ width: '47%', borderRadius: normalize(14), overflow: 'hidden', backgroundColor: SURFACE }}
          >
            <View style={{ aspectRatio: 1, backgroundColor: item.gradient[0], position: 'relative' }}>
              {item.isMine && (
                <View className="items-center justify-center absolute" style={{ top: normalize(8), right: normalize(8), height: normalize(22), paddingHorizontal: normalize(8), borderRadius: normalize(11), backgroundColor: ACCENT }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: '#fff', letterSpacing: -0.1 }}>
                    내 작품
                  </Text>
                </View>
              )}
            </View>
            <View style={{ paddingHorizontal: normalize(12), paddingTop: normalize(10), paddingBottom: normalize(12) }}>
              <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#000', letterSpacing: -0.2, lineHeight: FONT_SM * 1.3 }}>
                {item.theme}
              </Text>
              <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_2XS, color: TEXT_SECONDARY, letterSpacing: -0.1, marginTop: normalize(3) }}>
                {item.winnerHandle} · {item.voteCount}표
              </Text>
              <View className="flex-row items-center" style={{ gap: normalize(5), marginTop: normalize(8) }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.35)', letterSpacing: -0.1 }}>
                  {item.agoLabel}
                </Text>
                <View style={{ width: normalize(2), height: normalize(2), borderRadius: normalize(1), backgroundColor: 'rgba(0,0,0,0.15)' }} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.35)', letterSpacing: -0.1 }}>
                  참여 {item.participantCount}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      {/* 전체 보기 */}
      <View style={{ paddingHorizontal: normalize(20), paddingTop: normalize(12) }}>
        <View className="items-center justify-center" style={{ height: normalize(44), borderRadius: normalize(22), backgroundColor: SURFACE }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#000', letterSpacing: -0.2 }}>
            전체 {TOTAL_COUNT}회 보기
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
