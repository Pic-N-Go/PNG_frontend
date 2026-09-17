import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { IconSearch, IconAdjustmentsHorizontal, IconX } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_MD, GRID_PADDING } from '@/constants/layout';
import { BRAND, TEXT_SUB, iconGray } from '@/constants/colors';
import { SHADOW_CONTROL } from '@/constants/shadow';

interface Props {
  onPress: () => void;
  onFilterPress: () => void;
  activeFilterCount: number;
  /** 지도처럼 고른 키워드를 바에 남겨두는 화면용. 비우면 placeholder가 보인다. */
  value?: string;
  onClear?: () => void;
  /** 바깥 여백은 화면마다 다르다 — 지도는 자체 오버레이 행 안에 들어간다. */
  inline?: boolean;
  placeholder?: string;
}

/** 홈·지도 상단의 검색 진입 pill. 누르면 검색 화면으로 넘어간다(여기서 입력받지 않는다). */
export default function SearchBar({
  onPress,
  onFilterPress,
  activeFilterCount,
  value = '',
  onClear,
  inline = false,
  placeholder = '장소, 테마, 키워드 검색',
}: Props) {
  return (
    // 외부 View: 그림자만 담당 (overflow 없음 — iOS에서 overflow:hidden이 shadow를 클리핑)
    <View
      style={{
        ...(inline
          ? { flex: 1 }
          : { marginHorizontal: GRID_PADDING, marginTop: normalize(12) }),
        borderRadius: normalize(24),
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.6)',
        ...SHADOW_CONTROL,
      }}
    >
      {/* 검색 영역 */}
      <Pressable
        onPress={onPress}
        style={{
          height: normalize(48),
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: normalize(16),
          paddingRight: normalize(52),
        }}
      >
        <IconSearch size={normalize(18)} color={iconGray(0.3)} strokeWidth={1.5} />
        <Text
          numberOfLines={1}
          allowFontScaling={false}
          style={{
            flex: 1,
            marginLeft: normalize(8),
            fontFamily: 'Pretendard-Regular',
            fontSize: FONT_MD,
            color: value ? '#111' : 'rgba(0,0,0,0.3)',
            letterSpacing: -0.2,
          }}
        >
          {value || placeholder}
        </Text>
        {value.length > 0 && onClear && (
          <Pressable onPress={onClear} hitSlop={8} accessibilityRole="button" accessibilityLabel="검색어 지우기" style={{ padding: normalize(4) }}>
            <IconX size={normalize(16)} color={TEXT_SUB} strokeWidth={1.5} />
          </Pressable>
        )}
      </Pressable>

      {/* 필터 버튼 */}
      <Pressable
        onPress={onFilterPress}
        hitSlop={8}
        style={{ position: 'absolute', right: normalize(16), top: 0, bottom: 0, justifyContent: 'center' }}
      >
        <View style={{ position: 'relative' }}>
          <IconAdjustmentsHorizontal size={normalize(18)} color={TEXT_SUB} strokeWidth={1.5} />
          {activeFilterCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -normalize(4),
                right: -normalize(4),
                width: normalizeFontSize(14),
                height: normalizeFontSize(14),
                borderRadius: normalizeFontSize(7),
                backgroundColor: BRAND,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                allowFontScaling={false}
                style={{ fontSize: normalizeFontSize(8), color: '#fff', fontFamily: 'Pretendard-Medium' }}
              >
                {activeFilterCount}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}
