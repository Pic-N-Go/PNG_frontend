import type { TourSyncStatusResponse } from '@/types/admin';

/**
 * 구버전 응답과 단계별 파이프라인 응답을 구분한다.
 * 단계 값은 최종 실패 직후 모두 null일 수 있으므로 truthy 여부가 아니라 필드 존재 여부를 확인한다.
 */
export function hasTourSyncPipelineFields(status?: TourSyncStatusResponse): boolean {
  if (!status) return false;

  return (
    'overallStatus' in status ||
    'spot' in status ||
    'pet' in status ||
    'accessibility' in status
  );
}
