// 코스(여행 계획) 서버 상태 훅 (TanStack Query)
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '@/api/courses';

/**
 * 코스에 스팟 1개를 추가한다.
 *
 * 서버에 단건 추가 API가 없어 "상세 조회 → 목록에 append → 전체 sync(PUT)" 순으로 동작한다.
 * 조회와 저장 사이에 다른 클라이언트가 같은 코스를 수정하면 그 변경이 덮어써진다(lost update).
 * 근본 해결은 서버의 단건 추가 엔드포인트 또는 코스 revision 토큰 검증이 필요하다.
 */
export function useAddSpotToCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, spotId, dayNumber }: { courseId: number; spotId: number; dayNumber: number }) => {
      // 1. 최신 코스 상세 정보 조회
      const courseDetail = await coursesApi.getCourse(courseId);
      const existingSpots = courseDetail.spots || [];
      const sameDaySpots = existingSpots.filter((s) => s.dayNumber === dayNumber);
      const nextSeq = sameDaySpots.length > 0
        ? Math.max(...sameDaySpots.map((s) => s.sequenceOrder)) + 1
        : 1;

      // 2. 스팟 추가 후 일괄 동기화
      const allSpotsPayload = [
        ...existingSpots.map((s) => ({
          courseSpotId: s.id,
          spotId: s.spotId,
          dayNumber: s.dayNumber,
          sequenceOrder: s.sequenceOrder,
          memo: s.memo || '',
        })),
        {
          spotId,
          dayNumber,
          sequenceOrder: nextSeq,
          memo: '',
        },
      ];

      return coursesApi.syncSpots(courseId, { spots: allSpotsPayload });
    },
    onSuccess: (_data, { courseId }) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ['courses'] }),
        qc.invalidateQueries({ queryKey: ['course', courseId] }),
      ]),
  });
}
