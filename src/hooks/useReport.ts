import { useMutation } from '@tanstack/react-query';
import { reportApi } from '@/api/report';
import { useAuthStore } from '@/store/useAuthStore';
import { REPORT_REASON_MAP, type ReportReasonId } from '@/types/report';

interface ReportPostVariables {
  postId: string;
  reasonId: ReportReasonId;
  detail: string;
}

interface ReportReviewVariables {
  reviewId: string;
  reasonId: ReportReasonId;
  detail: string;
}

export function useReportPost() {
  const token = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: ({ postId, reasonId, detail }: ReportPostVariables) => {
      if (!token) throw new Error('로그인이 필요해요.');

      return reportApi.reportPost(
        postId,
        {
          reason: REPORT_REASON_MAP[reasonId],
          detail: detail || undefined,
        },
        token,
      );
    },
  });
}

export function useReportReview() {
  const token = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: ({ reviewId, reasonId, detail }: ReportReviewVariables) => {
      if (!token) throw new Error('로그인이 필요해요.');

      return reportApi.reportReview(
        reviewId,
        {
          reason: REPORT_REASON_MAP[reasonId],
          detail: detail || undefined,
        },
        token,
      );
    },
  });
}
