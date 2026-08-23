import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
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

  // iOS용: 시트가 열릴 때마다 넘겨받은 value로 draft 초기화
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  // Android: 중첩 바텀시트 모달 없이 Android OS 네이티브 TimePickerDialog를 직접 호출
  useEffect(() => {
    if (Platform.OS === 'android') {
      if (visible) {
        DateTimePickerAndroid.open({
          value,
          mode: 'time',
          is24Hour: false,
          minuteInterval,
          onChange: (event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              onConfirm(selectedDate);
            }
            onClose();
          },
        });
      } else {
        DateTimePickerAndroid.dismiss('time');
      }
    }
  }, [visible, value, minuteInterval, onConfirm, onClose]);

  // Android에서는 네이티브 다이얼로그 팝업만 단독으로 뜨므로 추가적인 React Native BottomSheet는 렌더링하지 않는다.
  if (Platform.OS === 'android') {
    return null;
  }

  // iOS: 바텀시트 + 인라인 휠 스피너 피커
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
