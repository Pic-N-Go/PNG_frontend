import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { Dimensions, Modal, Pressable, View, Animated, PanResponder } from 'react-native';
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
      panY.setValue(Dimensions.get('window').height);
      Animated.timing(panY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, panY]);

  // 키보드 대응은 useKeyboardOverlap 하나로만 한다.
  //
  // 여기에 KeyboardAvoidingView를 함께 두면 두 시스템이 같은 서브트리를 동시에 밀어 올리면서
  // 시트가 두 위치를 오가며 깜빡인다. 기준 좌표계가 서로 달라서다 — KAV는 keyboardEvent의
  // endCoordinates(창 기준), 이 훅은 화면 기준이고, 이 앱은 엣지투엣지라 둘이 내비게이션 바
  // 높이(약 48dp)만큼 어긋난다(실측값은 useKeyboardHeight.ts 주석). 게다가 둘 다 각자
  // LayoutAnimation을 걸어서 매 프레임 서로의 레이아웃을 덮어쓴다.
  //
  // 훅 주석대로 overlap을 컨테이너 paddingBottom에 그대로 주면 flex-end로 붙인 시트가
  // 정확히 키보드 위로 올라온다.
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
  // (window 기준을 섞으면 위에서 말한 내비바 높이만큼의 어긋남이 그대로 되살아난다.)
  const screenHeight = Dimensions.get('screen').height;
  // 조상(Animated.View, Pressable)이 전부 auto-size라 퍼센트 maxHeight는 기준을 못 잡는다.
  // 키보드로 줄어든 실제 가용 높이를 숫자로 직접 준다.
  const sheetMaxHeight = Math.min(screenHeight * 0.8, screenHeight - effectiveOverlap);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
      {/* 이 앱은 edgeToEdgeEnabled(app.config.js)라 setDecorFitsSystemWindows(false) 상태이고,
          그러면 windowSoftInputMode="adjustResize"가 창을 줄여 주지 않는다 — IME가 inset으로만
          전달돼 앱이 직접 피해야 한다. (Modal이라서가 아니다. RN은 다이얼로그 창에도
          adjustResize를 걸어 준다 — ReactModalHostView.kt.)
          flex-end로 붙인 시트라 컨테이너 아래에 키보드 높이만큼 padding을 주면 시트가 올라간다. */}
      <Pressable
        className="flex-1 justify-end"
        style={{
          backgroundColor: `rgba(0,0,0,${dimOpacity})`,
          paddingBottom: effectiveOverlap,
        }}
        onPress={handleClose}
      >
        <Animated.View style={{ transform: [{ translateY: panY }] }}>
          <Pressable onPress={() => {}}>
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
                style={{ paddingTop: normalize(10), paddingBottom: normalize(20) }}
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
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
