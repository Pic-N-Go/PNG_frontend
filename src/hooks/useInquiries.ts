// TODO: 백엔드 문의 API 스펙 확정 후 TanStack Query(useQuery/useMutation)로 교체
import { useState } from 'react';

export type InquiryStatus = 'pending' | 'answered';

export interface InquiryReply {
  text: string;
  timeText: string;
  staffName?: string;
}

export interface Inquiry {
  id: string;
  category: string;
  title: string;
  preview: string;
  answerPreview?: string;
  status: InquiryStatus;
  unread?: boolean;
  timeText: string;
  createdAt: string;
  my: { text: string; timeText: string };
  replies: InquiryReply[];
}

const DEFAULT_INQUIRIES: Inquiry[] = [
  {
    id: '1',
    category: '기능 문의',
    title: '위시리스트 알림 관련 문의',
    preview: '방해 금지 시간을 스팟마다 따로 설정해야 하나요?',
    answerPreview: '이제 환경설정에서 한 번에 관리하실 수 있어요.',
    status: 'answered',
    unread: true,
    timeText: '2일 전',
    createdAt: '2026-07-12T09:00:00.000Z',
    my: { text: '방해 금지 시간을 스팟마다 따로 설정해야 하나요? 매번 설정하기 번거로워요.', timeText: '2일 전' },
    replies: [
      { text: '안녕하세요! 이제 마이페이지 > 환경설정 > 방해 금지에서 한 번에 관리하실 수 있어요. 스팟별 설정은 제거됐어요.', timeText: '1일 전', staffName: '고객지원팀' },
    ],
  },
  {
    id: '2',
    category: '앱 오류 신고',
    title: '스팟 상세 화면 로딩 오류',
    preview: '스팟 상세 화면에서 사진이 안 불러와져요.',
    status: 'pending',
    timeText: '어제',
    createdAt: '2026-07-13T13:20:00.000Z',
    my: { text: '스팟 상세 화면에서 사진이 안 불러와지고 계속 로딩 중이에요. 기종은 iPhone 15입니다.', timeText: '어제' },
    replies: [],
  },
  {
    id: '3',
    category: '계정',
    title: '카카오 계정 연결 해제 문의',
    preview: '카카오 계정 연결을 해제하고 싶어요.',
    answerPreview: '설정 > 연결된 소셜 계정에서 해제하실 수 있어요.',
    status: 'answered',
    unread: false,
    timeText: '1주 전',
    createdAt: '2026-07-07T10:00:00.000Z',
    my: { text: '카카오 계정 연결을 해제하고 이메일로 로그인하고 싶어요.', timeText: '1주 전' },
    replies: [
      { text: '설정 > 연결된 소셜 계정에서 카카오 연결 해제가 가능해요. 해제 후에도 기존 데이터는 그대로 유지돼요.', timeText: '6일 전', staffName: '고객지원팀' },
    ],
  },
];

function nextId(inquiries: Inquiry[]) {
  const max = inquiries.reduce((acc, i) => Math.max(acc, Number(i.id) || 0), 0);
  return String(max + 1);
}

export function useInquiries(initial: Inquiry[] = DEFAULT_INQUIRIES) {
  const [inquiries, setInquiries] = useState<Inquiry[]>(initial);

  const unreadCount = inquiries.filter((i) => i.status === 'answered' && i.unread).length;

  const addInquiry = (category: string, message: string) => {
    const newInquiry: Inquiry = {
      id: nextId(inquiries),
      category,
      title: category,
      preview: message,
      status: 'pending',
      timeText: '방금',
      createdAt: new Date().toISOString(),
      my: { text: message, timeText: '방금' },
      replies: [],
    };
    setInquiries((prev) => [newInquiry, ...prev]);
  };

  const markRead = (id: string) => {
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, unread: false } : i)));
  };

  const getById = (id: string) => inquiries.find((i) => i.id === id);

  return { inquiries, unreadCount, addInquiry, markRead, getById };
}
