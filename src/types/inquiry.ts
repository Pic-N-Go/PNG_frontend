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
  { code: 'SPOT', label: '스팟 정보 제보' },
  { code: 'OTHER', label: '기타 문의' },
];

export function getInquiryTypeLabel(type?: string): string {
  if (!type) return '기타 문의';
  if (type === 'SPOT_INFO') return '스팟 정보 제보';
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

export interface InquiryAnswerTemplate {
  id: string;
  label: string;
  type: string;
  content: string;
}

export const INQUIRY_ANSWER_TEMPLATES: InquiryAnswerTemplate[] = [
  {
    id: 'feature',
    label: '기능 문의 답변',
    type: 'FEATURE',
    content:
      '안녕하세요, Pic-N-Go 지원팀입니다.\n문의해 주신 기능과 관련하여 안내드립니다.\n\n요청하신 사항은 서비스 개선 참고 목록에 반영되었으며, 차후 업데이트 시 더 편리하게 개선될 예정입니다.\n추가 문의 사항이 있으시면 언제든지 말씀해 주세요.\n\n감사합니다.',
  },
  {
    id: 'bug',
    label: '오류 신고 답변',
    type: 'BUG',
    content:
      '안녕하세요, Pic-N-Go 지원팀입니다.\n앱 이용 중 불편을 드려 진심으로 죄송합니다.\n\n제보해 주신 오류 현상은 담당 개발팀에서 확인을 마치고 조치 진행 중입니다.\n빠른 시일 내에 안정적인 서비스를 이용하실 수 있도록 최선을 다하겠습니다.\n\n감사합니다.',
  },
  {
    id: 'account',
    label: '계정/로그인 답변',
    type: 'ACCOUNT',
    content:
      '안녕하세요, Pic-N-Go 지원팀입니다.\n계정 이용 관련 문의에 대해 안내드립니다.\n\n비밀번호 재설정 및 회원 정보 관리는 [마이페이지 > 설정 > 계정] 메뉴에서 이용하실 수 있습니다.\n추가적인 계정 확인이 필요하시다면 본 문의글로 재문의해 주시기 바랍니다.\n\n감사합니다.',
  },
  {
    id: 'spot_info',
    label: '스팟 제보 답변',
    type: 'SPOT',
    content:
      '안녕하세요, Pic-N-Go 지원팀입니다.\n소중한 포토스팟 정보를 제보해 주셔서 진심으로 감사드립니다!\n\n제보해 주신 장소 및 좌표 정보는 검토 후 공식 포토스팟 목록에 추가될 예정입니다.\n앞으로도 멋진 포토스팟을 함께 나누어 주시기 바랍니다.\n\n감사합니다.',
  },
  {
    id: 'other',
    label: '일반/기타 답변',
    type: 'OTHER',
    content:
      '안녕하세요, Pic-N-Go 지원팀입니다.\n보내주신 문의 사항 잘 확인하였습니다.\n\n보내주신 소중한 의견 감사드리며, 더 나은 Pic-N-Go 서비스를 위해 지속적으로 개선해 나가겠습니다.\n기타 궁금하신 점이 있으시면 언제든 1:1 문의를 이용해 주세요.\n\n감사합니다.',
  },
];
