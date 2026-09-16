export type ReportReasonId =
  | 'spam'
  | 'abuse'
  | 'copyright'
  | 'inappropriate'
  | 'etc';

export type ReportReason =
  | 'SPAM'
  | 'ABUSE'
  | 'COPYRIGHT'
  | 'INAPPROPRIATE'
  | 'ETC';

export const REPORT_REASON_MAP: Record<ReportReasonId, ReportReason> = {
  spam: 'SPAM',
  abuse: 'ABUSE',
  copyright: 'COPYRIGHT',
  inappropriate: 'INAPPROPRIATE',
  etc: 'ETC',
};

export interface ReportCreateRequest {
  reason: ReportReason;
  detail?: string;
}

export interface ReportCreateResponse {
  reportId: number;
  status: 'PENDING';
  createdAt: string;
}
