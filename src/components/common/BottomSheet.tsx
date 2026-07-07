import React from 'react';
import { Dimensions, Modal, Pressable, View } from 'react-native';
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

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
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
            <View style={{ alignItems: 'center', paddingTop: normalize(10) }}>
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
      </Pressable>
    </Modal>
  );
}
