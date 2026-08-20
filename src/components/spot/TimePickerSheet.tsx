import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomSheet from '@/components/common/BottomSheet';
import { BUTTON_RADIUS, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { BRAND } from '@/constants/colors';

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

// 예보 API가 24시간 임의 시각 조회를 지원 — 5분 단위로 스크롤 선택
const MINUTE_INTERVAL = 5;

export default function TimePickerSheet({
  visible,
  value,
  onConfirm,
  onClose,
  title = '시간대 선택',
  minuteInterval = MINUTE_INTERVAL,
}: Props) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(16), paddingBottom: normalize(12) }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(18), color: '#000', letterSpacing: -0.35 }}>
          {title}
        </Text>
      </View>

      <View style={{ alignItems: 'center', paddingBottom: normalize(8) }}>
        <DateTimePicker
          value={draft}
          mode="time"
          display="spinner"
          minuteInterval={minuteInterval}
          themeVariant="light"
          onChange={(_, date) => {
            if (date) setDraft(date);
          }}
        />
      </View>

      <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(12) }}>
        <Pressable
          onPress={() => {
            onConfirm(draft);
            onClose();
          }}
          style={{ width: '100%', height: normalize(52), borderRadius: BUTTON_RADIUS, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(16), color: '#fff' }}>
            확인
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
