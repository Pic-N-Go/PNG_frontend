import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { IconTrophy, IconSettings, IconHeadset } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';

export default function QuickActions() {
  return (
    <View className="px-5 pb-10">
      <View className="flex-row" style={{ gap: normalize(8) }}>
        <TouchableOpacity
          style={{
            flex: 1,
            height: normalize(48),
            borderRadius: normalize(12),
            backgroundColor: '#fff',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: normalize(6),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }}
          onPress={() => console.log('레벨/뱃지 안내')}
        >
          <IconTrophy size={normalize(18)} color="rgba(0,0,0,0.3)" strokeWidth={2} />
          <Text className="font-medium tracking-tight" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.5)' }}>
            레벨/뱃지
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            height: normalize(48),
            borderRadius: normalize(12),
            backgroundColor: '#fff',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: normalize(6),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }}
          onPress={() => console.log('환경설정')}
        >
          <IconSettings size={normalize(18)} color="rgba(0,0,0,0.3)" strokeWidth={2} />
          <Text className="font-medium tracking-tight" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.5)' }}>
            환경설정
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            height: normalize(48),
            borderRadius: normalize(12),
            backgroundColor: '#fff',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: normalize(6),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }}
          onPress={() => console.log('고객센터')}
        >
          <IconHeadset size={normalize(18)} color="rgba(0,0,0,0.3)" strokeWidth={2} />
          <Text className="font-medium tracking-tight" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.5)' }}>
            고객센터
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
