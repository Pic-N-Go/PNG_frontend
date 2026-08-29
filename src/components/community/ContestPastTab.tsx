import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import ContestPhoto from '@/components/community/ContestPhoto';
import { ContestPastMonthItem } from '@/types/community';
import { CONTENT_PADDING, FONT_MD, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { BRAND, BRAND_TINT, CARD } from '@/constants/colors';

/**
 * 콘테스트 > 지난 — 시안 15a(회차 리스트)·15b(빈 상태).
 * 서버의 지난 목록(GET /contests, 발표 시각 내림차순)을 그대로 그린다. 첫 행이 곧 직전 회차이고,
 * 같은 회차가 진행중 탭 상단 수상 배너에도 나오는 건 의도된 중복이다.
 */

const ACCENT = BRAND;
const SURFACE = CARD;
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
          첫 회차가 끝나면 여기에 쌓여요
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: normalize(28), paddingTop: normalize(18), gap: normalize(20) }} showsVerticalScrollIndicator={false}>
      {items.map((item) => (
        <Pressable key={item.id} onPress={() => onSelectItem(item)} style={{ width: '100%', borderRadius: normalize(18), overflow: 'hidden', backgroundColor: SURFACE }}>
          <View style={{ width: '100%', aspectRatio: 334 / 172 }}>
            {/* 사진 위 오버레이 태그는 두지 않는다 — 회차(월)는 제목 왼쪽으로, 우승자 표기는 제거 */}
            <ContestPhoto gradient={item.gradient} photoUrl={item.photoUrl} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          </View>
          <View style={{ padding: normalize(16), paddingTop: normalize(14), flexDirection: 'row', alignItems: 'center', gap: normalize(10) }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6) }}>
                {/* 회차 라벨. 검정 배경은 CLAUDE.md에서 "컨트롤 활성" 표기라 정적 라벨엔 이례적이지만,
                    카드 배경(CARD)에서 흰 pill이 같은 행의 순위 배지와 구분되지 않아 이쪽을 택했다. */}
                <View style={{ height: normalize(24), paddingHorizontal: normalize(8), borderRadius: normalize(12), backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: '#fff' }}>
                    {item.monthLabel}
                  </Text>
                </View>
                {/* 제목이 길면 줄이고 월 태그는 밀리지 않게 둔다 */}
                <Text allowFontScaling={false} numberOfLines={1} style={{ flex: 1, minWidth: 0, fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000' }}>
                  {item.theme}
                </Text>
              </View>
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
                backgroundColor: item.kind === 'award' ? BRAND_TINT : '#fff',
              }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: item.kind === 'award' ? ACCENT : item.kind === 'none' ? SUB : '#000' }}>
                {/* 진행중 탭 "없음" 화면의 지난 콘테스트 행과 같은 문구를 쓴다 — 같은 뜻을 두 표현으로 쓰지 않는다 */}
                {item.myRank == null ? '출품하지 않음' : `내 순위 ${item.myRank}위`}
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
