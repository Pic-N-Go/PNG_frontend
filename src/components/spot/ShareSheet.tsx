import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { IconChevronRight, IconCopy, IconDots, IconDownload } from '@tabler/icons-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

type ShareTarget = 'kakao' | 'instagram' | 'x' | 'message' | 'copy' | 'save-img' | 'more';

const SHARE_MESSAGES: Record<ShareTarget, string> = {
  kakao: '카카오톡으로 공유합니다',
  instagram: '인스타그램 스토리로 공유합니다',
  x: 'X(트위터)로 공유합니다',
  message: '메시지로 공유합니다',
  copy: '링크가 복사됐어요',
  'save-img': '이미지를 저장했어요',
  more: '공유 옵션을 불러옵니다',
};

const SHARE_APPS: { id: 'kakao' | 'instagram' | 'x' | 'message'; label: string }[] = [
  { id: 'kakao', label: '카카오톡' },
  { id: 'instagram', label: '인스타그램' },
  { id: 'x', label: 'X' },
  { id: 'message', label: '메시지' },
];

function ShareAppIcon({ id }: { id: 'kakao' | 'instagram' | 'x' | 'message' }) {
  if (id === 'kakao') {
    return (
      <View style={{ width: normalize(52), height: normalize(52), borderRadius: normalize(16), backgroundColor: '#FEE500', alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={normalize(28)} height={normalize(26)} viewBox="0 0 30 26">
          <Path d="M15 0C7.3 0 1 5 1 11.2c0 4 2.4 7.5 6 9.6L5.5 27 13.4 22c.5.1 1.1.1 1.6.1 7.7 0 14-5 14-11.2C29 5 22.7 0 15 0z" fill="#3C1E1E" />
        </Svg>
      </View>
    );
  }
  if (id === 'instagram') {
    return (
      <View style={{ width: normalize(52), height: normalize(52), borderRadius: normalize(16), overflow: 'hidden' }}>
        <LinearGradient
          colors={['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Svg width={normalize(24)} height={normalize(24)} viewBox="0 0 24 24">
            <Rect x={2} y={2} width={20} height={20} rx={5} stroke="#fff" strokeWidth={1.6} fill="none" />
            <Circle cx={12} cy={12} r={4} stroke="#fff" strokeWidth={1.6} fill="none" />
            <Circle cx={17.5} cy={6.5} r={1} fill="#fff" />
          </Svg>
        </LinearGradient>
      </View>
    );
  }
  if (id === 'x') {
    return (
      <View style={{ width: normalize(52), height: normalize(52), borderRadius: normalize(16), backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={normalize(22)} height={normalize(22)} viewBox="0 0 22 22">
          <Path
            d="M17.3 2h2.9l-6.4 7.3L21.4 20h-5.9l-4.6-6-5.3 6H2.7l6.8-7.8L1.6 2h6.1l4.2 5.5L17.3 2zM16.3 18.3h1.6L6.6 3.6H4.9l11.4 14.7z"
            fill="#fff"
          />
        </Svg>
      </View>
    );
  }
  return (
    <View style={{ width: normalize(52), height: normalize(52), borderRadius: normalize(16), backgroundColor: '#34C759', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={normalize(24)} height={normalize(24)} viewBox="0 0 24 24">
        <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#fff" strokeWidth={1.8} fill="none" />
      </Svg>
    </View>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onShared: (message: string) => void;
}

export default function ShareSheet({ visible, onClose, onShared }: Props) {
  function handleAction(target: ShareTarget) {
    onClose();
    onShared(SHARE_MESSAGES[target]);
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(16), paddingBottom: normalize(12) }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(18), color: '#000', letterSpacing: -0.35 }}>
          공유하기
        </Text>
      </View>

      <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(4) }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: normalize(20) }}>
          {SHARE_APPS.map((app) => (
            <Pressable key={app.id} onPress={() => handleAction(app.id)} style={{ alignItems: 'center', gap: normalize(6) }}>
              <ShareAppIcon id={app.id} />
              <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(11), color: 'rgba(0,0,0,0.6)' }}>{app.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)', marginBottom: normalize(4) }} />

        {[
          { id: 'copy' as const, label: '링크 복사', Icon: IconCopy },
          { id: 'save-img' as const, label: '이미지로 저장', Icon: IconDownload },
          { id: 'more' as const, label: '더 보기', Icon: IconDots },
        ].map((action) => (
          <Pressable
            key={action.id}
            onPress={() => handleAction(action.id)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), paddingVertical: normalize(14) }}
          >
            <action.Icon size={normalize(18)} color="rgba(0,0,0,0.5)" strokeWidth={2} />
            <Text allowFontScaling={false} style={{ flex: 1, fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.15 }}>{action.label}</Text>
            <IconChevronRight size={normalize(18)} color="rgba(0,0,0,0.25)" strokeWidth={2} />
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}
