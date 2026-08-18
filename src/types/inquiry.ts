export type InquiryStatus = 'PENDING' | 'ANSWERED' | 'RESOLVED';

export type InquiryTypeCode = 'FEATURE' | 'BUG' | 'ACCOUNT' | 'SPOT_INFO' | 'OTHER' | string;

export interface InquiryTypeOption {
  code: string;
  label: string;
}

export const INQUIRY_TYPES: InquiryTypeOption[] = [
  { code: 'FEATURE', label: '기능 문의' },
  { code: 'BUG', label: '앱 오류 신고' },
  { code: 'ACCOUNT', label: '계정/로그인' },
  { code: 'SPOT_INFO', label: '스팟 정보 제보' },
  { code: 'OTHER', label: '기타 문의' },
];

export function getInquiryTypeLabel(type?: string): string {
  if (!type) return '기타 문의';
  const found = INQUIRY_TYPES.find(
    (t) => t.code.toUpperCase() === type.toUpperCase() || t.label === type
  );
  return found ? found.label : type;
}

export interface InquiryItem {
  id: number;
  userId: number;
  userNickname: string;
  userEmail?: string;
  type?: InquiryTypeCode;
  title: string;
  content: string;
  answer: string | null;
  answeredByNickname: string | null;
  answeredAt: string | null;
  isResolved: boolean;
  status: InquiryStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface InquiryPageResponse {
  content: InquiryItem[];
  pageable?: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last?: boolean;
  first?: boolean;
}

export interface InquiryCreateRequest {
  type: string;
  title: string;
  content: string;
}

export interface InquiryResolveRequest {
  isResolved: boolean;
}

export interface AdminInquiryFilterParams {
  type?: string;
  status?: InquiryStatus;
  isResolved?: boolean;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface AdminInquiryAnswerRequest {
  answer: string;
}
