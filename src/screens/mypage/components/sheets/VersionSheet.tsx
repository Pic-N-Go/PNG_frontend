import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { IconX } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM } from '@/constants/layout';

interface VersionSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function VersionSheet({ visible, onClose }: VersionSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: normalize(20) }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: normalize(8) }}>
          <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(20) }}>
            버전 정보
          </Text>
          <TouchableOpacity onPress={onClose} style={{ padding: normalize(4) }}>
            <IconX size={normalize(24)} color="rgba(0,0,0,0.4)" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={{ paddingVertical: normalize(10), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)' }}>앱 버전</Text>
          <Text className="font-medium" style={{ fontSize: FONT_SM, color: '#000' }}>v1.0.0</Text>
        </View>
        <View style={{ paddingVertical: normalize(10), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)' }}>업데이트 상태</Text>
          <Text className="font-medium" style={{ fontSize: FONT_SM, color: '#34c759' }}>최신 버전</Text>
        </View>
        <View style={{ paddingVertical: normalize(10), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)' }}>출시일</Text>
          <Text className="font-medium" style={{ fontSize: FONT_SM, color: '#000' }}>2026.05.01</Text>
        </View>
        <View style={{ paddingVertical: normalize(10), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)' }}>개발사</Text>
          <Text className="font-medium" style={{ fontSize: FONT_SM, color: '#000' }}>多多益Shot</Text>
        </View>
        
        <View style={{ paddingVertical: normalize(10), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)' }}>이용약관</Text>
          <TouchableOpacity onPress={() => console.log('이용약관')}>
            <Text className="font-medium" style={{ fontSize: FONT_SM, color: '#e31b59' }}>보기 →</Text>
          </TouchableOpacity>
        </View>
        <View style={{ paddingVertical: normalize(10), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)' }}>개인정보처리방침</Text>
          <TouchableOpacity onPress={() => console.log('개인정보처리방침')}>
            <Text className="font-medium" style={{ fontSize: FONT_SM, color: '#e31b59' }}>보기 →</Text>
          </TouchableOpacity>
        </View>
        <View style={{ paddingVertical: normalize(10), flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)' }}>오픈소스 라이선스</Text>
          <TouchableOpacity onPress={() => console.log('오픈소스 라이선스')}>
            <Text className="font-medium" style={{ fontSize: FONT_SM, color: '#e31b59' }}>보기 →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}
