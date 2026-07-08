import React, { useRef, useEffect } from 'react';
import { Dimensions, Modal, Pressable, View, Animated, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_SHEET_RADIUS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const MAX_HEIGHT = Dimensions.get('window').height * 0.8;

export default function BottomSheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets();

  const panY = useRef(new Animated.Value(0)).current;

  const resetPositionAnim = Animated.timing(panY, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  });

  const closeAnim = Animated.timing(panY, {
    toValue: Dimensions.get('window').height,
    duration: 300,
    useNativeDriver: true,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          closeAnim.start(() => onClose());
        } else {
          resetPositionAnim.start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
    }
  }, [visible, panY]);

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Animated.View style={{ transform: [{ translateY: panY }] }}>
          <Pressable onPress={() => {}}>
            <View
              style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: BOTTOM_SHEET_RADIUS,
                borderTopRightRadius: BOTTOM_SHEET_RADIUS,
                maxHeight: MAX_HEIGHT,
                paddingBottom: insets.bottom,
              }}
            >
              <View 
                {...panResponder.panHandlers}
                style={{ alignItems: 'center', paddingTop: normalize(10), paddingBottom: normalize(20) }}
              >
                <View
                  style={{
                    width: normalize(36),
                    height: normalize(4),
                    borderRadius: normalize(2),
                    backgroundColor: 'rgba(0,0,0,0.12)',
                  }}
                />
              </View>
              {children}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
