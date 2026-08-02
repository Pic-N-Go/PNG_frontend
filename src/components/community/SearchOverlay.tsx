import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Clock, X } from 'lucide-react-native';
import { FONT_2XS, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';

const CATEGORY_CHIPS = ['전체', '게시글', '사진', '스팟', '사용자'];
const POPULAR_KEYWORDS = ['골든아워', '벚꽃 명소', '야경', '스냅사진', '해변', '경복궁'];
const RECOMMENDED_SPOTS = [
  { id: 'gwangalli', name: '광안리 해수욕장', postCount: 342, gradient: '#0f2027' },
  { id: 'gyeongbok', name: '경복궁', postCount: 218, gradient: '#4a1942' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ visible, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState(CATEGORY_CHIPS[0]);
  const [recentSearches, setRecentSearches] = useState(['광안리 일출', '경복궁 야간', '벚꽃']);

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', zIndex: 40 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: normalize(80) }}>
        <View className="flex-row items-center" style={{ paddingHorizontal: normalize(20), paddingTop: normalize(6), paddingBottom: normalize(12), gap: normalize(12) }}>
          <View className="flex-1 flex-row items-center" style={{ height: normalize(40), paddingHorizontal: normalize(14), borderRadius: normalize(20), backgroundColor: SURFACE, gap: normalize(10) }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="스팟, 게시글, 사용자 검색"
              placeholderTextColor="rgba(0,0,0,0.35)"
              allowFontScaling={false}
              autoFocus
              style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.2 }}
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => setQuery('')}
                className="items-center justify-center"
                style={{ width: normalize(22), height: normalize(22), borderRadius: normalize(11), backgroundColor: 'rgba(0,0,0,0.1)' }}
              >
                <X size={normalize(9)} color="rgba(0,0,0,0.55)" strokeWidth={2.4} />
              </Pressable>
            )}
          </View>
          <Pressable onPress={onClose}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: ACCENT, letterSpacing: -0.2 }}>
              취소
            </Text>
          </Pressable>
        </View>

        <View className="flex-row" style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(14), gap: normalize(6) }}>
          {CATEGORY_CHIPS.map((chip) => {
            const isActive = chip === activeChip;
            return (
              <Pressable
                key={chip}
                onPress={() => setActiveChip(chip)}
                style={{ height: normalize(30), paddingHorizontal: normalize(13), borderRadius: normalize(15), backgroundColor: isActive ? '#000' : SURFACE, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: isActive ? 'Pretendard-SemiBold' : 'Pretendard-Medium', fontSize: FONT_SM, color: isActive ? '#fff' : 'rgba(0,0,0,0.55)', letterSpacing: -0.2 }}>
                  {chip}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {recentSearches.length > 0 && (
          <>
            <View className="flex-row items-center justify-between" style={{ paddingHorizontal: normalize(20), paddingTop: normalize(8), paddingBottom: normalize(4) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.45)', letterSpacing: 0.4 }}>
                최근 검색
              </Text>
              <Pressable onPress={() => setRecentSearches([])}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)', letterSpacing: -0.2 }}>
                  모두 지우기
                </Text>
              </Pressable>
            </View>
            <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(8) }}>
              {recentSearches.map((term) => (
                <View key={term} className="flex-row items-center" style={{ gap: normalize(12), paddingVertical: normalize(11) }}>
                  <Clock size={normalize(16)} color="rgba(0,0,0,0.35)" strokeWidth={1.8} />
                  <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.2 }}>
                    {term}
                  </Text>
                  <Pressable onPress={() => setRecentSearches((prev) => prev.filter((t) => t !== term))} style={{ padding: normalize(4) }}>
                    <X size={normalize(12)} color="rgba(0,0,0,0.25)" strokeWidth={2} />
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ paddingHorizontal: normalize(20), paddingTop: normalize(8), paddingBottom: normalize(4) }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.45)', letterSpacing: 0.4 }}>
            인기 검색어
          </Text>
        </View>
        <View className="flex-row flex-wrap" style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(8), gap: normalize(6) }}>
          {POPULAR_KEYWORDS.map((keyword, index) => {
            const rank = index + 1;
            const isTop = rank <= 3;
            return (
              <View
                key={keyword}
                className="flex-row items-center"
                style={{ height: normalize(30), paddingHorizontal: normalize(12), borderRadius: normalize(15), backgroundColor: SURFACE, gap: normalize(5) }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: isTop ? ACCENT : 'rgba(0,0,0,0.45)' }}>
                  {rank}
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.6)', letterSpacing: -0.2 }}>
                  {keyword}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ paddingHorizontal: normalize(20), paddingTop: normalize(8), paddingBottom: normalize(4) }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.45)', letterSpacing: 0.4 }}>
            추천 스팟
          </Text>
        </View>
        <View className="flex-row flex-wrap" style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(24), gap: normalize(8) }}>
          {RECOMMENDED_SPOTS.map((spot) => (
            <View key={spot.id} style={{ width: '47%', gap: normalize(8) }}>
              <View style={{ height: normalize(100), borderRadius: normalize(12), backgroundColor: spot.gradient }} />
              <View>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#000', letterSpacing: -0.2 }}>
                  {spot.name}
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.45)', letterSpacing: -0.1, marginTop: normalize(1) }}>
                  게시글 {spot.postCount}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
