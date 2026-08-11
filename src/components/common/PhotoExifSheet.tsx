import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Aperture, Camera, MapPin, X } from 'lucide-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { PhotoExifData } from '@/types/photo';
import { FONT_2XS, FONT_LG, FONT_SM, FONT_XS, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

const SURFACE = '#f5f5f7';
const ACCENT = '#E31B59';

interface Props {
  visible: boolean;
  onClose: () => void;
  exif: PhotoExifData;
}

function GearRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View
      className="flex-row items-center"
      style={{ gap: normalize(12), backgroundColor: SURFACE, borderRadius: normalize(14), paddingVertical: normalize(12), paddingHorizontal: normalize(14) }}
    >
      <View
        className="items-center justify-center"
        style={{ width: normalize(36), height: normalize(36), borderRadius: normalize(10), backgroundColor: 'rgba(227,27,89,0.08)' }}
      >
        {icon}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.4)', letterSpacing: 0.4 }}>
          {label}
        </Text>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.2, marginTop: normalize(2) }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function StatCell({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: SURFACE, borderRadius: normalize(14), paddingVertical: normalize(12), paddingHorizontal: normalize(8), alignItems: 'center' }}>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.4)', letterSpacing: 0.4 }}>
        {label}
      </Text>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.3, marginTop: normalize(2) }}>
        {value}
        {unit && (
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.1 }}>
            {unit}
          </Text>
        )}
      </Text>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text
      allowFontScaling={false}
      style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', letterSpacing: 0.4, paddingTop: normalize(20), paddingBottom: normalize(8) }}
    >
      {label}
    </Text>
  );
}

function DetailRow({ label, value, isLast, valueAlignRight }: { label: string; value: string; isLast?: boolean; valueAlignRight?: boolean }) {
  return (
    <View
      className="flex-row items-center justify-between"
      style={{ height: normalize(44), borderBottomWidth: isLast ? 0 : 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' }}
    >
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.45)', letterSpacing: -0.1 }}>
        {label}
      </Text>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: '#000', letterSpacing: -0.2, maxWidth: valueAlignRight ? '60%' : undefined, textAlign: valueAlignRight ? 'right' : 'left' }}
      >
        {value}
      </Text>
    </View>
  );
}

/** 값이 있는 행만 남기고, 마지막 남은 행에만 isLast를 다시 매겨준다 (구분선이 중간에서 끊기지 않게). */
function withIsLast<T extends { value?: string }>(rows: (T & { isLast?: boolean })[]): (T & { isLast?: boolean })[] {
  const present = rows.filter((row) => !!row.value);
  return present.map((row, index) => ({ ...row, isLast: index === present.length - 1 }));
}

/**
 * 라이트박스(별도 Modal) 위에 겹쳐 열리는 레이어로 쓰일 수 있어 컨텐츠만 따로 export한다 —
 * RN에서 Modal 두 개를 동시에 띄우면 두 번째가 안 뜨는 경우가 있어(iOS 네이티브 모달 프레젠테이션
 * 제약), 그런 화면에서는 부모 Modal 안에 이 컨텐츠만 직접 넣는다(`PhotoLightbox` 참고).
 */
export function PhotoExifSheetContent({ onClose, exif }: Omit<Props, 'visible'>) {
  const statCells = [
    { label: 'ISO', value: exif.iso != null ? String(exif.iso) : undefined },
    { label: '조리개', value: exif.aperture },
    { label: '셔터', value: exif.shutter, unit: undefined as string | undefined },
    { label: '초점', value: exif.focalLength, unit: 'mm' },
  ].filter((cell): cell is { label: string; value: string; unit?: string } => !!cell.value);

  const detailRows = withIsLast([
    { label: '노출 모드', value: exif.exposureMode },
    { label: '측광 모드', value: exif.metering },
    { label: '화이트밸런스', value: exif.whiteBalance },
    { label: '플래시', value: exif.flash },
    { label: '35mm 환산', value: exif.focalLength35mm },
    { label: '소프트웨어', value: exif.software, valueAlignRight: true },
  ]);

  const fileRows = withIsLast([
    { label: '파일명', value: exif.filename },
    { label: '크기', value: exif.fileSize },
    { label: '형식', value: exif.format },
    { label: '수정일', value: exif.modifiedAtLabel },
  ]);

  const hasLocation = exif.gpsLat != null && exif.gpsLng != null;
  const hasGear = !!exif.camera || !!exif.lens;

  return (
    <View style={{ paddingHorizontal: GRID_PADDING + normalize(8), paddingBottom: normalize(4) }}>
      <View className="flex-row items-center justify-between">
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.4 }}>
          사진 정보
        </Text>
        <Pressable
          onPress={onClose}
          className="items-center justify-center"
          style={{ width: normalize(30), height: normalize(30), borderRadius: normalize(15), backgroundColor: SURFACE }}
          accessibilityLabel="닫기"
        >
          <X size={normalize(13)} color="rgba(0,0,0,0.5)" strokeWidth={2} />
        </Pressable>
      </View>

      {hasGear && (
        <View style={{ gap: normalize(8), marginTop: normalize(16) }}>
          <GearRow icon={<Camera size={normalize(18)} color={ACCENT} strokeWidth={1.8} />} label="카메라" value={exif.camera} />
          <GearRow icon={<Aperture size={normalize(18)} color={ACCENT} strokeWidth={1.8} />} label="렌즈" value={exif.lens} />
        </View>
      )}

      {statCells.length > 0 && (
        <View className="flex-row" style={{ gap: normalize(6), marginTop: normalize(8) }}>
          {statCells.map((cell) => (
            <StatCell key={cell.label} label={cell.label} value={cell.value} unit={cell.unit} />
          ))}
        </View>
      )}

      {detailRows.length > 0 && (
        <>
          <SectionLabel label="촬영 상세" />
          <View style={{ backgroundColor: SURFACE, borderRadius: normalize(14), paddingHorizontal: normalize(16) }}>
            {detailRows.map((row) => (
              <DetailRow key={row.label} label={row.label} value={row.value as string} isLast={row.isLast} valueAlignRight={row.valueAlignRight} />
            ))}
          </View>
        </>
      )}

      {hasLocation && (
        <>
          <SectionLabel label="위치" />
          <View style={{ backgroundColor: SURFACE, borderRadius: normalize(14), paddingHorizontal: normalize(16) }}>
            <DetailRow label="위도" value={String(exif.gpsLat)} />
            <DetailRow label="경도" value={String(exif.gpsLng)} isLast />
          </View>
          <View
            className="items-center justify-center"
            style={{ height: normalize(120), borderRadius: normalize(12), backgroundColor: SURFACE, marginTop: normalize(12) }}
          >
            <MapPin size={normalize(28)} color="rgba(0,0,0,0.25)" strokeWidth={1.6} />
          </View>
        </>
      )}

      {fileRows.length > 0 && (
        <>
          <SectionLabel label="파일" />
          <View style={{ backgroundColor: SURFACE, borderRadius: normalize(14), paddingHorizontal: normalize(16), marginBottom: normalize(8) }}>
            {fileRows.map((row) => (
              <DetailRow key={row.label} label={row.label} value={row.value as string} isLast={row.isLast} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

export default function PhotoExifSheet({ visible, onClose, exif }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <PhotoExifSheetContent onClose={onClose} exif={exif} />
    </BottomSheet>
  );
}
