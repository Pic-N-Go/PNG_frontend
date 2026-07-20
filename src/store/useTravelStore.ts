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

interface TravelStore {
  // 현재 새 출사 계획에 선택된 스팟 목록
  selectedSpots: Spot[];
  addSpot: (spot: Spot) => void;
  removeSpot: (spotId: string) => void;
  clearSpots: () => void;
}

export const useTravelStore = create<TravelStore>((set) => ({
  selectedSpots: [],
  addSpot: (spot) => set((state) => {
    // 중복 방지
    if (state.selectedSpots.some(s => s.id === spot.id)) return state;
    return { selectedSpots: [...state.selectedSpots, spot] };
  }),
  removeSpot: (spotId) => set((state) => ({
    selectedSpots: state.selectedSpots.filter(s => s.id !== spotId)
  })),
  clearSpots: () => set({ selectedSpots: [] }),
}));
