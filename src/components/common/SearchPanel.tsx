import React from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { Clock, MapPin, X } from 'lucide-react-native';
import { useSearchStore } from '@/store/useSearchStore';
import { useSeasonalSpots } from '@/hooks/useSeasonalSpots';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM, FONT_XS, GRID_PADDING } from '@/constants/layout';
import { BRAND, CARD, iconGray } from '@/constants/colors';
import type { SpotResponse } from '@/types/spot';

/**
 * 홈·지도·커뮤니티 세 검색 화면이 공유하는 조각들. 기준은 커뮤니티 검색 오버레이다
 * (회의 결정) — 입력 바 모양, 최근 검색 행, 추천 스팟 그리드가 여기 한 벌만 있다.
 *
 * 인기 검색어는 어디에도 없다: 검색 로그 집계 API가 없어 순위를 지어낼 수밖에 없었고,
 * 그 자리는 실데이터인 추천 스팟이 쓴다.
 */

export function SectionLabel({ text }: { text: string }) {
  return (
    <Text
      allowFontScaling={false}
      style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.45)', letterSpacing: 0.4 }}
    >
      {text}
    </Text>
  );
}

interface SearchFieldProps {
  value: string;
  onChangeText: (next: string) => void;
  onSubmit: (keyword: string) => void;
  /** 우측 "취소" — 화면이면 goBack, 오버레이면 닫기. */
  onCancel: () => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  inputRef?: React.RefObject<TextInput | null>;
}

/** 검색 입력 바 한 줄. 좌측 검색 아이콘 없이 입력창 + 취소만 두는 게 커뮤니티 기준이다. */
export function SearchField({
  value,
  onChangeText,
  onSubmit,
  onCancel,
  onClear,
  placeholder = '장소, 테마, 키워드 검색',
  autoFocus = true,
  inputRef,
}: SearchFieldProps) {
  return (
    <View
      className="flex-row items-center"
      style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(6), paddingBottom: normalize(12), gap: normalize(12) }}
    >
      <View
        className="flex-1 flex-row items-center"
        style={{ height: normalize(40), paddingHorizontal: normalize(14), borderRadius: normalize(20), backgroundColor: CARD, gap: normalize(10) }}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(0,0,0,0.35)"
          allowFontScaling={false}
          autoFocus={autoFocus}
          returnKeyType="search"
          onSubmitEditing={() => onSubmit(value)}
          style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.2, paddingVertical: 0 }}
        />
        {value.length > 0 && (
          <Pressable
            onPress={() => {
              onChangeText('');
              onClear?.();
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="검색어 지우기"
            className="items-center justify-center"
            style={{ width: normalize(22), height: normalize(22), borderRadius: normalize(11), backgroundColor: 'rgba(0,0,0,0.1)' }}
          >
            <X size={normalize(9)} color={iconGray(0.55)} strokeWidth={2.4} />
          </Pressable>
        )}
      </View>
      <Pressable onPress={onCancel} hitSlop={8}>
        <Text
          allowFontScaling={false}
          style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: BRAND, letterSpacing: -0.2 }}
        >
          취소
        </Text>
      </Pressable>
    </View>
  );
}

/** 최근 검색 목록. 저장소는 useSearchStore 한 곳으로 통일했다(zustand persist). */
export function RecentSearches({ onSelect }: { onSelect: (keyword: string) => void }) {
  const { recentSearches, removeRecentSearch, clearRecentSearches } = useSearchStore();
  if (recentSearches.length === 0) return null;

  return (
    <>
      <View
        className="flex-row items-center justify-between"
        style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(8), paddingBottom: normalize(4) }}
      >
        <SectionLabel text="최근 검색" />
        <Pressable onPress={clearRecentSearches} hitSlop={8}>
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)', letterSpacing: -0.2 }}
          >
            모두 지우기
          </Text>
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(8) }}>
        {recentSearches.map((term) => (
          <Pressable
            key={term}
            onPress={() => onSelect(term)}
            className="flex-row items-center"
            style={{ gap: normalize(12), paddingVertical: normalize(11) }}
          >
            <Clock size={normalize(16)} color={iconGray(0.35)} strokeWidth={1.8} />
            <Text
              allowFontScaling={false}
              style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.2 }}
            >
              {term}
            </Text>
            <Pressable
              onPress={() => removeRecentSearch(term)}
              accessibilityRole="button"
              accessibilityLabel={`${term} 최근 검색어 삭제`}
              hitSlop={6}
              style={{ padding: normalize(4) }}
            >
              <X size={normalize(12)} color={iconGray(0.25)} strokeWidth={2} />
            </Pressable>
          </Pressable>
        ))}
      </View>
    </>
  );
}

/**
 * 추천 스팟 2열 그리드. 홈 "이달의 추천 출사스팟"과 같은 결과를 쓴다(회의 결정).
 * 게시글 수는 서버가 스팟별로 세어주지 않아 표시하지 않는다.
 */
export function RecommendedSpots({ onOpenSpot, count = 4 }: { onOpenSpot: (spot: SpotResponse) => void; count?: number }) {
  const { spots, isLoading } = useSeasonalSpots(count);
  // 빈 제목만 남으면 고장처럼 보인다 — 결과가 없으면 섹션째로 감춘다.
  if (isLoading || spots.length === 0) return null;

  return (
    <>
      <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(8), paddingBottom: normalize(4) }}>
        <SectionLabel text="추천 스팟" />
      </View>
      <View
        className="flex-row flex-wrap"
        style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(24), gap: normalize(8) }}
      >
        {spots.map((spot) => (
          <Pressable key={spot.id} onPress={() => onOpenSpot(spot)} style={{ width: '47%', gap: normalize(8) }}>
            <View className="overflow-hidden" style={{ height: normalize(100), borderRadius: normalize(12), backgroundColor: CARD }}>
              {spot.thumbnailUrl ? (
                <Image source={{ uri: spot.thumbnailUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
              ) : (
                <View className="items-center justify-center" style={{ flex: 1 }}>
                  <MapPin size={normalize(20)} color={iconGray(0.2)} strokeWidth={1.8} />
                </View>
              )}
            </View>
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#000', letterSpacing: -0.2 }}
            >
              {spot.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}
