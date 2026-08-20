import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Check, Clock, MapPin, Search } from 'lucide-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchSpots, useSpots } from '@/hooks/useSpot';
import { BUTTON_HEIGHT, BUTTON_RADIUS, FONT_2XS, FONT_LG, FONT_MD, FONT_SM, FONT_XS, GRID_PADDING } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { BRAND, BRAND_TINT_ACTIVE, CARD, TEXT_SUB } from '@/constants/colors';

const ACCENT = BRAND;
const SURFACE = CARD;

export interface LocationOption {
  /** 서버 스팟 id — 게시글 등록 시 spotId로 그대로 보낸다(숫자 문자열) */
  id: string;
  name: string;
  address: string;
  /** 거리 계산은 이 시트의 범위 밖 — 현재 위치를 받지 않는다 */
  distanceLabel?: string;
  /** true면 "최근 검색" 섹션에 표시 */
  recent?: boolean;
}

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
        backgroundColor: isSelected ? BRAND_TINT_ACTIVE : 'transparent',
      }}
    >
      <View
        className="items-center justify-center"
        style={{
          width: normalize(34),
          height: normalize(34),
          borderRadius: normalize(10),
          backgroundColor: isSelected ? BRAND_TINT_ACTIVE : SURFACE,
        }}
      >
        <Icon size={normalize(16)} color={isSelected ? ACCENT : TEXT_SUB} strokeWidth={1.8} />
      </View>
      <View className="flex-1 min-w-0">
        <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2 }}>
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
  // 한 글자 칠 때마다 검색을 날리면 스팟 검색 API가 그대로 얻어맞는다.
  const debouncedQuery = useDebounce(query.trim(), 400);
  const isSearching = debouncedQuery.length > 0;

  // 검색어가 없을 땐 인기 스팟을 기본 목록으로 보여준다 — 빈 시트보다 고르기 쉽다.
  const popular = useSpots({ sort: 'popular', size: 20 }, { enabled: visible && !isSearching });
  const searched = useSearchSpots({ keyword: debouncedQuery, size: 20 }, { enabled: visible && isSearching });

  const active = isSearching ? searched : popular;
  const options: LocationOption[] = (active.data?.content ?? []).map((spot) => ({
    id: String(spot.id),
    name: spot.name,
    address: spot.address,
  }));

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
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: TEXT_SUB, letterSpacing: 0.3, paddingTop: normalize(12), paddingBottom: normalize(6) }}>
            {isSearching ? '검색 결과' : '인기 스팟'}
          </Text>

          {active.isLoading ? (
            <View style={{ paddingVertical: normalize(24) }}>
              <ActivityIndicator color={ACCENT} />
            </View>
          ) : active.isError ? (
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)', letterSpacing: -0.2, paddingVertical: normalize(24), textAlign: 'center' }}>
              스팟을 불러오지 못했어요
            </Text>
          ) : options.length === 0 ? (
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)', letterSpacing: -0.2, paddingVertical: normalize(24), textAlign: 'center' }}>
              검색 결과가 없어요
            </Text>
          ) : (
            options.map((option) => (
              <Row key={option.id} option={option} isSelected={option.id === selected?.id} onPress={() => choose(option)} />
            ))
          )}
        </ScrollView>

        <Pressable
          onPress={onClose}
          className="w-full items-center justify-center"
          style={{ height: BUTTON_HEIGHT, marginTop: normalize(12), borderRadius: BUTTON_RADIUS, backgroundColor: ACCENT }}
        >
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#fff', letterSpacing: -0.2 }}>
            확인
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
