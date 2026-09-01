import React from 'react';
import { Pressable, ScrollView, Switch, Text, View, type ViewStyle } from 'react-native';
import { Camera, Info, MapPin, X } from 'lucide-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import {
  CARD_RADIUS,
  FONT_2XS,
  FONT_LG,
  FONT_MD,
  FONT_SM,
  FONT_XS,
  HAIRLINE_WIDTH,
} from '@/constants/layout';
import { BRAND, BRAND_TINT, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';
import { normalize } from '@/utils/normalize';

const TECHNICAL_FIELDS = [
  '카메라 모델',
  '렌즈 모델',
  'ISO',
  '조리개(F값)',
  '노출 시간',
  '초점 거리',
  '35mm 환산 초점 거리',
  '노출 모드',
  '측광 모드',
  '화이트밸런스',
  '플래시',
  '소프트웨어',
] as const;

interface Props {
  technicalEnabled: boolean;
  locationEnabled: boolean;
  onTechnicalChange: (enabled: boolean) => void;
  onLocationChange: (enabled: boolean) => void;
  style?: ViewStyle;
}

interface ConsentRowProps {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (enabled: boolean) => void;
}

function ConsentRow({ label, description, value, onValueChange }: ConsentRowProps) {
  return (
    <View
      className="flex-row items-center"
      style={{ minHeight: normalize(68), paddingHorizontal: normalize(16), paddingVertical: normalize(12), gap: normalize(12) }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          allowFontScaling={false}
          style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2 }}
        >
          {label}
        </Text>
        <Text
          allowFontScaling={false}
          style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.38)', letterSpacing: -0.1, marginTop: normalize(2) }}
        >
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E9E9EA', true: BRAND }}
        thumbColor="#fff"
        ios_backgroundColor="#E9E9EA"
        accessibilityLabel={`${label} ${value ? '동의함' : '동의하지 않음'}`}
      />
    </View>
  );
}

function InfoBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ backgroundColor: CARD, borderRadius: CARD_RADIUS, padding: normalize(16) }}>
      <View className="flex-row items-center" style={{ gap: normalize(8), marginBottom: normalize(10) }}>
        <View
          className="items-center justify-center"
          style={{ width: normalize(30), height: normalize(30), borderRadius: normalize(9), backgroundColor: BRAND_TINT }}
        >
          {icon}
        </View>
        <Text
          allowFontScaling={false}
          style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2 }}
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

export default function ExifConsentSection({
  technicalEnabled,
  locationEnabled,
  onTechnicalChange,
  onLocationChange,
  style,
}: Props) {
  const [infoVisible, setInfoVisible] = React.useState(false);

  return (
    <>
      <View style={style}>
        <View className="flex-row items-center justify-between" style={{ marginBottom: normalize(10) }}>
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: TEXT_SUB, letterSpacing: 0.4 }}
          >
            사진 정보 활용
          </Text>
          <Pressable
            onPress={() => setInfoVisible(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="사진 EXIF 정보 안내"
            className="items-center justify-center"
            style={{ width: normalize(26), height: normalize(26), borderRadius: normalize(13), backgroundColor: CARD }}
          >
            <Info size={normalize(15)} color="rgba(0,0,0,0.42)" strokeWidth={2} />
          </Pressable>
        </View>

        <View style={{ backgroundColor: CARD, borderRadius: CARD_RADIUS, overflow: 'hidden' }}>
          <ConsentRow
            label="촬영 정보 가져오기"
            description="카메라·렌즈·ISO 등의 정보를 가져와요"
            value={technicalEnabled}
            onValueChange={onTechnicalChange}
          />
          <View style={{ height: HAIRLINE_WIDTH, backgroundColor: HAIRLINE, marginLeft: normalize(16) }} />
          <ConsentRow
            label="촬영 위치 가져오기"
            description="사진의 위도·경도 정보를 가져와요"
            value={locationEnabled}
            onValueChange={onLocationChange}
          />
        </View>

        <Text
          allowFontScaling={false}
          style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: TEXT_SUB, letterSpacing: -0.1, marginTop: normalize(8) }}
        >
          동의한 정보만 사진에서 추출하여 저장합니다.
        </Text>
      </View>

      <BottomSheet visible={infoVisible} onClose={() => setInfoVisible(false)}>
        <ScrollView
          style={{ maxHeight: normalize(560) }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: normalize(24), paddingBottom: normalize(8) }}
        >
          <View className="flex-row items-center justify-between" style={{ marginBottom: normalize(8) }}>
            <Text
              allowFontScaling={false}
              style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.4 }}
            >
              사진 EXIF 정보 안내
            </Text>
            <Pressable
              onPress={() => setInfoVisible(false)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="안내 닫기"
              className="items-center justify-center"
              style={{ width: normalize(30), height: normalize(30), borderRadius: normalize(15), backgroundColor: CARD }}
            >
              <X size={normalize(14)} color="rgba(0,0,0,0.5)" strokeWidth={2} />
            </Pressable>
          </View>

          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.55)', lineHeight: FONT_SM * 1.55, letterSpacing: -0.15, marginBottom: normalize(16) }}
          >
            EXIF는 사진 촬영 시 기기가 파일에 기록하는 정보입니다. 동의한 항목만 사진별로 확인하며, 원본에 값이 있는 경우에만 추출됩니다.
          </Text>

          <View style={{ gap: normalize(10) }}>
            <InfoBlock
              icon={<MapPin size={normalize(16)} color={BRAND} strokeWidth={1.8} />}
              title="촬영 위치"
            >
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.55)', lineHeight: FONT_SM * 1.55, letterSpacing: -0.1 }}
              >
                사진에 GPS 위도·경도가 기록되어 있을 때만 좌표와 해당 좌표를 기반으로 변환한 주소를 추출합니다. 위치 정보가 없거나 유효하지 않으면 추출되지 않습니다.
              </Text>
            </InfoBlock>

            <InfoBlock
              icon={<Camera size={normalize(16)} color={BRAND} strokeWidth={1.8} />}
              title="촬영 정보"
            >
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.55)', lineHeight: FONT_SM * 1.55, letterSpacing: -0.1 }}
              >
                서비스에서 제공하는 EXIF 필드는 다음과 같습니다.
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: normalize(6), marginTop: normalize(10) }}>
                {TECHNICAL_FIELDS.map((field) => (
                  <View
                    key={field}
                    style={{ paddingHorizontal: normalize(10), paddingVertical: normalize(6), borderRadius: normalize(14), backgroundColor: '#fff' }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.58)', letterSpacing: -0.1 }}
                    >
                      {field}
                    </Text>
                  </View>
                ))}
              </View>
            </InfoBlock>
          </View>

          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: TEXT_SUB, lineHeight: FONT_XS * 1.55, letterSpacing: -0.1, marginTop: normalize(12) }}
          >
            메신저·편집 앱을 거친 사진은 EXIF가 제거될 수 있으며, 이 경우 동의했더라도 해당 값은 저장되지 않습니다. 동의하지 않은 항목은 추출하지 않습니다. 저장된 정보는 사진 정보 화면에서 다른 사용자에게 공개될 수 있습니다.
          </Text>
        </ScrollView>
      </BottomSheet>
    </>
  );
}
