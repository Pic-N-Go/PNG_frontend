export type SpotBadge = 'HOT' | 'NEW';

export interface SpotItem {
  id: string;
  name: string;
  location: string;
  category: string;
  rating: number;
  photoScore: number;
  badge?: SpotBadge;
  isBookmarked: boolean;
  gradientColors: [string, string, string];
}

export interface CalendarEvent {
  id: string;
  dateRange: string;
  eventName: string;
  place: string;
  tip: string;
  photoScore: number;
  tag: string;
  headerColor: string;
}

export interface CategoryItem {
  id: string;
  label: string;
}
