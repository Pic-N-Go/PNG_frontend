import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { Dimensions, Keyboard, Modal, Pressable, View, Animated, PanResponder, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_SHEET_RADIUS, SPACING_LG } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { useKeyboardOverlap } from '@/hooks/useKeyboardHeight';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  dimOpacity?: number;
}

const DEFAULT_DIM_OPACITY = 0.4;

export default function BottomSheet({ visible, onClose, children, dimOpacity = DEFAULT_DIM_OPACITY }: Props) {
  const insets = useSafeAreaInsets();
  const keyboardOverlap = useKeyboardOverlap();

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
      // 시트를 열어도 아래 화면의 TextInput은 포커스를 유지한 채 Modal에 가려질 뿐이라,
      // 시트를 닫는 순간 OS가 직전 first responder를 복원해 키보드가 혼자 다시 올라온다.
      // 열 때 한 번 내려두면 복원할 대상이 없다. (시트 자체 입력란은 탭할 때 다시 뜬다.)
      Keyboard.dismiss();
      panY.setValue(Dimensions.get('window').height);
      Animated.timing(panY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, panY]);

  // 키보드 대응은 useKeyboardOverlap 하나로만 한다.
  const lastOverlapRef = useRef(0);
  useEffect(() => {
    if (visible) {
      lastOverlapRef.current = keyboardOverlap;
    }
  }, [visible, keyboardOverlap]);

  // 시트가 닫힐 때 키보드도 같이 내려가는데, 그 사이 overlap이 0으로 떨어지면 페이드아웃 중인
  // 시트가 아래로 뚝 떨어진다. 닫히는 전환 동안에는 마지막 값으로 동결한다.
  const effectiveOverlap = visible ? keyboardOverlap : lastOverlapRef.current;

  // 이 Modal은 statusBarTranslucent라 화면 전체를 쓴다 — overlap과 같은 screen 기준으로 맞춘다.
  const screenHeight = Dimensions.get('screen').height;
  const sheetMaxHeight = Math.min(screenHeight * 0.8, screenHeight - effectiveOverlap);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
      <View
        className="flex-1 justify-end"
        style={{
          paddingBottom: effectiveOverlap,
        }}
      >
        {/* 뒷배경 딤: 외부 클릭 시 시트 닫기 (시트와 형제 관계로 두어 터치 가로채기 방지) */}
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(0,0,0,${dimOpacity})` },
          ]}
          onPress={handleClose}
        />

        {/* 바텀시트 본체 (Pressable로 감싸지 않아 내부 ScrollView 스크롤을 방해하지 않음) */}
        <Animated.View style={{ transform: [{ translateY: panY }] }}>
          <View
            className="bg-white shrink"
            style={{
              borderTopLeftRadius: BOTTOM_SHEET_RADIUS,
              borderTopRightRadius: BOTTOM_SHEET_RADIUS,
              maxHeight: sheetMaxHeight,
              // 키보드가 올라와 있으면 내비바 자리는 이미 키보드가 덮고 있다 —
              // insets.bottom을 또 더하면 키보드 위에 빈 띠가 생긴다.
              paddingBottom: effectiveOverlap > 0 ? SPACING_LG : Math.max(insets.bottom, SPACING_LG),
            }}
          >
            <View
              {...panResponder.current.panHandlers}
              className="items-center"
              style={{ paddingTop: normalize(10), paddingBottom: normalize(8) }}
            >
              <View
                className="bg-black/10"
                style={{
                  width: normalize(36),
                  height: normalize(4),
                  borderRadius: normalize(2),
                }}
              />
            </View>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
