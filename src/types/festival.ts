export type FestivalProgressStatus = 'ONGOING' | 'UPCOMING';

export interface FestivalResponse {
  id: number;
  name: string;
  address: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  eventStartDate: string; // YYYY-MM-DD
  eventEndDate: string;   // YYYY-MM-DD
  progressStatus: FestivalProgressStatus;
  overview: string;
  latitude: number;
  longitude: number;
  categories: string[];
  usetime: string | null;
  parking: string | null;
  infocenter: string | null;
}

export interface FestivalListParams {
  status?: 'ONGOING' | 'UPCOMING';
  date?: string; // YYYY-MM-DD
  page?: number;
  size?: number;
}

export interface PageFestivalResponse {
  content: FestivalResponse[];
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  first: boolean;
  empty: boolean;
}
