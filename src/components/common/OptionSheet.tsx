import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { IconCheck } from '@tabler/icons-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

interface Props {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
  onClose: () => void;
}

export default function OptionSheet({ visible, title, options, selected, onSelect, onClose }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(16), paddingBottom: normalize(12) }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(18), color: '#000', letterSpacing: -0.35 }}>
          {title}
        </Text>
      </View>
      <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(12) }}>
        {options.map((option) => {
          const isSelected = option === selected;
          return (
            <Pressable
              key={option}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: normalize(14) }}
            >
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: isSelected ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                  fontSize: normalizeFontSize(15),
                  color: isSelected ? '#E31B59' : '#000',
                  letterSpacing: -0.2,
                }}
              >
                {option}
              </Text>
              {isSelected && <IconCheck size={normalize(18)} color="#E31B59" strokeWidth={2} />}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}
