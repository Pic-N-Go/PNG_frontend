import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import {
  IconAccessible,
  IconAlertTriangle,
  IconCheck,
  IconDatabase,
  IconPaw,
  IconRefresh,
} from '@tabler/icons-react-native';
import { BORDER_CONTROL, CARD_RADIUS, FONT_2XS, FONT_MD, FONT_SM, FONT_XS } from '@/constants/layout';
import type { TourSyncStageResponse, TourSyncStageStatus, TourSyncStatusResponse } from '@/types/admin';
import { normalize } from '@/utils/normalize';
import { hasTourSyncPipelineFields } from '@/utils/tourSyncStatus';

interface Props {
  status?: TourSyncStatusResponse;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

type StageDefinition = {
  key: 'spot' | 'pet' | 'accessibility';
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
};

const STAGES: StageDefinition[] = [
  { key: 'spot', label: '일반 Spot', icon: IconDatabase },
  { key: 'pet', label: '반려동물 정보', icon: IconPaw },
  { key: 'accessibility', label: '무장애 여행정보', icon: IconAccessible },
];

const STATUS_LABEL: Record<TourSyncStageStatus, string> = {
  PENDING: '대기',
  IN_PROGRESS: '진행 중',
  RETRYING: '재시도 중',
  COMPLETED: '완료',
  FAILED: '실패',
};

const STATUS_COLOR: Record<TourSyncStageStatus, string> = {
  PENDING: '#6b7280',
  IN_PROGRESS: '#2563eb',
  RETRYING: '#d97706',
  COMPLETED: '#059669',
  FAILED: '#dc2626',
};

const STATUS_BG: Record<TourSyncStageStatus, string> = {
  PENDING: '#f3f4f6',
  IN_PROGRESS: '#dbeafe',
  RETRYING: '#fef3c7',
  COMPLETED: '#d1fae5',
  FAILED: '#fee2e2',
};

function clampPercent(value?: number): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function StageRow({ definition, stage }: { definition: StageDefinition; stage?: TourSyncStageResponse | null }) {
  const stageStatus = stage?.status ?? 'PENDING';
  const color = STATUS_COLOR[stageStatus];
  const Icon = definition.icon;
  const progress = clampPercent(stage?.progressPercent);
  const hasCount = (stage?.totalCount ?? 0) > 0;

  return (
    <View className="bg-white rounded-2xl p-3.5 gap-2.5">
      <View className="flex-row items-center gap-2.5">
        <View className="items-center justify-center rounded-xl" style={{ width: normalize(38), height: normalize(38), backgroundColor: STATUS_BG[stageStatus] }}>
          {stageStatus === 'IN_PROGRESS' || stageStatus === 'RETRYING' ? (
            <ActivityIndicator size="small" color={color} />
          ) : stageStatus === 'COMPLETED' ? (
            <IconCheck size={normalize(20)} color={color} strokeWidth={2.5} />
          ) : stageStatus === 'FAILED' ? (
            <IconAlertTriangle size={normalize(20)} color={color} strokeWidth={2} />
          ) : (
            <Icon size={normalize(20)} color={color} strokeWidth={2} />
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-SemiBold', color: '#111827' }}>
              {definition.label}
            </Text>
            <View className="rounded-md px-2 py-0.5" style={{ backgroundColor: STATUS_BG[stageStatus] }}>
              <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-SemiBold', color }}>
                {STATUS_LABEL[stageStatus]}
              </Text>
            </View>
          </View>
          <Text className="mt-1" style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-Regular', color: '#6b7280' }}>
            {stage?.message ?? `${definition.label} 동기화 대기 중`}
          </Text>
        </View>
      </View>

      {(stageStatus === 'IN_PROGRESS' || stageStatus === 'RETRYING' || hasCount) && (
        <View>
          <View className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <View className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color }} />
          </View>
          <View className="mt-1.5 flex-row items-center justify-between">
            <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Medium', color: '#6b7280' }}>
              {progress.toFixed(1)}%
            </Text>
            {hasCount && (
              <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Medium', color }}>
                {stage?.processedCount ?? 0} / {stage?.totalCount ?? 0}
              </Text>
            )}
          </View>
        </View>
      )}

      {stage?.lastError ? (
        <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-Regular', color: STATUS_COLOR.FAILED }}>
          {stage.lastError}
        </Text>
      ) : null}
    </View>
  );
}

function overallState(status?: TourSyncStatusResponse): TourSyncStageStatus {
  if (!status) return 'PENDING';
  if (status?.overallStatus) return status.overallStatus;
  return status?.isRunning ? 'IN_PROGRESS' : 'COMPLETED';
}

export default function TourSyncPipelineStatusCard({ status, isLoading, isError, onRetry }: Props) {
  const overall = overallState(status);
  const overallColor = STATUS_COLOR[overall];
  const hasPipelineStages = hasTourSyncPipelineFields(status);

  return (
    <View
      className="p-4"
      style={{
        borderWidth: BORDER_CONTROL,
        borderColor: status?.isRunning ? '#60a5fa' : 'rgba(0,0,0,0.08)',
        borderRadius: CARD_RADIUS,
        backgroundColor: status?.isRunning ? '#eff6ff' : '#f9fafb',
      }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-2">
          <IconRefresh size={normalize(18)} color={overallColor} strokeWidth={2} />
          <Text style={{ fontSize: FONT_MD, fontFamily: 'Pretendard-SemiBold', color: '#111827' }}>
            실시간 동기화 파이프라인 상태
          </Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-md px-2 py-1" style={{ backgroundColor: STATUS_BG[overall] }}>
          {status?.isRunning && <ActivityIndicator size="small" color={overallColor} style={{ transform: [{ scale: 0.7 }] }} />}
          <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-SemiBold', color: overallColor }}>
            {isLoading ? '조회 중' : STATUS_LABEL[overall]}
          </Text>
        </View>
      </View>

      {isError ? (
        <View className="items-start gap-2 pt-4">
          <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Regular', color: '#dc2626' }}>
            동기화 상태를 불러오지 못했습니다.
          </Text>
          <Pressable onPress={onRetry} accessibilityRole="button" className="rounded-lg bg-white px-3 py-2">
            <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-SemiBold', color: '#2563eb' }}>다시 조회</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View className="pt-3 pb-2">
            <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-SemiBold', color: '#1f2937' }}>
              {status?.currentJob || '실행 중인 동기화 작업 없음'}
            </Text>
            <Text className="mt-1" style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-Regular', color: '#6b7280' }}>
              {status?.statusMessage || '새 동기화를 시작하면 단계별 진행 상태가 표시됩니다.'}
            </Text>
          </View>

          {hasPipelineStages ? (
            <View className="gap-2">
              {STAGES.map((definition) => (
                <StageRow key={definition.key} definition={definition} stage={status?.[definition.key]} />
              ))}
            </View>
          ) : null}

          {!status?.isRunning && status?.lastCompletedAt ? (
            <Text className="mt-3" style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-Regular', color: '#059669' }}>
              최근 완료: {new Date(status.lastCompletedAt).toLocaleString('ko-KR')}
            </Text>
          ) : null}
          {status?.jobId ? (
            <Text className="mt-1" numberOfLines={1} style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: '#9ca3af' }}>
              작업 ID: {status.jobId}
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
}
