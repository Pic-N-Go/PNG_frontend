import React, { useRef, useEffect, useLayoutEffect } from 'react';
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

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleClose = React.useCallback(() => {
    Animated.timing(panY, {
      toValue: Dimensions.get('window').height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onCloseRef.current());
  }, [panY]);

  const panResponder = useRef<any>(null);
  if (!panResponder.current) {
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          Animated.timing(panY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      },
    });
  }

  useLayoutEffect(() => {
    if (visible) {
      panY.setValue(Dimensions.get('window').height);
      Animated.timing(panY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, panY]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
        onPress={handleClose}
      >
        <Animated.View style={{ transform: [{ translateY: panY }] }}>
          <Pressable onPress={() => {}}>
            <View
              style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: BOTTOM_SHEET_RADIUS,
                borderTopRightRadius: BOTTOM_SHEET_RADIUS,
                maxHeight: MAX_HEIGHT,
                paddingBottom: Math.max(insets.bottom, normalize(24)),
              }}
            >
              <View 
                {...panResponder.current.panHandlers}
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
