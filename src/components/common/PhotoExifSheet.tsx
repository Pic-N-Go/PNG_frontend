import React, { useState } from 'react';
import { Animated, Dimensions, PanResponder, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NaverMapView, NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import { Aperture, Camera, MapPin, X } from 'lucide-react-native';
import { PhotoExifData } from '@/types/photo';
import { hasAnyExif } from '@/utils/spotMappers';
import { isLocationInKorea } from '@/utils/location';
import { BOTTOM_SHEET_RADIUS, FONT_2XS, FONT_LG, FONT_SM, FONT_XS, GRID_PADDING, HAIRLINE_WIDTH, MAP_MINI_PIN_SIZE, MAP_PREVIEW_HEIGHT } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { BRAND, BRAND_TINT, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';
import { PIN_SPOT_IMAGE } from '@/constants/pins';

const SURFACE = CARD;
const ACCENT = BRAND;
const MAP_PIN_WIDTH = MAP_MINI_PIN_SIZE;

interface Props {
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
        style={{ width: normalize(36), height: normalize(36), borderRadius: normalize(10), backgroundColor: BRAND_TINT }}
      >
        {icon}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: TEXT_SUB, letterSpacing: 0.4 }}>
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
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: TEXT_SUB, letterSpacing: 0.4 }}>
        {label}
      </Text>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.3, marginTop: normalize(2) }}>
        {value}
        {unit && (
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: TEXT_SUB, letterSpacing: -0.1 }}>
            {unit}
          </Text>
        )}
      </Text>
    </View>
  );
}

const MAP_BOX_STYLE = {
  height: normalize(MAP_PREVIEW_HEIGHT),
  borderRadius: normalize(12),
  backgroundColor: SURFACE,
  marginTop: normalize(12),
} as const;

/** 지도를 못 그릴 때(좌표 유효하지 않음 등) 자리를 지키는 아이콘 박스. */
function MapPlaceholder() {
  return (
    <View className="items-center justify-center" style={MAP_BOX_STYLE}>
      <MapPin size={normalize(28)} color="rgba(0,0,0,0.25)" strokeWidth={1.6} />
    </View>
  );
}

/** 촬영 위치 미리보기. 좌표 값은 텍스트로 노출하지 않고 지도 렌더링에만 사용한다. */
function LocationPreview({ lat, lng }: { lat: number; lng: number }) {
  const [isMapReady, setMapReady] = useState(false);

  if (!lat || !lng || !isLocationInKorea(lat, lng)) {
    return <MapPlaceholder />;
  }

  return (
    <View pointerEvents="none" style={{ ...MAP_BOX_STYLE, overflow: 'hidden' }}>
      <NaverMapView
        style={{ flex: 1 }}
        initialCamera={{ latitude: lat, longitude: lng, zoom: 14 }}
        onInitialized={() => setMapReady(true)}
        isScrollGesturesEnabled={false}
        isZoomGesturesEnabled={false}
        isTiltGesturesEnabled={false}
        isRotateGesturesEnabled={false}
        isStopGesturesEnabled={false}
        isShowCompass={false}
        isShowScaleBar={false}
        isShowZoomControls={false}
        isShowLocationButton={false}
        logoMargin={{ bottom: 4, left: 4 }}
      >
        {isMapReady && (
          <NaverMapMarkerOverlay
            latitude={lat}
            longitude={lng}
            width={MAP_PIN_WIDTH}
            height={MAP_PIN_WIDTH}
            anchor={{ x: 0.5, y: 0.5 }}
            image={PIN_SPOT_IMAGE}
          />
        )}
      </NaverMapView>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text
      allowFontScaling={false}
      style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: TEXT_SUB, letterSpacing: 0.4, paddingTop: normalize(20), paddingBottom: normalize(8) }}
    >
      {label}
    </Text>
  );
}

function DetailRow({
  label,
  value,
  isLast,
  valueAlignRight,
  numberOfLines = 1,
}: {
  label: string;
  value: string;
  isLast?: boolean;
  valueAlignRight?: boolean;
  numberOfLines?: number;
}) {
  return (
    <View
      className="flex-row items-center justify-between"
      style={{ height: normalize(44), borderBottomWidth: isLast ? 0 : HAIRLINE_WIDTH, borderBottomColor: HAIRLINE }}
    >
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.45)', letterSpacing: -0.1 }}>
        {label}
      </Text>
      <Text
        allowFontScaling={false}
        numberOfLines={numberOfLines}
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
export function PhotoExifSheetContent({
  onClose,
  exif,
  showMap = true,
}: Props & {
  /** 시트가 실제로 열린 뒤에만 지도 SDK와 타일 요청을 시작한다. */
  showMap?: boolean;
}) {
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

  const locationRows = withIsLast([
    { label: '주소', value: exif.address, numberOfLines: 2 },
  ]);
  const hasCoordinates = exif.gpsLat != null && exif.gpsLng != null;
  const hasLocation = locationRows.length > 0 || hasCoordinates;
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
          {locationRows.length > 0 && (
            <View style={{ backgroundColor: SURFACE, borderRadius: normalize(14), paddingHorizontal: normalize(16) }}>
              {locationRows.map((row) => (
                <DetailRow
                  key={row.label}
                  label={row.label}
                  value={row.value as string}
                  isLast={row.isLast}
                  valueAlignRight={row.valueAlignRight}
                  numberOfLines={row.numberOfLines}
                />
              ))}
            </View>
          )}
          {hasCoordinates && (showMap ? <LocationPreview lat={exif.gpsLat!} lng={exif.gpsLng!} /> : <MapPlaceholder />)}
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

const SCREEN_HEIGHT = Dimensions.get('window').height;

/**
 * 라이트박스 Modal **안에** 겹쳐 올리는 EXIF 시트. 별도 Modal이 아닌 이유는
 * `PhotoExifSheetContent` 주석 참고(RN에서 Modal 2개 동시 표시 제약).
 *
 * 부모의 최상위 View 안에 그대로 두면 된다 — 딤과 시트를 absolute 형제로 깐다.
 * exif 자체가 비거나(EXIF 제거된 사진) 로딩·에러면 안내 문구로 대체한다.
 */
export function PhotoExifLayer({
  open,
  onClose,
  exif,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  exif: PhotoExifData | undefined;
  loading?: boolean;
  error?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const translateY = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // 시트가 항상 마운트되어 있어도 사용자가 실제로 열기 전에는 지도 네트워크 요청을 하지 않는다.
  const [everOpened, setEverOpened] = React.useState(false);
  React.useEffect(() => {
    if (open) setEverOpened(true);
  }, [open]);

  React.useEffect(() => {
    Animated.timing(translateY, {
      toValue: open ? 0 : SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [open, translateY]);

  // 핸들을 아래로 끌어 닫기. 공통 BottomSheet와 같은 임계값(100px 또는 vy 0.5)을 쓴다 —
  // 이 레이어는 Modal이 아니라 손으로 만든 시트라 그쪽 PanResponder를 물려받지 못한다.
  // 핸들에만 붙인다: 본문은 ScrollView라 여기까지 제스처를 넓히면 스크롤과 싸운다.
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const pan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_e, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_e, g) => {
        // 닫기 애니메이션은 open=false로 바뀌면서 위 effect가 이어받는다.
        if (g.dy > 100 || g.vy > 0.5) onCloseRef.current();
        else Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      },
    }),
  ).current;

  // Android 백 버튼 처리는 여기서 못 한다 — Modal이 떠 있는 동안 RN은 BackHandler 이벤트를
  // 발행하지 않고 Modal의 onRequestClose만 부른다. 그래서 "시트가 열려 있으면 시트만 닫기"는
  // 이 레이어를 감싼 각 라이트박스의 onRequestClose에서 분기한다.

  return (
    <>
      {open && (
        <Pressable
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 5 }}
        />
      )}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '80%',
          backgroundColor: '#fff',
          borderTopLeftRadius: BOTTOM_SHEET_RADIUS,
          borderTopRightRadius: BOTTOM_SHEET_RADIUS,
          paddingBottom: insets.bottom + normalize(8),
          transform: [{ translateY }],
          zIndex: 6,
        }}
      >
        <View {...pan.panHandlers} style={{ alignItems: 'center', paddingTop: normalize(10), paddingBottom: normalize(8) }}>
          <View style={{ width: normalize(36), height: normalize(4), borderRadius: normalize(2), backgroundColor: 'rgba(0,0,0,0.12)' }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* EXIF는 카톡·인스타를 거친 사진에서 제거되는 일이 흔해 '없음'이 정상 케이스다. */}
          {loading || error || !hasAnyExif(exif) ? (
            <View style={{ paddingHorizontal: normalize(28), paddingVertical: normalize(32), alignItems: 'center' }}>
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: TEXT_SUB, letterSpacing: -0.2 }}
              >
                {loading ? '사진 정보를 불러오는 중' : error ? '사진 정보를 불러올 수 없어요' : '이 사진에는 촬영 정보가 없어요'}
              </Text>
            </View>
          ) : (
            <PhotoExifSheetContent exif={exif!} onClose={onClose} showMap={everOpened} />
          )}
        </ScrollView>
      </Animated.View>
    </>
  );
}
