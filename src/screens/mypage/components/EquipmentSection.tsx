import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Pressable, PanResponder, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { IconCamera, IconAperture, IconChevronRight, IconX, IconTrash } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM, FONT_MD, FONT_XS } from '@/constants/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MY_EQUIPMENTS = [
  { id: '1', name: 'Sony A7IV', type: '카메라 바디', desc: '', isCamera: true },
  { id: '2', name: '16-35mm f/2.8 GM', type: '렌즈', desc: '풍경/야경', isCamera: false },
  { id: '3', name: 'FE 70-200mm F2.8 GM OSS II', type: '렌즈', desc: '망원 줌 렌즈', isCamera: false },
  { id: '4', name: 'DJI Mavic 3', type: '드론', desc: '항공 촬영', isCamera: true },
];

export default function EquipmentSection() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('카메라');
  const [newEquipmentName, setNewEquipmentName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const translateY = React.useRef(new Animated.Value(500)).current;
  const keyboardHeight = React.useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const isKeyboardVisible = React.useRef(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      isKeyboardVisible.current = true;
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: false,
      }).start();
    });
    
    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      isKeyboardVisible.current = false;
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleOverlayPress = () => {
    if (isKeyboardVisible.current) {
      Keyboard.dismiss();
    } else {
      closeSheet();
    }
  };

  const openSheet = () => {
    setSheetVisible(true);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: false,
      bounciness: 0,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: 500,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      setSheetVisible(false);
      setIsAdding(false);
    });
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dy) > 10,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => gestureState.dy > 10, // 아래로 드래그 시 터치 가로채기
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          closeSheet();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
        }
      },
    })
  ).current;

  const combinedTranslateY = Animated.add(
    translateY,
    Animated.multiply(keyboardHeight, -1)
  );

  return (
    <View className="mb-10 px-5">
      <View className="flex-row justify-between items-baseline mb-3">
        <Text className="font-semibold tracking-tight text-black" style={{ fontSize: normalizeFontSize(20) }}>
          내 장비
        </Text>
        <TouchableOpacity
          style={{
            height: normalize(26),
            paddingHorizontal: normalize(14),
            borderRadius: normalize(13),
            backgroundColor: 'rgba(227, 27, 89, 0.08)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={openSheet}
        >
          <Text className="font-medium tracking-tight" style={{ fontSize: normalizeFontSize(12), color: '#e31b59' }}>
            관리
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          borderRadius: normalize(16),
          backgroundColor: '#f8f8f9',
          overflow: 'hidden',
        }}
      >
        {MY_EQUIPMENTS.slice(0, 2).map((item, index) => (
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
                width: normalize(32),
                height: normalize(32),
                borderRadius: normalize(10),
                backgroundColor: 'rgba(0,0,0,0.05)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.isCamera ? (
                <IconCamera size={normalize(18)} color="rgba(0,0,0,0.4)" strokeWidth={1.5} />
              ) : (
                <IconAperture size={normalize(18)} color="rgba(0,0,0,0.4)" strokeWidth={1.5} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text className="font-medium text-black tracking-tight" style={{ fontSize: normalizeFontSize(15), marginBottom: normalize(1) }}>
                {item.name}
              </Text>
              <Text className="tracking-tight" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.35)' }}>
                {item.type}{item.desc ? ` · ${item.desc}` : ''}
              </Text>
            </View>
            
            {index === 1 && MY_EQUIPMENTS.length > 2 && (
              <TouchableOpacity onPress={openSheet} className="flex-row items-center ml-2 p-2" style={{ gap: normalize(4) }}>
                <Text className="font-medium tracking-tight" style={{ fontSize: normalizeFontSize(13), color: 'rgba(0,0,0,0.25)' }}>
                  +{MY_EQUIPMENTS.length - 2}
                </Text>
                <IconChevronRight size={normalize(14)} color="rgba(0,0,0,0.25)" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Modal transparent visible={sheetVisible} animationType="none" onRequestClose={handleOverlayPress}>
        <View style={{ flex: 1 }}>
          <Pressable style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={handleOverlayPress} />
          <Animated.View
            {...panResponder.panHandlers}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#fff',
              borderTopLeftRadius: normalize(20),
              borderTopRightRadius: normalize(20),
              transform: [{ translateY: combinedTranslateY }],
              paddingBottom: insets.bottom > 0 ? insets.bottom : normalize(20),
              maxHeight: '80%',
            }}
          >
            <View style={{ alignItems: 'center', paddingVertical: normalize(12), paddingBottom: normalize(4) }}>
              <View style={{ width: normalize(36), height: normalize(5), borderRadius: normalize(2.5), backgroundColor: 'rgba(0,0,0,0.1)' }} />
            </View>
            
            <View className="flex-row items-center justify-between px-5 pb-3">
              <Text className="font-semibold tracking-tight text-black" style={{ fontSize: normalizeFontSize(20) }}>
                내 장비
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
                      width: normalize(32),
                      height: normalize(32),
                      borderRadius: normalize(16),
                      backgroundColor: 'rgba(227, 27, 89, 0.08)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconTrash size={normalize(18)} color="#e31b59" strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>
              ))}
              
              <View style={{ marginTop: normalize(20) }}>
                {isAdding ? (
                  <>
                    <View style={{ flexDirection: 'row', gap: normalize(8), marginBottom: normalize(12) }}>
                      {['카메라', '렌즈', '드론'].map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setSelectedCategory(cat)}
                          style={{
                            paddingHorizontal: normalize(16),
                            paddingVertical: normalize(8),
                            borderRadius: normalize(16),
                            backgroundColor: selectedCategory === cat ? '#000' : '#f5f5f7',
                          }}
                        >
                          <Text
                            className="font-medium tracking-tight"
                            style={{
                              fontSize: normalizeFontSize(13),
                              color: selectedCategory === cat ? '#fff' : 'rgba(0,0,0,0.4)',
                            }}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={{ flexDirection: 'row', gap: normalize(10) }}>
                      <TextInput
                        value={newEquipmentName}
                        onChangeText={setNewEquipmentName}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="장비명 입력 (예: Canon R6II)"
                        placeholderTextColor="rgba(0,0,0,0.3)"
                        style={{
                          flex: 1,
                          height: normalize(44),
                          borderWidth: 1,
                          borderColor: isFocused || newEquipmentName ? '#e31b59' : 'rgba(0,0,0,0.1)',
                          borderRadius: normalize(12),
                          paddingHorizontal: normalize(14),
                          fontSize: normalizeFontSize(14),
                          color: '#000',
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => setIsAdding(false)}
                        style={{
                          height: normalize(44),
                          paddingHorizontal: normalize(20),
                          borderRadius: normalize(12),
                          backgroundColor: '#e31b59',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text className="font-semibold tracking-tight text-white" style={{ fontSize: normalizeFontSize(14) }}>
                          추가
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setIsAdding(true)}
                    style={{
                      height: normalize(44),
                      borderRadius: normalize(22),
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.1)',
                      borderStyle: 'dashed',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text className="font-medium tracking-tight" style={{ fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.3)' }}>
                      + 장비 추가하기
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
