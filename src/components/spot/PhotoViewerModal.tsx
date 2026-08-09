import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Modal, NativeScrollEvent, NativeSyntheticEvent, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconX } from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';
import { FONT_SM } from '@/constants/layout';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  visible: boolean;
  photos: string[];
  onClose: () => void;
}

export default function PhotoViewerModal({ visible, photos, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList<string>>(null);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  }

  // Modal은 visible 토글 사이에도 자식을 마운트 상태로 유지 → FlatList 스크롤 위치를 직접 되돌려야 함
  function handleShow() {
    setCurrentIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onShow={handleShow}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <FlatList
          ref={listRef}
          data={photos}
          keyExtractor={(uri, i) => `${i}-${uri}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={{ width: SCREEN_WIDTH, height: '100%' }} resizeMode="contain" />
          )}
        />

        <Pressable
          onPress={onClose}
          hitSlop={8}
          style={{
            position: 'absolute',
            top: insets.top + normalize(10),
            right: normalize(16),
            width: normalize(36),
            height: normalize(36),
            borderRadius: normalize(18),
            backgroundColor: 'rgba(0,0,0,0.45)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconX size={normalize(18)} color="#fff" strokeWidth={2} />
        </Pressable>

        {photos.length > 1 && (
          <View
            style={{
              position: 'absolute',
              bottom: insets.bottom + normalize(20),
              alignSelf: 'center',
              height: normalize(26),
              paddingHorizontal: normalize(12),
              borderRadius: normalize(13),
              backgroundColor: 'rgba(0,0,0,0.5)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            pointerEvents="none"
          >
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: '#fff' }}>
              {currentIndex + 1} / {photos.length}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
