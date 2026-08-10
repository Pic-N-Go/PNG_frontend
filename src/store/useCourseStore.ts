import { create } from 'zustand';

export type Spot = {
  id: string;
  name: string;
  loc: string;
  lat: number;
  lng: number;
  tags: string[];
  score: string;
  photo: string;
};

interface CourseStore {
  // 현재 새 출사 코스에 선택된 스팟 목록
  selectedSpots: Spot[];
  addSpot: (spot: Spot) => void;
  removeSpot: (spotId: string) => void;
  clearSpots: () => void;
}

export const useCourseStore = create<CourseStore>((set) => ({
  selectedSpots: [],
  addSpot: (spot) => set((state) => {
    const normalizedId = String(spot.id);
    // 중복 방지 (id 타입 불일치 방지: number vs string)
    if (state.selectedSpots.some(s => String(s.id) === normalizedId)) return state;
    return { selectedSpots: [...state.selectedSpots, { ...spot, id: normalizedId }] };
  }),
  removeSpot: (spotId) => set((state) => {
    const next = state.selectedSpots.filter(s => String(s.id) !== String(spotId));
    // 목록에 없던 id면 상태를 그대로 둔다 (불필요한 리렌더 및 focus effect 재실행 방지)
    if (next.length === state.selectedSpots.length) return state;
    return { selectedSpots: next };
  }),
  clearSpots: () => set({ selectedSpots: [] }),
}));

// 하위 호환을 위한 에일리어스
export const useTravelStore = useCourseStore;
