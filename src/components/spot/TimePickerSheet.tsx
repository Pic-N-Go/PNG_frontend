import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BottomSheet from '@/components/common/BottomSheet';
import {
  BUTTON_HEIGHT,
  BUTTON_RADIUS,
  CARD_RADIUS,
  FONT_LG,
  FONT_MD,
  FONT_SM,
  FONT_XL,
  FONT_XS,
  GRID_PADDING,
  WHEEL_ITEM_HEIGHT,
  WHEEL_SELECTION_RADIUS,
  WHEEL_VISIBLE_HEIGHT,
} from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { BRAND, CARD, TEXT_SUB } from '@/constants/colors';

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
const PERIODS = ['오전', '오후'];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));

interface WheelProps {
  items: string[];
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  width: number;
}

function Wheel({ items, value, onChange, unit, width }: WheelProps) {
  const scrollRef = useRef<ScrollView>(null);
  const isMomentumRef = useRef(false);
  const dragTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idx = Math.max(0, items.indexOf(value));

  // 선택된 항목으로 스크롤 위치 동기화
  useEffect(() => {
    scrollRef.current?.scrollTo({
      y: idx * WHEEL_ITEM_HEIGHT,
      animated: false,
    });
  }, [idx]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const i = Math.round(y / WHEEL_ITEM_HEIGHT);
    const validIndex = Math.max(0, Math.min(items.length - 1, i));
    const nextVal = items[validIndex];
    if (nextVal && nextVal !== value) {
      onChange(nextVal);
    }
  };

  const handleMomentumScrollBegin = () => {
    isMomentumRef.current = true;
    if (dragTimerRef.current) {
      clearTimeout(dragTimerRef.current);
      dragTimerRef.current = null;
    }
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isMomentumRef.current = false;
    if (dragTimerRef.current) {
      clearTimeout(dragTimerRef.current);
      dragTimerRef.current = null;
    }
    handleScrollEnd(e);
  };

  const handleScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (dragTimerRef.current) clearTimeout(dragTimerRef.current);
    const nativeEvent = e.nativeEvent;
    dragTimerRef.current = setTimeout(() => {
      if (!isMomentumRef.current) {
        handleScrollEnd({ nativeEvent } as any);
      }
    }, 100);
  };

  return (
    <View
      className="relative overflow-hidden"
      style={{ width, height: WHEEL_VISIBLE_HEIGHT }}
    >
      {/* 중앙 선택 영역 하이라이트 */}
      <View
        pointerEvents="none"
        className="absolute left-0 right-0 bg-black/5"
        style={{
          top: WHEEL_ITEM_HEIGHT,
          height: WHEEL_ITEM_HEIGHT,
          borderRadius: WHEEL_SELECTION_RADIUS,
        }}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        contentOffset={{ x: 0, y: idx * WHEEL_ITEM_HEIGHT }}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollEndDrag={handleScrollEndDrag}
        contentContainerStyle={{ paddingVertical: WHEEL_ITEM_HEIGHT }}
      >
        {items.map((it, itemIdx) => {
          const active = it === value;
          return (
            <Pressable
              key={it}
              onPress={() => {
                onChange(it);
                scrollRef.current?.scrollTo({ y: itemIdx * WHEEL_ITEM_HEIGHT, animated: true });
              }}
              className="flex-row items-center justify-center"
              style={{ height: WHEEL_ITEM_HEIGHT }}
            >
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: active ? FONT_XL : FONT_MD,
                  fontFamily: active ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                  color: active ? '#111111' : '#c7c7cc',
                  letterSpacing: -0.2,
                }}
              >
                {it}
              </Text>
              {unit && active && (
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: FONT_SM,
                    fontFamily: 'Pretendard-SemiBold',
                    color: '#111111',
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
      {/* 상하단 페이드 그라디언트 */}
      <LinearGradient
        pointerEvents="none"
        colors={[CARD, 'rgba(245,245,247,0)']}
        className="absolute left-0 right-0 top-0"
        style={{ height: WHEEL_ITEM_HEIGHT }}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(245,245,247,0)', CARD]}
        className="absolute left-0 right-0 bottom-0"
        style={{ height: WHEEL_ITEM_HEIGHT }}
      />
    </View>
  );
}

/**
 * development.md 가이드 및 design-tokens.md 기준에 100% 맞춘 커스텀 바텀시트 시간 선택기
 */
export default function TimePickerSheet({
  visible,
  value,
  onConfirm,
  onClose,
  title = '시간대 선택',
  minuteInterval = MINUTE_INTERVAL,
}: Props) {
  // 1. 초기값 계산 (분 반올림 시 60분 도달 시 시간 올림 carry 처리)
  const initialValues = useMemo(() => {
    const d = new Date(value);
    const ms = 1000 * 60 * minuteInterval;
    const roundedDate = new Date(Math.round(d.getTime() / ms) * ms);

    const hours24 = roundedDate.getHours();
    const isPM = hours24 >= 12;
    const period = isPM ? '오후' : '오전';
    const hour12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const hour = String(hour12);

    const roundedMinutes = roundedDate.getMinutes();
    const minute = roundedMinutes < 10 ? `0${roundedMinutes}` : String(roundedMinutes);

    return { period, hour, minute, roundedDate };
  }, [value, minuteInterval]);

  const minuteOptions = useMemo(() => {
    const list: string[] = [];
    for (let m = 0; m < 60; m += minuteInterval) {
      list.push(m < 10 ? `0${m}` : String(m));
    }
    return list;
  }, [minuteInterval]);

  const [selectedPeriod, setSelectedPeriod] = useState(initialValues.period);
  const [selectedHour, setSelectedHour] = useState(initialValues.hour);
  const [selectedMinute, setSelectedMinute] = useState(initialValues.minute);

  // 시트가 열릴 때마다 넘겨받은 value로 상태 동기화
  useEffect(() => {
    if (visible) {
      setSelectedPeriod(initialValues.period);
      setSelectedHour(initialValues.hour);
      setSelectedMinute(initialValues.minute);
    }
  }, [visible, initialValues]);

  const handleConfirm = () => {
    const isPM = selectedPeriod === '오후';
    const hourNum = parseInt(selectedHour, 10);
    let hours24: number;

    if (isPM) {
      hours24 = hourNum === 12 ? 12 : hourNum + 12;
    } else {
      hours24 = hourNum === 12 ? 0 : hourNum;
    }

    const minNum = parseInt(selectedMinute, 10);

    const nextDate = new Date(initialValues.roundedDate);
    nextDate.setHours(hours24, minNum, 0, 0);

    onConfirm(nextDate);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ width: '100%', paddingBottom: normalize(4) }}>
        {/* 헤더 */}
        <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(4) }}>
          <Text
            allowFontScaling={false}
            className="font-semibold"
            style={{
              fontSize: FONT_LG,
              color: '#111111',
              letterSpacing: -0.35,
            }}
          >
            {title}
          </Text>
          <Text
            allowFontScaling={false}
            className="font-normal"
            style={{
              fontSize: FONT_XS,
              color: TEXT_SUB,
              marginTop: normalize(2),
            }}
          >
            원하는 시간을 스크롤하여 선택해 주세요
          </Text>
        </View>

        {/* 휠 피커 카드 컨테이너 */}
        <View
          className="overflow-hidden bg-card"
          style={{
            marginHorizontal: GRID_PADDING,
            marginTop: normalize(12),
            marginBottom: normalize(16),
            borderRadius: CARD_RADIUS,
          }}
        >
          <View
            className="flex-row items-center justify-center"
            style={{
              paddingVertical: normalize(6),
              gap: normalize(16),
            }}
          >
            <Wheel
              items={PERIODS}
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              width={normalize(70)}
            />
            <Wheel
              items={HOURS}
              value={selectedHour}
              onChange={setSelectedHour}
              unit="시"
              width={normalize(80)}
            />
            <Wheel
              items={minuteOptions}
              value={selectedMinute}
              onChange={setSelectedMinute}
              unit="분"
              width={normalize(80)}
            />
          </View>
        </View>

        {/* 하단 확인 버튼 */}
        {/* 높이·배경·radius는 반드시 일반 객체 style로 준다.
            Pressable의 함수형 style(({pressed}) => ...)은 NativeWind가 통째로 버려서
            버튼이 배경 없이 글자 높이로 찌그러진다 — 흰 시트 위 흰 글씨라 안 보였다.
            (같은 함정 주석: mypage/components/BookmarkedSpotRow.tsx) */}
        <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(8) }}>
          <Pressable
            onPress={handleConfirm}
            android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
            style={{
              width: '100%',
              height: BUTTON_HEIGHT,
              borderRadius: BUTTON_RADIUS,
              backgroundColor: BRAND,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <Text
              allowFontScaling={false}
              className="font-semibold text-white"
              style={{ fontSize: FONT_MD }}
            >
              확인
            </Text>
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}
