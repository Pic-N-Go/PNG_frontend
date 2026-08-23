import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { BUTTON_RADIUS, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { BRAND, TEXT_SUB } from '@/constants/colors';

interface Props {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
  /** 기본값은 날씨 예보용 "시간대 선택". 촬영 시각처럼 쓰임이 다르면 넘긴다 */
  title?: string;
  /** 예보는 5분 단위면 충분하지만 촬영 시각은 1분 단위여야 한다 */
  minuteInterval?: 1 | 5 | 10 | 15 | 30;
}

const MINUTE_INTERVAL = 5;
const ITEM_HEIGHT = normalize(44);
const VISIBLE_ITEMS = 5; // 홀수 개 (중앙 1개 + 위 2개 + 아래 2개)
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const PERIODS = ['오전', '오후'];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));

interface WheelColumnProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  unit?: string;
  width?: number | string;
}

function WheelColumn({ items, selectedIndex, onSelect, unit, width = '30%' }: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const isScrollingRef = useRef(false);

  // 선택된 인덱스로 스크롤 위치 이동
  useEffect(() => {
    if (!isScrollingRef.current) {
      scrollRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    }
  }, [selectedIndex]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isScrollingRef.current = false;
    const offsetY = e.nativeEvent.contentOffset.y;
    const nextIndex = Math.max(0, Math.min(items.length - 1, Math.round(offsetY / ITEM_HEIGHT)));
    if (nextIndex !== selectedIndex) {
      onSelect(nextIndex);
    }
  };

  const handleItemPress = (index: number) => {
    scrollRef.current?.scrollTo({
      y: index * ITEM_HEIGHT,
      animated: true,
    });
    onSelect(index);
  };

  return (
    <View style={{ width: width as any, height: CONTAINER_HEIGHT, position: 'relative' }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        nestedScrollEnabled={true}
        onScrollBeginDrag={() => {
          isScrollingRef.current = true;
        }}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT * 2, // 상하 2칸씩 여백을 주어 첫/끝 항목이 중앙에 오게 함
        }}
      >
        {items.map((item, i) => {
          const isSelected = i === selectedIndex;
          return (
            <Pressable
              key={`${item}-${i}`}
              onPress={() => handleItemPress(i)}
              style={{
                height: ITEM_HEIGHT,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
              }}
            >
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: isSelected ? 'Pretendard-Bold' : 'Pretendard-Regular',
                  fontSize: isSelected ? normalizeFontSize(19) : normalizeFontSize(15),
                  color: isSelected ? '#000' : 'rgba(0,0,0,0.3)',
                  letterSpacing: -0.2,
                }}
              >
                {item}
              </Text>
              {unit && isSelected && (
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Pretendard-Medium',
                    fontSize: normalizeFontSize(14),
                    color: '#000',
                    marginLeft: normalize(2),
                  }}
                >
                  {unit}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/**
 * iOS와 Android 모두 동일하고 세련된 디자인으로 작동하는 커스텀 바텀시트 휠 타임피커
 */
export default function TimePickerSheet({
  visible,
  value,
  onConfirm,
  onClose,
  title = '시간대 선택',
  minuteInterval = MINUTE_INTERVAL,
}: Props) {
  // 1. 전달받은 Date 객체에서 오전/오후, 12시간제 시, 분 추출
  const initialValues = useMemo(() => {
    const hours24 = value.getHours();
    const isPM = hours24 >= 12;
    const periodIdx = isPM ? 1 : 0;
    const hour12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const hourIdx = hour12 - 1; // 1~12 -> 0~11

    const rawMinutes = value.getMinutes();
    // minuteInterval 단위로 가장 가까운 분 계산
    const roundedMinutes = Math.round(rawMinutes / minuteInterval) * minuteInterval;
    const safeMinutes = roundedMinutes >= 60 ? 60 - minuteInterval : roundedMinutes;

    return {
      periodIdx,
      hourIdx,
      minute: safeMinutes,
    };
  }, [value, minuteInterval]);

  const minuteOptions = useMemo(() => {
    const list: string[] = [];
    for (let m = 0; m < 60; m += minuteInterval) {
      list.push(m < 10 ? `0${m}` : String(m));
    }
    return list;
  }, [minuteInterval]);

  const [periodIndex, setPeriodIndex] = useState(initialValues.periodIdx);
  const [hourIndex, setHourIndex] = useState(initialValues.hourIdx);
  const [minuteIndex, setMinuteIndex] = useState(() => {
    const formatted = initialValues.minute < 10 ? `0${initialValues.minute}` : String(initialValues.minute);
    const idx = minuteOptions.indexOf(formatted);
    return idx >= 0 ? idx : 0;
  });

  // 열릴 때마다 넘겨받은 value로 휠 상태 동기화
  useEffect(() => {
    if (visible) {
      setPeriodIndex(initialValues.periodIdx);
      setHourIndex(initialValues.hourIdx);
      const formatted = initialValues.minute < 10 ? `0${initialValues.minute}` : String(initialValues.minute);
      const idx = minuteOptions.indexOf(formatted);
      setMinuteIndex(idx >= 0 ? idx : 0);
    }
  }, [visible, initialValues, minuteOptions]);

  const handleConfirm = () => {
    const isPM = periodIndex === 1;
    const selectedHour12 = hourIndex + 1; // 1~12
    let hours24: number;

    if (isPM) {
      hours24 = selectedHour12 === 12 ? 12 : selectedHour12 + 12;
    } else {
      hours24 = selectedHour12 === 12 ? 0 : selectedHour12;
    }

    const selectedMinute = Number(minuteOptions[minuteIndex] ?? '0');

    const nextDate = new Date(value);
    nextDate.setHours(hours24, selectedMinute, 0, 0);

    onConfirm(nextDate);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(16), paddingBottom: normalize(12) }}>
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'Pretendard-SemiBold',
            fontSize: normalizeFontSize(18),
            color: '#000',
            letterSpacing: -0.35,
          }}
        >
          {title}
        </Text>
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'Pretendard-Regular',
            fontSize: normalizeFontSize(13),
            color: TEXT_SUB,
            marginTop: normalize(2),
          }}
        >
          원하는 시간을 스크롤하여 선택해 주세요
        </Text>
      </View>

      {/* 휠 피커 컨테이너 */}
      <View
        style={{
          height: CONTAINER_HEIGHT,
          marginHorizontal: GRID_PADDING,
          marginBottom: normalize(16),
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* 중앙 선택 영역 하이라이트 바 */}
        <View
          style={{
            position: 'absolute',
            top: (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2,
            left: 0,
            right: 0,
            height: ITEM_HEIGHT,
            backgroundColor: 'rgba(0,0,0,0.04)',
            borderRadius: normalize(10),
            zIndex: 0,
          }}
          pointerEvents="none"
        />

        {/* 3열 휠 스피너 (오전/오후 · 시 · 분) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', zIndex: 1 }}>
          <WheelColumn
            items={PERIODS}
            selectedIndex={periodIndex}
            onSelect={setPeriodIndex}
            width="28%"
          />
          <WheelColumn
            items={HOURS}
            selectedIndex={hourIndex}
            onSelect={setHourIndex}
            unit="시"
            width="32%"
          />
          <WheelColumn
            items={minuteOptions}
            selectedIndex={minuteIndex}
            onSelect={setMinuteIndex}
            unit="분"
            width="32%"
          />
        </View>
      </View>

      {/* 하단 확인 버튼 */}
      <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(16) }}>
        <Pressable
          onPress={handleConfirm}
          style={({ pressed }) => ({
            width: '100%',
            height: normalize(52),
            borderRadius: BUTTON_RADIUS,
            backgroundColor: pressed ? '#d11550' : BRAND,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-SemiBold',
              fontSize: normalizeFontSize(16),
              color: '#fff',
            }}
          >
            확인
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
