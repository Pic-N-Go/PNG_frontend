import React, { useRef, useState } from 'react';
import { Alert, Dimensions, Image, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Clock, Info, MapPin, Sun, X } from 'lucide-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { BUTTON_RADIUS, FONT_2XS, FONT_LG, FONT_MD, FONT_SM, FONT_XS, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

export interface SubmitEntryPayload {
  photoUri: string;
  caption: string;
  location: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: SubmitEntryPayload) => void;
}

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';
const CAPTION_MAX = 200;
// BottomSheet 자체가 창 높이의 80%로 제한하므로, 헤더·CTA(고정 영역) 몫을 뺀 나머지만
// 내부 스크롤 영역에 배정한다. BookmarkSheet.tsx의 SCROLL_MAX 산정 방식과 동일하다.
const SCROLL_MAX = Dimensions.get('window').height * 0.8 - normalize(200);

// ponytail: EXIF 파싱(촬영일시·날씨·카메라·위치)은 API 담당자 몫이라 아직 없다.
// 그때까지 자동 인식 항목은 전부 이 placeholder로 두고, 연동되면 값만 갈아끼운다.
const EXIF_PENDING = '—';

export default function SubmitEntrySheet({ visible, onClose, onSubmit }: Props) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  const reset = () => {
    setPhotoUri(null);
    setCaption('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // iOS PHPickerViewController는 앱 프로세스 밖에서 뜨므로 권한 요청이 필요 없다.
  // Android에서만 물어보고, 거부한 사용자는 설정으로 안내한다(CommunityWriteScreen과 동일 패턴).
  const picking = useRef(false);
  const pickPhoto = async () => {
    if (picking.current) return;
    picking.current = true;
    try {
      if (Platform.OS === 'android') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            '사진 접근 권한 필요',
            '설정에서 사진 접근을 허용해 주세요.',
            permission.canAskAgain
              ? [{ text: '확인' }]
              : [{ text: '취소', style: 'cancel' }, { text: '설정 열기', onPress: () => Linking.openSettings() }],
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.8,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (result.canceled) return;

      const picked = result.assets[0];
      if (picked) setPhotoUri(picked.uri);
    } finally {
      picking.current = false;
    }
  };

  const handleSubmit = () => {
    if (!photoUri) return;
    onSubmit({ photoUri, caption: caption.trim(), location: EXIF_PENDING });
    reset();
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View className="flex-row items-center justify-between" style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(8) }}>
        <View>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: '#000' }}>
            출품하기
          </Text>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: 'rgba(0,0,0,0.4)', marginTop: normalize(2) }}>
            주제: 골든아워 · 마감 D-3
          </Text>
        </View>
        <Pressable
          onPress={handleClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="닫기"
          className="items-center justify-center"
          style={{ width: normalize(30), height: normalize(30), borderRadius: normalize(15), backgroundColor: SURFACE }}
        >
          <X size={normalize(13)} color="rgba(0,0,0,0.5)" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView style={{ maxHeight: SCROLL_MAX }} showsVerticalScrollIndicator={false}>
        {photoUri ? (
          <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(6), paddingBottom: normalize(14) }}>
            <View style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: normalize(16), overflow: 'hidden', backgroundColor: SURFACE }}>
              <Image source={{ uri: photoUri }} resizeMode="cover" className="w-full h-full" />
              <Pressable
                onPress={pickPhoto}
                accessibilityRole="button"
                accessibilityLabel="사진 변경"
                className="absolute flex-row items-center"
                style={{ bottom: normalize(12), right: normalize(12), height: normalize(32), paddingHorizontal: normalize(14), borderRadius: normalize(16), backgroundColor: 'rgba(0,0,0,0.5)', gap: normalize(5) }}
              >
                <Camera size={normalize(12)} color="#fff" strokeWidth={1.8} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.1, color: '#fff' }}>
                  사진 변경
                </Text>
              </Pressable>
            </View>
            <Text
              allowFontScaling={false}
              style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, lineHeight: FONT_XS * 1.5, letterSpacing: -0.15, color: 'rgba(0,0,0,0.4)', marginTop: normalize(8) }}
            >
              사진에서 EXIF(촬영일시·위치·카메라·렌즈)를 자동으로 읽어와요.
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(6), paddingBottom: normalize(14) }}>
            <Pressable
              onPress={pickPhoto}
              accessibilityRole="button"
              accessibilityLabel="사진 선택"
              className="items-center justify-center"
              style={{
                width: '100%',
                aspectRatio: 4 / 3,
                borderRadius: normalize(16),
                backgroundColor: 'rgba(227,27,89,0.04)',
                borderWidth: 1.5,
                borderColor: 'rgba(227,27,89,0.25)',
                gap: normalize(10),
              }}
            >
              <View
                className="items-center justify-center"
                style={{ width: normalize(56), height: normalize(56), borderRadius: normalize(16), backgroundColor: 'rgba(227,27,89,0.1)' }}
              >
                <Camera size={normalize(26)} color={ACCENT} strokeWidth={1.7} />
              </View>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.2, color: ACCENT }}>
                사진 선택
              </Text>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: 'rgba(0,0,0,0.4)' }}>
                골든아워 주제에 어울리는 사진 1장
              </Text>
            </Pressable>
            <Text
              allowFontScaling={false}
              style={{
                paddingVertical: normalize(14),
                paddingHorizontal: normalize(14),
                marginTop: normalize(14),
                backgroundColor: SURFACE,
                borderRadius: normalize(14),
                fontFamily: 'Pretendard-Regular',
                fontSize: FONT_XS,
                lineHeight: FONT_XS * 1.6,
                letterSpacing: -0.15,
                color: 'rgba(0,0,0,0.35)',
                textAlign: 'center',
              }}
            >
              사진을 선택하면 촬영정보 · 위치가 자동으로 채워져요
            </Text>
          </View>
        )}

        {photoUri && (
          <>
            <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(14) }}>
              <View style={{ paddingVertical: normalize(12), paddingHorizontal: normalize(14), backgroundColor: SURFACE, borderRadius: normalize(14) }}>
                <View className="flex-row items-center" style={{ gap: normalize(6), marginBottom: normalize(10) }}>
                  <Info size={normalize(12)} color="rgba(0,0,0,0.4)" strokeWidth={1.8} />
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: 0.3, color: 'rgba(0,0,0,0.5)' }}>
                    사진에서 자동 인식
                  </Text>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_2XS, letterSpacing: -0.1, color: 'rgba(0,0,0,0.35)', marginLeft: 'auto' }}>
                    출품 후 수정 불가
                  </Text>
                </View>
                <InfoRow icon={<Clock size={normalize(14)} color="rgba(0,0,0,0.4)" strokeWidth={1.8} />} label="시간" value={EXIF_PENDING} />
                <Divider />
                <InfoRow icon={<Sun size={normalize(14)} color="rgba(0,0,0,0.4)" strokeWidth={1.8} />} label="날씨" value={EXIF_PENDING} />
                <Divider />
                <InfoRow icon={<Camera size={normalize(14)} color="rgba(0,0,0,0.4)" strokeWidth={1.8} />} label="카메라" value={EXIF_PENDING} />
                <Divider />
                <InfoRow icon={<MapPin size={normalize(14)} color={ACCENT} strokeWidth={1.8} />} label="위치" value={EXIF_PENDING} />
              </View>
            </View>

            <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(14) }}>
              <View className="flex-row items-baseline justify-between" style={{ marginBottom: normalize(8) }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: 0.4, color: 'rgba(0,0,0,0.4)' }}>
                  캡션{' '}
                  <Text style={{ fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.3)' }}>· 선택</Text>
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: 'rgba(0,0,0,0.3)' }}>
                  {`${caption.length}/${CAPTION_MAX}`}
                </Text>
              </View>
              <View style={{ paddingVertical: normalize(12), paddingHorizontal: normalize(14), backgroundColor: SURFACE, borderRadius: normalize(14) }}>
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  maxLength={CAPTION_MAX}
                  multiline
                  textAlignVertical="top"
                  placeholder="이 사진 한 줄 소개 (심사에는 영향 없음)"
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  style={{
                    minHeight: normalize(64),
                    fontFamily: 'Pretendard-Regular',
                    fontSize: normalizeFontSize(14),
                    lineHeight: normalizeFontSize(14) * 1.55,
                    letterSpacing: -0.2,
                    color: '#000',
                  }}
                />
              </View>
            </View>

            <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(16) }}>
              <View
                className="flex-row items-start"
                style={{ gap: normalize(8), paddingVertical: normalize(12), paddingHorizontal: normalize(14), backgroundColor: 'rgba(227,27,89,0.05)', borderRadius: normalize(12) }}
              >
                <Info size={normalize(14)} color={ACCENT} strokeWidth={1.8} style={{ marginTop: normalize(1) }} />
                <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, lineHeight: FONT_XS * 1.6, letterSpacing: -0.15, color: 'rgba(0,0,0,0.65)' }}>
                  {'주 1회 출품 가능 · 출품 후 '}
                  <Text style={{ fontFamily: 'Pretendard-SemiBold', color: '#000' }}>사진·위치·촬영정보는 수정 불가</Text>
                  {' · 캡션만 마감 전 수정 가능 · 출품 취소 시 받은 표는 '}
                  <Text style={{ fontFamily: 'Pretendard-SemiBold', color: '#000' }}>복구되지 않아요</Text>
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(16) }}>
        <Pressable
          onPress={handleSubmit}
          disabled={!photoUri}
          accessibilityRole="button"
          accessibilityLabel="출품하기"
          className="items-center justify-center"
          style={{ width: '100%', height: normalize(52), borderRadius: BUTTON_RADIUS, backgroundColor: photoUri ? ACCENT : SURFACE }}
        >
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.2, color: photoUri ? '#fff' : 'rgba(0,0,0,0.3)' }}>
            출품하기
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-row items-center" style={{ gap: normalize(10), paddingVertical: normalize(8), paddingHorizontal: normalize(2) }}>
      {icon}
      <Text allowFontScaling={false} style={{ width: normalize(44), fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: 'rgba(0,0,0,0.45)' }}>
        {label}
      </Text>
      <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(14), letterSpacing: -0.2, color: '#000' }}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.05)', marginHorizontal: normalize(-6) }} />;
}
