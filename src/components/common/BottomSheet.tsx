import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { Dimensions, KeyboardAvoidingView, Modal, Platform, Pressable, View, Animated, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_SHEET_RADIUS, SPACING_LG } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  dimOpacity?: number;
}

const DEFAULT_DIM_OPACITY = 0.4;

export default function BottomSheet({ visible, onClose, children, dimOpacity = DEFAULT_DIM_OPACITY }: Props) {
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
      {/* 안드로이드에서도 behavior를 줘야 한다. 이 앱은 edgeToEdgeEnabled(app.config.js)라
          setDecorFitsSystemWindows(false) 상태이고, 그러면 windowSoftInputMode="adjustResize"가
          창을 줄여 주지 않는다 — IME가 inset으로만 전달돼 앱이 직접 피해야 한다.
          (Modal이라서가 아니다. RN은 다이얼로그 창에도 adjustResize를 걸어 준다 —
           ReactModalHostView.kt. 액티비티든 다이얼로그든 엣지투엣지에서는 똑같이 안 줄어든다.)
          flex-end로 붙인 시트라 height가 맞다 — 컨테이너를 키보드 위 높이로 줄이면 시트가 올라간다. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable
          style={{ flex: 1, backgroundColor: `rgba(0,0,0,${dimOpacity})`, justifyContent: 'flex-end' }}
          onPress={handleClose}
        >
          <Animated.View style={{ transform: [{ translateY: panY }] }}>
            <Pressable onPress={() => {}}>
              <View
                style={{
                  backgroundColor: '#fff',
                  borderTopLeftRadius: BOTTOM_SHEET_RADIUS,
                  borderTopRightRadius: BOTTOM_SHEET_RADIUS,
                  // 퍼센트라야 키보드로 줄어든 부모를 기준으로 잡힌다. 고정값이면 키보드가 열렸을 때
                  // 시트가 부모보다 커져 flex-end 특성상 위쪽(헤더·닫기 버튼)이 잘린다.
                  maxHeight: '80%',
                  flexShrink: 1,
                  paddingBottom: Math.max(insets.bottom, SPACING_LG),
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
      </KeyboardAvoidingView>
    </Modal>
  );
}
