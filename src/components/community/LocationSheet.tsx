import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Check, Clock, MapPin, Search } from 'lucide-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { BUTTON_HEIGHT, BUTTON_RADIUS, FONT_2XS, FONT_LG, FONT_MD, FONT_SM, FONT_XS, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';

export interface LocationOption {
  id: string;
  name: string;
  address: string;
  /** EXIF 기반 추천 항목에만 존재 — 실제 위치 검색 API 연동 전까지는 고정 값 */
  distanceLabel?: string;
  /** true면 "최근 검색" 섹션에 표시 */
  recent?: boolean;
}

// 실제 위치 검색 API 연동은 범위 밖 — 로컬 목록에서 검색·선택하는 것으로 대체한다.
export const MOCK_LOCATIONS: LocationOption[] = [
  { id: 'l1', name: '광안리 해수욕장', address: '부산 수영구 광안해변로 219', distanceLabel: '42m' },
  { id: 'l2', name: '광안대교', address: '부산 수영구 민락수변공원', distanceLabel: '180m' },
  { id: 'l3', name: '민락수변공원', address: '부산 수영구 광안해변로 187', distanceLabel: '320m' },
  { id: 'l4', name: '경복궁 야간개장', address: '서울 종로구 사직로 161', recent: true },
];

// 헤더 + 검색창 + CTA를 뺀 나머지 영역만 스크롤한다(BookmarkSheet와 동일한 계산 방식).
const SCROLL_MAX = Dimensions.get('window').height * 0.8 - normalize(210);

interface Props {
  visible: boolean;
  selected: LocationOption | null;
  onSelect: (option: LocationOption) => void;
  onClose: () => void;
}

function Row({ option, isSelected, onPress }: { option: LocationOption; isSelected: boolean; onPress: () => void }) {
  const Icon = option.recent ? Clock : MapPin;
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center"
      style={{
        gap: normalize(12),
        paddingVertical: normalize(12),
        paddingHorizontal: normalize(10),
        borderRadius: normalize(12),
        backgroundColor: isSelected ? 'rgba(227,27,89,0.06)' : 'transparent',
      }}
    >
      <View
        className="items-center justify-center"
        style={{
          width: normalize(34),
          height: normalize(34),
          borderRadius: normalize(10),
          backgroundColor: isSelected ? 'rgba(227,27,89,0.1)' : SURFACE,
        }}
      >
        <Icon size={normalize(16)} color={isSelected ? ACCENT : 'rgba(0,0,0,0.4)'} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(15), color: '#000', letterSpacing: -0.2 }}>
          {option.name}
        </Text>
        <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.45)', letterSpacing: -0.1, marginTop: normalize(1) }}>
          {option.distanceLabel ? `${option.address} · ${option.distanceLabel}` : option.address}
        </Text>
      </View>
      {isSelected && <Check size={normalize(18)} color={ACCENT} strokeWidth={2.2} />}
    </Pressable>
  );
}

export default function LocationSheet({ visible, selected, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');

  const { recommended, recent } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (option: LocationOption) =>
      q.length === 0 || option.name.toLowerCase().includes(q) || option.address.toLowerCase().includes(q);
    const filtered = MOCK_LOCATIONS.filter(matches);
    return {
      recommended: filtered.filter((option) => !option.recent),
      recent: filtered.filter((option) => option.recent),
    };
  }, [query]);

  const choose = (option: LocationOption) => {
    onSelect(option);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: GRID_PADDING }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.4, marginBottom: normalize(16) }}>
          위치 태그
        </Text>

        <View
          className="flex-row items-center"
          style={{ gap: normalize(10), backgroundColor: SURFACE, borderRadius: normalize(13), paddingHorizontal: normalize(14), height: normalize(44) }}
        >
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="스팟 이름 또는 주소 검색"
            placeholderTextColor="rgba(0,0,0,0.3)"
            allowFontScaling={false}
            style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: '#000', letterSpacing: -0.2 }}
          />
          <Search size={normalize(15)} color="rgba(0,0,0,0.3)" strokeWidth={1.8} />
        </View>

        <ScrollView style={{ maxHeight: SCROLL_MAX }} contentContainerStyle={{ paddingTop: normalize(4), paddingBottom: normalize(4) }} keyboardShouldPersistTaps="handled">
          {recommended.length > 0 && (
            <>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.4)', letterSpacing: 0.3, paddingTop: normalize(12), paddingBottom: normalize(6) }}>
                사진 EXIF 기반 추천
              </Text>
              {recommended.map((option) => (
                <Row key={option.id} option={option} isSelected={option.id === selected?.id} onPress={() => choose(option)} />
              ))}
            </>
          )}

          {recent.length > 0 && (
            <>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.4)', letterSpacing: 0.3, paddingTop: normalize(12), paddingBottom: normalize(6) }}>
                최근 검색
              </Text>
              {recent.map((option) => (
                <Row key={option.id} option={option} isSelected={option.id === selected?.id} onPress={() => choose(option)} />
              ))}
            </>
          )}

          {recommended.length === 0 && recent.length === 0 && (
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)', letterSpacing: -0.2, paddingVertical: normalize(24), textAlign: 'center' }}>
              검색 결과가 없어요
            </Text>
          )}
        </ScrollView>

        <Pressable
          onPress={onClose}
          className="items-center justify-center"
          style={{ width: '100%', height: BUTTON_HEIGHT, marginTop: normalize(12), borderRadius: BUTTON_RADIUS, backgroundColor: ACCENT }}
        >
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#fff', letterSpacing: -0.2 }}>
            확인
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
