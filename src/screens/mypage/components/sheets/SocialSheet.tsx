import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { IconX } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM } from '@/constants/layout';

interface SocialSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function SocialSheet({ visible, onClose }: SocialSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: normalize(20) }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: normalize(16) }}>
          <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(20) }}>
            소셜 계정
          </Text>
          <TouchableOpacity onPress={onClose} style={{ padding: normalize(4) }}>
            <IconX size={normalize(24)} color="rgba(0,0,0,0.4)" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Kakao - Connected */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: normalize(12), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10) }}>
            <View style={{ width: normalize(32), height: normalize(32), borderRadius: normalize(8), backgroundColor: '#fee500', alignItems: 'center', justifyContent: 'center' }}>
              {/* Mock Icon */}
              <Text style={{ fontWeight: 'bold', color: '#3A1D1D', fontSize: normalizeFontSize(16) }}>K</Text>
            </View>
            <View>
              <Text className="font-medium text-black tracking-tight" style={{ fontSize: FONT_SM }}>카카오 계정</Text>
              <Text className="tracking-tight mt-0.5" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.35)' }}>sunset_jk@kakao.com</Text>
            </View>
          </View>
          <View style={{ height: normalize(24), paddingHorizontal: normalize(10), borderRadius: normalize(12), backgroundColor: 'rgba(52, 199, 89, 0.1)', flexDirection: 'row', alignItems: 'center', gap: normalize(4) }}>
            <View style={{ width: normalize(6), height: normalize(6), borderRadius: normalize(3), backgroundColor: '#34c759' }} />
            <Text className="font-medium" style={{ fontSize: normalizeFontSize(12), color: '#34c759' }}>연결됨</Text>
          </View>
        </View>

        {/* Apple - Not connected */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: normalize(12), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10) }}>
            <View style={{ width: normalize(32), height: normalize(32), borderRadius: normalize(8), backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontWeight: 'bold', color: '#fff', fontSize: normalizeFontSize(16) }}>A</Text>
            </View>
            <View>
              <Text className="font-medium text-black tracking-tight" style={{ fontSize: FONT_SM }}>Apple 계정</Text>
              <Text className="tracking-tight mt-0.5" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.35)' }}>연결 안 됨</Text>
            </View>
          </View>
          <TouchableOpacity style={{ height: normalize(30), paddingHorizontal: normalize(14), borderRadius: normalize(15), backgroundColor: 'rgba(227, 27, 89, 0.08)', justifyContent: 'center' }}>
            <Text className="font-medium" style={{ fontSize: FONT_SM, color: '#e31b59' }}>연결하기</Text>
          </TouchableOpacity>
        </View>

        {/* Google - Not connected */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: normalize(12) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10) }}>
            <View style={{ width: normalize(32), height: normalize(32), borderRadius: normalize(8), backgroundColor: '#fff', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontWeight: 'bold', color: '#EA4335', fontSize: normalizeFontSize(16) }}>G</Text>
            </View>
            <View>
              <Text className="font-medium text-black tracking-tight" style={{ fontSize: FONT_SM }}>Google 계정</Text>
              <Text className="tracking-tight mt-0.5" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.35)' }}>연결 안 됨</Text>
            </View>
          </View>
          <TouchableOpacity style={{ height: normalize(30), paddingHorizontal: normalize(14), borderRadius: normalize(15), backgroundColor: 'rgba(227, 27, 89, 0.08)', justifyContent: 'center' }}>
            <Text className="font-medium" style={{ fontSize: FONT_SM, color: '#e31b59' }}>연결하기</Text>
          </TouchableOpacity>
        </View>

      </View>
    </BottomSheet>
  );
}
