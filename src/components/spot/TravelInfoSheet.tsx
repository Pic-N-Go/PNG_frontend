import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { IconRefresh, IconX } from '@tabler/icons-react-native';
import { Accessibility, Dog } from 'lucide-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { BRAND, BRAND_TINT, HAIRLINE, TEXT_SUB } from '@/constants/colors';
import {
  CARD_RADIUS,
  COMPACT_CONTROL_HEIGHT,
  COMPACT_CONTROL_RADIUS,
  FONT_MD,
  FONT_SM,
  FONT_TITLE,
  GRID_PADDING,
  HAIRLINE_WIDTH,
} from '@/constants/layout';
import type { SpotAccessibilityInfoResponse, SpotPetInfoResponse } from '@/types/spot';
import { normalize } from '@/utils/normalize';

type InfoRow = { label: string; value: string | null };
type InfoGroup = { title: string; rows: InfoRow[] };

interface SheetStateProps {
  visible: boolean;
  onClose: () => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

interface InfoSheetProps extends SheetStateProps {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  groups: InfoGroup[];
  hasData: boolean;
}

function clean(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function InfoSheet({
  visible,
  onClose,
  isLoading,
  isError,
  onRetry,
  title,
  subtitle,
  icon: Icon,
  groups,
  hasData,
}: InfoSheetProps) {
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      rows: group.rows
        .map((row) => ({ ...row, value: clean(row.value) }))
        .filter((row): row is { label: string; value: string } => row.value !== null),
    }))
    .filter((group) => group.rows.length > 0);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="pb-2.5" style={{ paddingHorizontal: GRID_PADDING }}>
        <View className="flex-row items-center gap-3">
          <View style={{ width: normalize(42), height: normalize(42), borderRadius: normalize(12), backgroundColor: BRAND_TINT, alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={normalize(22)} color={BRAND} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_TITLE, color: '#000', letterSpacing: -0.4 }}>
              {title}
            </Text>
            <Text allowFontScaling={false} className="mt-1" style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: TEXT_SUB }}>
              {subtitle}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="닫기"
            className="items-center justify-center bg-card"
            style={{ width: normalize(36), height: normalize(36), borderRadius: normalize(18) }}
          >
            <IconX size={normalize(18)} color={TEXT_SUB} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View className="items-center justify-center gap-3" style={{ minHeight: normalize(220) }}>
          <ActivityIndicator color={BRAND} />
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: TEXT_SUB }}>
            상세 정보를 불러오고 있어요
          </Text>
        </View>
      ) : isError ? (
        <View className="items-center justify-center gap-3.5" style={{ minHeight: normalize(220), paddingHorizontal: GRID_PADDING }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, lineHeight: FONT_MD * 1.5, color: TEXT_SUB, textAlign: 'center' }}>
            상세 정보를 불러오지 못했어요.\n잠시 후 다시 시도해 주세요.
          </Text>
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="상세 정보 다시 불러오기"
            className="flex-row items-center gap-1.5 px-5 bg-card"
            style={{ height: COMPACT_CONTROL_HEIGHT, borderRadius: COMPACT_CONTROL_RADIUS }}
          >
            <IconRefresh size={normalize(16)} color={BRAND} strokeWidth={2} />
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: BRAND }}>
              다시 시도
            </Text>
          </Pressable>
        </View>
      ) : !hasData || visibleGroups.length === 0 ? (
        <View className="items-center justify-center" style={{ minHeight: normalize(220), paddingHorizontal: GRID_PADDING }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, lineHeight: FONT_MD * 1.5, color: TEXT_SUB, textAlign: 'center' }}>
            아직 등록된 상세 정보가 없어요.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(8), paddingBottom: normalize(12) }}
        >
          {visibleGroups.map((group) => (
            <View key={group.title} className="mb-5">
              <Text allowFontScaling={false} className="mb-2" style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: TEXT_SUB }}>
                {group.title}
              </Text>
              <View className="overflow-hidden bg-card" style={{ borderRadius: CARD_RADIUS }}>
                {group.rows.map((row, index) => (
                  <View
                    key={row.label}
                    className="px-4 py-3.5"
                    style={{ borderBottomWidth: index === group.rows.length - 1 ? 0 : HAIRLINE_WIDTH, borderBottomColor: HAIRLINE }}
                  >
                    <Text allowFontScaling={false} className="mb-1" style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: TEXT_SUB }}>
                      {row.label}
                    </Text>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, lineHeight: FONT_MD * 1.55, color: '#000' }}>
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </BottomSheet>
  );
}

interface PetInfoSheetProps extends SheetStateProps {
  data: SpotPetInfoResponse | null | undefined;
}

export function PetInfoSheet({ data, ...state }: PetInfoSheetProps) {
  const groups: InfoGroup[] = data
    ? [
        { title: '동반 가능 범위', rows: [{ label: '동반 유형', value: data.accompanyType }, { label: '동반 가능 대상', value: data.allowedCompanion }] },
        { title: '이용 조건', rows: [{ label: '필수 준비물', value: data.requiredItems }, { label: '관련 시설', value: data.facilities }] },
        { title: '이용 가능 물품', rows: [{ label: '제공 물품', value: data.providedItems }, { label: '구매 가능 물품', value: data.purchasableItems }, { label: '대여 가능 물품', value: data.rentalItems }] },
        { title: '추가 안내', rows: [{ label: '안내 사항', value: data.additionalInfo }, { label: '사고 위험 안내', value: data.accidentRiskInfo }] },
      ]
    : [];

  return (
    <InfoSheet
      {...state}
      title="반려동물 동반 정보"
      subtitle="방문 전 동반 조건을 확인해 주세요"
      icon={Dog}
      groups={groups}
      hasData={data != null}
    />
  );
}

interface AccessibilityInfoSheetProps extends SheetStateProps {
  data: SpotAccessibilityInfoResponse | null | undefined;
}

export function AccessibilityInfoSheet({ data, ...state }: AccessibilityInfoSheetProps) {
  const groups: InfoGroup[] = data
    ? [
        { title: '이동 및 출입', rows: [{ label: '주차', value: data.parking }, { label: '대중교통', value: data.publicTransport }, { label: '접근로', value: data.route }, { label: '매표소', value: data.ticketOffice }, { label: '출입구', value: data.entranceExit }, { label: '엘리베이터', value: data.elevator }] },
        { title: '지체장애 편의', rows: [{ label: '휠체어', value: data.wheelchair }, { label: '화장실', value: data.restroom }, { label: '관람석', value: data.auditorium }, { label: '객실', value: data.room }, { label: '기타 안내', value: data.physicalDisabilityEtc }] },
        { title: '시각장애 편의', rows: [{ label: '점자블록', value: data.brailleBlock }, { label: '보조견 동반', value: data.helpDog }, { label: '안내요원', value: data.humanGuide }, { label: '음성 안내', value: data.audioGuide }, { label: '큰활자 안내', value: data.largePrint }, { label: '점자 홍보물', value: data.braillePromotion }, { label: '안내 시스템', value: data.guideSystem }, { label: '기타 안내', value: data.visualDisabilityEtc }] },
        { title: '청각장애 편의', rows: [{ label: '수어 안내', value: data.signGuide }, { label: '영상 안내', value: data.videoGuide }, { label: '객실', value: data.hearingRoom }, { label: '기타 안내', value: data.hearingDisabilityEtc }] },
        { title: '영유아 가족 편의', rows: [{ label: '유모차', value: data.stroller }, { label: '수유실', value: data.lactationRoom }, { label: '유아용 의자', value: data.babyChair }, { label: '기타 안내', value: data.infantFamilyEtc }] },
        { title: '기타', rows: [{ label: '홍보 및 안내', value: data.promotion }] },
      ]
    : [];

  return (
    <InfoSheet
      {...state}
      title="접근성 정보"
      subtitle="시설별 접근성과 편의 정보를 확인해 주세요"
      icon={Accessibility}
      groups={groups}
      hasData={data != null}
    />
  );
}
