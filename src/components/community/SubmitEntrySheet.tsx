import React, { useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Camera, Clock, Info, MapPin, Sun, X } from 'lucide-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { BUTTON_RADIUS, FONT_2XS, FONT_LG, FONT_MD, FONT_SM, FONT_XS, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

export interface SubmitEntryPayload {
  photoGradient: [string, string, string];
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

interface PhotoPreset {
  photoGradient: [string, string, string];
  timeLabel: string;
  weatherLabel: string;
  cameraLabel: string;
  location: string;
}

// 실제 카메라/갤러리 연동은 이번 스코프가 아니라, 목업의 gradient 프리셋 중 고르는 UI로 대체한다.
// 값은 ContestSegment의 목업 데이터와 겹치는 그라디언트를 재사용했다.
const PHOTO_PRESETS: PhotoPreset[] = [
  { photoGradient: ['#1a1530', '#b44a3a', '#f0c89a'], timeLabel: '05:32', weatherLabel: '맑음', cameraLabel: 'Sony A7IV · 24mm', location: '광안리 해수욕장' },
  { photoGradient: ['#0f2027', '#203a43', '#e8a87c'], timeLabel: '17:48', weatherLabel: '맑음', cameraLabel: 'Canon R6II · 35mm', location: '경복궁' },
  { photoGradient: ['#232526', '#8e7b5a', '#8e7b5a'], timeLabel: '17:42', weatherLabel: '맑음', cameraLabel: 'Sony A7IV · 24mm', location: '서울 종로 세운상가' },
  { photoGradient: ['#8b4a6b', '#d4856a', '#f0c89a'], timeLabel: '18:05', weatherLabel: '맑음', cameraLabel: 'Fujifilm X-T5 · 23mm', location: '해운대 블루라인파크' },
];

export default function SubmitEntrySheet({ visible, onClose, onSubmit }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [caption, setCaption] = useState('');

  const reset = () => {
    setSelectedIndex(null);
    setCaption('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const selected = selectedIndex != null ? PHOTO_PRESETS[selectedIndex] : null;

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit({ photoGradient: selected.photoGradient, caption: caption.trim(), location: selected.location });
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
        {selected ? (
          <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(6), paddingBottom: normalize(14) }}>
            <View style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: normalize(16), overflow: 'hidden', backgroundColor: selected.photoGradient[0] }}>
              <Pressable
                onPress={() => setSelectedIndex(null)}
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
            <View className="flex-row flex-wrap justify-between">
              {PHOTO_PRESETS.map((preset, index) => (
                <Pressable
                  key={index}
                  onPress={() => setSelectedIndex(index)}
                  accessibilityRole="button"
                  accessibilityLabel="사진 선택"
                  style={{ width: '48%', aspectRatio: 4 / 3, borderRadius: normalize(14), backgroundColor: preset.photoGradient[0], marginBottom: normalize(10) }}
                />
              ))}
            </View>
            <Text
              allowFontScaling={false}
              style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, lineHeight: FONT_XS * 1.6, letterSpacing: -0.15, color: 'rgba(0,0,0,0.35)', textAlign: 'center', marginTop: normalize(4) }}
            >
              사진을 선택하면 촬영정보 · 위치가 자동으로 채워져요
            </Text>
          </View>
        )}

        {selected && (
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
                <InfoRow icon={<Clock size={normalize(14)} color="rgba(0,0,0,0.4)" strokeWidth={1.8} />} label="시간" value={selected.timeLabel} />
                <Divider />
                <InfoRow icon={<Sun size={normalize(14)} color="rgba(0,0,0,0.4)" strokeWidth={1.8} />} label="날씨" value={selected.weatherLabel} />
                <Divider />
                <InfoRow icon={<Camera size={normalize(14)} color="rgba(0,0,0,0.4)" strokeWidth={1.8} />} label="카메라" value={selected.cameraLabel} />
                <Divider />
                <InfoRow icon={<MapPin size={normalize(14)} color={ACCENT} strokeWidth={1.8} />} label="위치" value={selected.location} />
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

      <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(4) }}>
        <Pressable
          onPress={handleSubmit}
          disabled={!selected}
          accessibilityRole="button"
          accessibilityLabel="출품하기"
          className="items-center justify-center"
          style={{ width: '100%', height: normalize(52), borderRadius: BUTTON_RADIUS, backgroundColor: selected ? ACCENT : SURFACE }}
        >
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.2, color: selected ? '#fff' : 'rgba(0,0,0,0.3)' }}>
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
