import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SearchState {
  recentSearches: string[];
  addRecentSearch: (keyword: string) => void;
  removeRecentSearch: (keyword: string) => void;
  clearRecentSearches: () => void;
}

const MAX_RECENT_SEARCHES = 10;

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      recentSearches: [],
      addRecentSearch: (keyword: string) => {
        const trimmed = keyword.trim();
        if (!trimmed) return;
        set((state) => {
          const filtered = state.recentSearches.filter((item) => item !== trimmed);
          const next = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
          return { recentSearches: next };
        });
      },
      removeRecentSearch: (keyword: string) => {
        set((state) => ({
          recentSearches: state.recentSearches.filter((item) => item !== keyword),
        }));
      },
      clearRecentSearches: () => {
        set({ recentSearches: [] });
      },
    }),
    {
      name: 'search-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
