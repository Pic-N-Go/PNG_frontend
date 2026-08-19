// 코스(여행 계획) 서버 상태 훅 (TanStack Query)
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '@/api/courses';

/** 코스에 스팟 1개를 추가한다. */
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

      return coursesApi.syncSpots(courseId, {
        version: courseDetail.version,
        spots: allSpotsPayload,
      });
    },
    onSuccess: (_data, { courseId }) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ['courses'] }),
        qc.invalidateQueries({ queryKey: ['course', courseId] }),
      ]),
  });
}
