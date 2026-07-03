import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import {
  BOTTOM_SHEET_RADIUS,
  BUTTON_HEIGHT,
  BUTTON_RADIUS,
  FONT_LG,
  FONT_MD,
  FONT_SM,
  GRID_PADDING,
  SPACING_MD,
} from '@/constants/layout';

type SingleKey = 'distance' | 'score';
type MultiKey = 'time' | 'weather';

const FILTER_GROUPS = {
  distance: { label: '거리', options: ['1km', '3km', '5km', '10km', '전체'], multi: false },
  time:     { label: '시간대', options: ['일출', '낮', '일몰', '야간'], multi: true },
  weather:  { label: '날씨', options: ['맑음', '흐림', '눈', '안개'], multi: true },
  score:    { label: '포토제닉 스코어', options: ['60점 이상', '70점 이상', '80점 이상', '90점 이상'], multi: false },
} as const;

type FilterState = {
  distance: string | null;
  time: string[];
  weather: string[];
  score: string | null;
};

const EMPTY_FILTER: FilterState = { distance: null, time: [], weather: [], score: null };

interface Props {
  visible: boolean;
  onClose: () => void;
  onApply: (count: number) => void;
}

export default function FilterBottomSheet({ visible, onClose, onApply }: Props) {
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);

  // 닫힐 때 미적용 변경사항 초기화
  function handleClose() {
    reset();
    onClose();
  }

  function toggleSingle(key: SingleKey, option: string) {
    setFilter((prev) => ({ ...prev, [key]: prev[key] === option ? null : option }));
  }

  function toggleMulti(key: MultiKey, option: string) {
    setFilter((prev) => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(option) ? arr.filter((v) => v !== option) : [...arr, option] };
    });
  }

  function reset() {
    setFilter(EMPTY_FILTER);
  }

  function apply() {
    const count =
      (filter.distance ? 1 : 0) +
      filter.time.length +
      filter.weather.length +
      (filter.score ? 1 : 0);
    onApply(count);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
        onPress={handleClose}
      >
        <Pressable onPress={() => {}}>
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: BOTTOM_SHEET_RADIUS,
              borderTopRightRadius: BOTTOM_SHEET_RADIUS,
              paddingBottom: normalize(28),
            }}
          >
            {/* 핸들 */}
            <View style={{ alignItems: 'center', paddingTop: normalize(12), paddingBottom: normalize(4) }}>
              <View style={{ width: normalize(36), height: normalize(4), borderRadius: normalize(2), backgroundColor: 'rgba(0,0,0,0.1)' }} />
            </View>

            {/* 헤더 */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: GRID_PADDING,
                paddingVertical: normalize(8),
              }}
            >
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.4 }}
              >
                필터
              </Text>
              <Pressable onPress={reset} hitSlop={8}>
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: 'rgba(0,0,0,0.35)' }}
                >
                  초기화
                </Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {(Object.keys(FILTER_GROUPS) as (SingleKey | MultiKey)[]).map((key, idx) => {
                const group = FILTER_GROUPS[key];
                const isLast = idx === Object.keys(FILTER_GROUPS).length - 1;
                return (
                  <View key={key}>
                    <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(20) }}>
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Pretendard-SemiBold',
                          fontSize: normalizeFontSize(12),
                          color: 'rgba(0,0,0,0.35)',
                          letterSpacing: 0.2,
                          textTransform: 'uppercase',
                          marginBottom: normalize(10),
                        }}
                      >
                        {group.label}
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: normalize(8) }}>
                        {group.options.map((option) => {
                          const isSelected = group.multi
                            ? (filter[key as MultiKey] as string[]).includes(option)
                            : filter[key as SingleKey] === option;
                          return (
                            <Pressable
                              key={option}
                              onPress={() =>
                                group.multi
                                  ? toggleMulti(key as MultiKey, option)
                                  : toggleSingle(key as SingleKey, option)
                              }
                              style={{
                                height: normalize(36),
                                paddingHorizontal: SPACING_MD,
                                borderRadius: normalize(18),
                                borderWidth: 1.5,
                                borderColor: isSelected ? '#E31B59' : 'rgba(0,0,0,0.1)',
                                backgroundColor: isSelected ? 'rgba(227,27,89,0.04)' : '#fff',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Text
                                allowFontScaling={false}
                                style={{
                                  fontFamily: isSelected ? 'Pretendard-Medium' : 'Pretendard-Regular',
                                  fontSize: FONT_SM,
                                  color: isSelected ? '#E31B59' : 'rgba(0,0,0,0.55)',
                                }}
                              >
                                {option}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                    {!isLast && (
                      <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: GRID_PADDING, marginBottom: normalize(20) }} />
                    )}
                  </View>
                );
              })}
            </ScrollView>

            {/* 적용 버튼 */}
            <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(8) }}>
              <Pressable
                onPress={apply}
                style={{
                  height: BUTTON_HEIGHT,
                  borderRadius: BUTTON_RADIUS,
                  backgroundColor: '#E31B59',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_LG, color: '#fff', letterSpacing: -0.3 }}
                >
                  적용하기
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
