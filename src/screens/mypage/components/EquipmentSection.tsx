import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Pressable } from 'react-native';
import { IconCamera, IconAperture, IconChevronRight, IconX } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM, FONT_MD, FONT_XS } from '@/constants/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MY_EQUIPMENTS = [
  { id: '1', name: 'Sony A7 IV', type: '바디', desc: '풀프레임 미러리스', isCamera: true },
  { id: '2', name: 'FE 24-70mm F2.8 GM II', type: '렌즈', desc: '표준 줌 렌즈', isCamera: false },
];

export default function EquipmentSection() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const translateY = React.useRef(new Animated.Value(500)).current;
  const insets = useSafeAreaInsets();

  const openSheet = () => {
    setSheetVisible(true);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: 500,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setSheetVisible(false));
  };

  return (
    <View className="mb-10 px-5">
      <View className="flex-row justify-between items-baseline mb-3">
        <Text className="font-semibold tracking-tight text-black" style={{ fontSize: normalizeFontSize(20) }}>
          나의 장비
        </Text>
        <TouchableOpacity
          style={{
            height: normalize(26),
            paddingHorizontal: normalize(12),
            borderRadius: normalize(13),
            backgroundColor: 'rgba(227, 27, 89, 0.08)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={openSheet}
        >
          <Text className="font-medium tracking-tight" style={{ fontSize: normalizeFontSize(12), color: '#e31b59' }}>
            + 관리하기
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          borderRadius: normalize(16),
          backgroundColor: '#fff',
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
          elevation: 2,
        }}
      >
        {MY_EQUIPMENTS.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => console.log('장비 상세:', item.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: normalize(16),
              paddingVertical: normalize(14),
              borderTopWidth: index > 0 ? 0.5 : 0,
              borderTopColor: 'rgba(0,0,0,0.04)',
              gap: normalize(12),
            }}
          >
            <View
              style={{
                width: normalize(28),
                height: normalize(28),
                borderRadius: normalize(8),
                backgroundColor: 'rgba(0,0,0,0.05)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.isCamera ? (
                <IconCamera size={normalize(16)} color="#000" strokeWidth={1.5} />
              ) : (
                <IconAperture size={normalize(16)} color="#000" strokeWidth={1.5} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text className="font-medium text-black tracking-tight" style={{ fontSize: FONT_MD, marginBottom: normalize(1) }}>
                {item.name}
              </Text>
              <Text className="tracking-tight" style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)' }}>
                {item.type} · {item.desc}
              </Text>
            </View>
            <View className="flex-row items-center" style={{ gap: normalize(2) }}>
              <Text className="tracking-tight" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.2)' }}>
                상세보기
              </Text>
              <IconChevronRight size={normalize(14)} color="rgba(0,0,0,0.2)" strokeWidth={2} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 장비 관리 바텀 시트 */}
      <Modal transparent visible={sheetVisible} animationType="none" onRequestClose={closeSheet}>
        <View style={{ flex: 1 }}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={closeSheet} />
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#fff',
              borderTopLeftRadius: normalize(20),
              borderTopRightRadius: normalize(20),
              transform: [{ translateY }],
              paddingBottom: insets.bottom > 0 ? insets.bottom : normalize(20),
              maxHeight: '80%',
            }}
          >
            <View style={{ alignItems: 'center', paddingVertical: normalize(12), paddingBottom: normalize(4) }}>
              <View style={{ width: normalize(36), height: normalize(5), borderRadius: normalize(2.5), backgroundColor: 'rgba(0,0,0,0.1)' }} />
            </View>
            
            <View className="flex-row items-center justify-between px-5 pb-3">
              <Text className="font-semibold tracking-tight text-black" style={{ fontSize: normalizeFontSize(20) }}>
                장비 관리
              </Text>
              <TouchableOpacity
                onPress={closeSheet}
                style={{
                  width: normalize(32),
                  height: normalize(32),
                  borderRadius: normalize(16),
                  backgroundColor: '#f5f5f7',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconX size={normalize(18)} color="#000" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: normalize(20) }}>
              {MY_EQUIPMENTS.map((item, index) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: normalize(12),
                    borderBottomWidth: index < MY_EQUIPMENTS.length - 1 ? 0.5 : 0,
                    borderBottomColor: 'rgba(0,0,0,0.05)',
                    gap: normalize(12),
                  }}
                >
                  <View
                    style={{
                      width: normalize(36),
                      height: normalize(36),
                      borderRadius: normalize(10),
                      backgroundColor: '#f5f5f7',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.isCamera ? (
                      <IconCamera size={normalize(20)} color="#000" strokeWidth={1.5} />
                    ) : (
                      <IconAperture size={normalize(20)} color="#000" strokeWidth={1.5} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View className="flex-row items-center mb-1">
                      <Text className="font-medium text-black tracking-tight" style={{ fontSize: FONT_SM }}>
                        {item.name}
                      </Text>
                      <View
                        style={{
                          height: normalize(18),
                          paddingHorizontal: normalize(8),
                          borderRadius: normalize(9),
                          marginLeft: normalize(6),
                          backgroundColor: item.isCamera ? 'rgba(0,0,0,0.06)' : 'rgba(227, 27, 89, 0.08)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          className="font-medium tracking-tight"
                          style={{
                            fontSize: normalizeFontSize(10),
                            color: item.isCamera ? 'rgba(0,0,0,0.4)' : '#e31b59',
                          }}
                        >
                          {item.type}
                        </Text>
                      </View>
                    </View>
                    <Text className="tracking-tight" style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)' }}>
                      {item.desc}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: normalize(10),
                      paddingVertical: normalize(6),
                      borderRadius: normalize(6),
                      backgroundColor: 'rgba(0,0,0,0.04)',
                    }}
                  >
                    <Text className="font-medium tracking-tight" style={{ fontSize: normalizeFontSize(12), color: '#e31b59' }}>
                      삭제
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              <TouchableOpacity
                style={{
                  marginTop: normalize(12),
                  width: '100%',
                  height: normalize(44),
                  borderRadius: normalize(12),
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.1)',
                  borderStyle: 'dashed',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text className="font-medium tracking-tight" style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)' }}>
                  + 새 장비 추가
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
