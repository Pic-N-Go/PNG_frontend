import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Pressable, PanResponder, TextInput, Platform, Keyboard, Alert, ActivityIndicator } from 'react-native';
import { IconCamera, IconAperture, IconChevronRight, IconX, IconTrash } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { BORDER_CONTROL, FONT_SM, FONT_XS, GRID_PADDING, HAIRLINE_WIDTH } from '@/constants/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreateEquipment, useDeleteEquipment, useMyEquipments } from '@/hooks/useEquipment';
import { toErrorMessage } from '@/api/auth';
import { BRAND, BRAND_TINT, CARD, HAIRLINE, SCRIM, TEXT_SUB } from '@/constants/colors';

// 서버 EquipmentType은 CAMERA·LENS 둘뿐이다. 목업에 있던 "드론"은 저장할 곳이 없어 뺐다.
const CATEGORIES = [
  { label: '카메라', type: 'CAMERA' as const },
  { label: '렌즈', type: 'LENS' as const },
];

export default function EquipmentSection() {
  const { data: equipments = [], isLoading, isError } = useMyEquipments();
  const createEquipment = useCreateEquipment();
  const deleteEquipment = useDeleteEquipment();

  // 화면이 쓰던 모양으로 맞춰준다(설명은 서버에 없어 비운다).
  const items = equipments.map((e) => ({
    id: e.id,
    name: e.equipmentName,
    type: e.equipmentType === 'CAMERA' ? '카메라' : '렌즈',
    desc: '',
    isCamera: e.equipmentType === 'CAMERA',
  }));

  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'CAMERA' | 'LENS'>('CAMERA');
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
  }, [keyboardHeight]);

  const handleOverlayPress = () => {
    if (isKeyboardVisible.current) {
      Keyboard.dismiss();
    } else {
      closeSheet();
    }
  };

  function handleAdd() {
    const name = newEquipmentName.trim();
    if (!name || createEquipment.isPending) return;
    createEquipment.mutate(
      { equipmentType: selectedCategory, equipmentName: name },
      {
        // 입력값은 성공했을 때만 비운다 - 실패했는데 지워지면 다시 타이핑해야 한다.
        onSuccess: () => {
          setNewEquipmentName('');
          setIsAdding(false);
        },
        onError: (err) => Alert.alert('장비를 추가하지 못했어요', toErrorMessage(err, '잠시 후 다시 시도해 주세요.')),
      },
    );
  }

  // 다른 삭제(게시글·댓글)와 같이 한 번 확인받는다. 한 번 탭으로 지워지면 되돌릴 수 없다.
  function handleDelete(equipmentId: number, name: string) {
    Alert.alert(`${name}을(를) 삭제할까요?`, undefined, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () =>
          deleteEquipment.mutate(equipmentId, {
            onError: (err) => Alert.alert('장비를 삭제하지 못했어요', toErrorMessage(err, '잠시 후 다시 시도해 주세요.')),
          }),
      },
    ]);
  }

  const openSheet = () => {
    setSheetVisible(true);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: false,
      bounciness: 0,
    }).start();
  };

  const closeSheet = () => {
    Keyboard.dismiss();
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
    <View className="mb-10" style={{ paddingHorizontal: GRID_PADDING }}>
      <View className="flex-row justify-between items-baseline mb-3">
        <Text className="font-semibold tracking-tight text-black" style={{ fontSize: normalizeFontSize(20) }}>
          내 장비
        </Text>
        <TouchableOpacity onPress={openSheet}>
          <Text className="tracking-tight font-normal" style={{ fontSize: FONT_SM, color: BRAND }}>
            관리
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          borderRadius: normalize(16),
          backgroundColor: CARD,
          overflow: 'hidden',
        }}
      >
        {isLoading && (
          <View style={{ paddingVertical: normalize(28) }}>
            <ActivityIndicator color={BRAND} />
          </View>
        )}

        {!isLoading && isError && (
          <Text
            className="text-center tracking-tight font-normal"
            style={{ paddingVertical: normalize(24), fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)' }}
          >
            장비를 불러오지 못했어요
          </Text>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <TouchableOpacity onPress={openSheet} style={{ paddingVertical: normalize(24), alignItems: 'center' }}>
            <Text className="tracking-tight font-normal" style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.3)' }}>
              등록한 장비가 없어요 · 탭하여 추가
            </Text>
          </TouchableOpacity>
        )}

        {items.slice(0, 2).map((item, index) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => console.log('장비 상세:', item.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: normalize(16),
              paddingVertical: normalize(14),
              borderTopWidth: index > 0 ? HAIRLINE_WIDTH : 0,
              borderTopColor: HAIRLINE,
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
                <IconCamera size={normalize(18)} color={TEXT_SUB} strokeWidth={1.5} />
              ) : (
                <IconAperture size={normalize(18)} color={TEXT_SUB} strokeWidth={1.5} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text className="font-medium text-black tracking-tight" style={{ fontSize: normalizeFontSize(15), marginBottom: normalize(1) }}>
                {item.name}
              </Text>
              <Text className="tracking-tight font-normal" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.35)' }}>
                {item.type}{item.desc ? ` · ${item.desc}` : ''}
              </Text>
            </View>
            
            {index === 1 && items.length > 2 && (
              <TouchableOpacity onPress={openSheet} className="flex-row items-center ml-2 p-2" style={{ gap: normalize(4) }}>
                <Text className="font-medium tracking-tight" style={{ fontSize: normalizeFontSize(13), color: 'rgba(0,0,0,0.25)' }}>
                  +{items.length - 2}
                </Text>
                <IconChevronRight size={normalize(14)} color="rgba(0,0,0,0.25)" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Modal transparent visible={sheetVisible} animationType="none" onRequestClose={handleOverlayPress}>
        <View style={{ flex: 1 }}>
          <Pressable style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: SCRIM }} onPress={handleOverlayPress} />
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
            
            <View className="flex-row items-center justify-between pb-3" style={{ paddingHorizontal: GRID_PADDING }}>
              <Text className="font-semibold tracking-tight text-black" style={{ fontSize: normalizeFontSize(20) }}>
                내 장비
              </Text>
              <TouchableOpacity
                onPress={closeSheet}
                style={{
                  width: normalize(32),
                  height: normalize(32),
                  borderRadius: normalize(16),
                  backgroundColor: CARD,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconX size={normalize(18)} color="#000" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: GRID_PADDING }}>
              {items.map((item, index) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: normalize(12),
                    borderBottomWidth: index < items.length - 1 ? HAIRLINE_WIDTH : 0,
                    borderBottomColor: HAIRLINE,
                    gap: normalize(12),
                  }}
                >
                  <View
                    style={{
                      width: normalize(36),
                      height: normalize(36),
                      borderRadius: normalize(10),
                      backgroundColor: CARD,
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
                          backgroundColor: item.isCamera ? 'rgba(0,0,0,0.06)' : BRAND_TINT,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          className="font-medium tracking-tight"
                          style={{
                            fontSize: normalizeFontSize(10),
                            color: item.isCamera ? TEXT_SUB : BRAND,
                          }}
                        >
                          {item.type}
                        </Text>
                      </View>
                    </View>
                    <Text className="tracking-tight font-normal" style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)' }}>
                      {item.desc}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id, item.name)}
                    disabled={deleteEquipment.isPending && deleteEquipment.variables === item.id}
                    style={{
                      width: normalize(32),
                      height: normalize(32),
                      borderRadius: normalize(16),
                      backgroundColor: BRAND_TINT,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: deleteEquipment.isPending && deleteEquipment.variables === item.id ? 0.4 : 1,
                    }}
                  >
                    <IconTrash size={normalize(18)} color={BRAND} strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>
              ))}
              
              <View style={{ marginTop: normalize(20) }}>
                {isAdding ? (
                  <>
                    <View style={{ flexDirection: 'row', gap: normalize(8), marginBottom: normalize(12) }}>
                      {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat.type}
                          onPress={() => setSelectedCategory(cat.type)}
                          style={{
                            paddingHorizontal: normalize(16),
                            paddingVertical: normalize(8),
                            borderRadius: normalize(16),
                            backgroundColor: selectedCategory === cat.type ? '#000' : CARD,
                          }}
                        >
                          <Text
                            className="font-medium tracking-tight"
                            style={{
                              fontSize: normalizeFontSize(13),
                              color: selectedCategory === cat.type ? '#fff' : TEXT_SUB,
                            }}
                          >
                            {cat.label}
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
                          borderWidth: BORDER_CONTROL,
                          borderColor: isFocused || newEquipmentName ? BRAND : 'rgba(0,0,0,0.1)',
                          borderRadius: normalize(12),
                          paddingHorizontal: normalize(14),
                          fontSize: normalizeFontSize(14),
                          color: '#000',
                        }}
                      />
                      <TouchableOpacity
                        onPress={handleAdd}
                        disabled={!newEquipmentName.trim() || createEquipment.isPending}
                        style={{
                          height: normalize(44),
                          paddingHorizontal: normalize(20),
                          borderRadius: normalize(12),
                          backgroundColor: BRAND,
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: !newEquipmentName.trim() || createEquipment.isPending ? 0.35 : 1,
                        }}
                      >
                        <Text className="font-semibold tracking-tight text-white" style={{ fontSize: normalizeFontSize(14) }}>
                          {createEquipment.isPending ? '추가 중...' : '추가'}
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
                      borderWidth: BORDER_CONTROL,
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
