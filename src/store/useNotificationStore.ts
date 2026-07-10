import { create } from 'zustand';

export type NotifType = 'wishlist' | 'weather' | 'community';
export type NotifIconKey = 'bell' | 'sun' | 'cloudDown' | 'heart' | 'message' | 'userPlus';

export interface NotifItem {
  id: string;
  type: NotifType;
  isUnread: boolean;
  icon: NotifIconKey;
  label: string;
  time: string;
  title: string;
  desc: string;
  cta?: string;
}

export interface NotifGroup {
  label: string;
  items: NotifItem[];
}

const MOCK_GROUPS: NotifGroup[] = [
  {
    label: '오늘',
    items: [
      {
        id: '1', type: 'wishlist', isUnread: true, icon: 'bell',
        label: '위시리스트 달성', time: '방금',
        title: '광안리 해수욕장 — 조건 충족!',
        desc: '미세먼지 좋음 · 골든아워 오전 6:32 · 맑음',
        cta: '바로 출발',
      },
      {
        id: '2', type: 'weather', isUnread: true, icon: 'sun',
        label: '날씨 예보', time: '1시간 전',
        title: '경복궁 — 내일 오전 촬영 최적',
        desc: '맑음 · 미세먼지 좋음 · 골든아워 5:58 예상',
      },
      {
        id: '3', type: 'community', isUnread: false, icon: 'heart',
        label: '좋아요', time: '3시간 전',
        title: '김준혁 외 12명이 좋아해요',
        desc: '광안리 일출 사진 · 오늘 오전 게시',
      },
      {
        id: '4', type: 'community', isUnread: false, icon: 'message',
        label: '댓글', time: '4시간 전',
        title: '이수연 · "삼각대 어떤 거 쓰셨어요?"',
        desc: '광안리 일출 사진에 댓글',
      },
    ],
  },
  {
    label: '어제',
    items: [
      {
        id: '5', type: 'wishlist', isUnread: false, icon: 'bell',
        label: '위시리스트 예보', time: '어제 18:20',
        title: '제주 사려니숲길 — 내일 안개 예상',
        desc: '오전 7~9시 안개 예보 · 촬영 최적 조건',
      },
      {
        id: '6', type: 'weather', isUnread: false, icon: 'cloudDown',
        label: '날씨 개선', time: '어제 09:04',
        title: '영월 별마로천문대 — 구름 해소',
        desc: '오늘 밤 구름 없음 · 은하수 촬영 가능',
      },
      {
        id: '7', type: 'community', isUnread: false, icon: 'userPlus',
        label: '새 팔로워', time: '어제 07:30',
        title: '박민준이 팔로우했어요',
        desc: '팔로워 38명',
      },
    ],
  },
  {
    label: '이전',
    items: [
      {
        id: '8', type: 'wishlist', isUnread: false, icon: 'bell',
        label: '위시리스트 달성', time: '5월 10일',
        title: '에버랜드 장미원 — 만개 조건 충족',
        desc: '개화율 94% · 맑음 · 미세먼지 좋음',
      },
    ],
  },
];

interface NotificationStore {
  groups: NotifGroup[];
  markAllRead: () => void;
  markRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  groups: MOCK_GROUPS,
  markAllRead: () => set((state) => ({
    groups: state.groups.map((g) => ({
      ...g,
      items: g.items.map((item) => ({ ...item, isUnread: false })),
    })),
  })),
  markRead: (id) => set((state) => ({
    groups: state.groups.map((g) => ({
      ...g,
      items: g.items.map((item) => item.id === id ? { ...item, isUnread: false } : item),
    })),
  })),
}));

export const selectHasUnread = (state: NotificationStore) =>
  state.groups.some((g) => g.items.some((i) => i.isUnread));
