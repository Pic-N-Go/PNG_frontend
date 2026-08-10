import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { ContestPastMonthItem } from '@/types/community';
import { CONTENT_PADDING, FONT_LG, FONT_MD, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

/**
 * 콘테스트 > 지난 — 시안 15a(회차 리스트)·15b(빈 상태). 가장 최근 결과는 진행중 탭 상단
 * 요약 행에 있어서 여기 첫 행은 항상 전전 달이다(ContestSegment의 PAST_ITEMS가 이미 그렇게 구성됨).
 */

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';
const SUB = '#8e8e93';

interface Props {
  items: ContestPastMonthItem[];
  onSelectItem: (item: ContestPastMonthItem) => void;
}

export default function ContestPastTab({ items, onSelectItem }: Props) {
  if (items.length === 0) {
    return (
      <View style={{ flex: 1, paddingTop: normalize(96), paddingHorizontal: CONTENT_PADDING, alignItems: 'center' }}>
        <View style={{ width: normalize(56), height: normalize(56), borderRadius: normalize(28), backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', marginBottom: normalize(16) }}>
          <CalendarDays size={normalize(24)} color="#b8b8be" strokeWidth={1.7} />
        </View>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000' }}>
          아직 끝난 콘테스트가 없어요
        </Text>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: SUB, marginTop: normalize(6) }}>
          첫 결과는 9월 1일에 발표돼요
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: normalize(28), paddingTop: normalize(18), gap: normalize(20) }} showsVerticalScrollIndicator={false}>
      {items.map((item) => (
        <Pressable key={item.id} onPress={() => onSelectItem(item)} style={{ width: '100%', borderRadius: normalize(18), overflow: 'hidden', backgroundColor: SURFACE }}>
          <View style={{ width: '100%', aspectRatio: 334 / 172, backgroundColor: item.gradient[0] }}>
            <View style={{ position: 'absolute', top: normalize(12), left: normalize(12), height: normalize(24), paddingHorizontal: normalize(10), borderRadius: normalize(12), backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: '#000' }}>
                {item.monthLabel}
              </Text>
            </View>
            <View style={{ position: 'absolute', bottom: normalize(12), left: normalize(12), height: normalize(24), paddingHorizontal: normalize(10), borderRadius: normalize(12), backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: '#fff' }}>
                {`1위 ${item.winnerHandle}`}
              </Text>
            </View>
          </View>
          <View style={{ padding: normalize(16), paddingTop: normalize(14), flexDirection: 'row', alignItems: 'center', gap: normalize(10) }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: '#000' }}>
                {item.theme}
              </Text>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB, marginTop: normalize(3) }}>
                {item.meta}
              </Text>
            </View>
            <View
              style={{
                height: normalize(26),
                paddingHorizontal: normalize(10),
                borderRadius: normalize(13),
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backgroundColor: item.kind === 'award' ? 'rgba(227,27,89,0.1)' : '#fff',
              }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: item.kind === 'award' ? ACCENT : item.kind === 'none' ? SUB : '#000' }}>
                {item.myRank == null ? '미출품' : `내 ${item.myRank}위`}
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
