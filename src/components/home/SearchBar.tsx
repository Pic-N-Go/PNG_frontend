import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { IconSearch, IconAdjustmentsHorizontal } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_MD, GRID_PADDING } from '@/constants/layout';

interface Props {
  onPress: () => void;
  onFilterPress: () => void;
  activeFilterCount: number;
}

export default function SearchBar({ onPress, onFilterPress, activeFilterCount }: Props) {
  return (
    // 외부 View: 그림자만 담당 (overflow 없음 — iOS에서 overflow:hidden이 shadow를 클리핑)
    <View
      style={{
        marginHorizontal: GRID_PADDING,
        marginTop: normalize(12),
        borderRadius: normalize(24),
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
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
        <IconSearch size={normalize(18)} color="rgba(0,0,0,0.3)" strokeWidth={1.5} />
        <Text
          allowFontScaling={false}
          style={{
            flex: 1,
            marginLeft: normalize(8),
            fontFamily: 'Pretendard-Regular',
            fontSize: FONT_MD,
            color: 'rgba(0,0,0,0.3)',
            letterSpacing: -0.2,
          }}
        >
          장소, 테마, 키워드 검색
        </Text>
      </Pressable>

      {/* 필터 버튼 */}
      <Pressable
        onPress={onFilterPress}
        hitSlop={8}
        style={{ position: 'absolute', right: normalize(16), top: 0, bottom: 0, justifyContent: 'center' }}
      >
        <View style={{ position: 'relative' }}>
          <IconAdjustmentsHorizontal size={normalize(18)} color="rgba(0,0,0,0.45)" strokeWidth={1.5} />
          {activeFilterCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -normalize(4),
                right: -normalize(4),
                width: normalizeFontSize(14),
                height: normalizeFontSize(14),
                borderRadius: normalizeFontSize(7),
                backgroundColor: '#E31B59',
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
