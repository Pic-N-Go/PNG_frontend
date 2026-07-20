import { useAuthStore } from '@/store/useAuthStore';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const TIMEOUT_MS = 30_000;

export class ApiError extends Error {}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().accessToken;
  const headers = new Headers(options.headers || {});
  
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE}${url}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(err.message ?? `HTTP Error ${res.status}`);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : undefined;
  } finally {
    clearTimeout(timer);
  }
}

export type SpotInCourse = {
  id: number;
  spotId: number;
  dayNumber: number;
  sequenceOrder: number;
  memo: string;
  travelTimeMinutes: number;
};

export type CourseChecklist = {
  id: number;
  content: string;
  isChecked: boolean;
};

export type Course = {
  id: number;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  createdAt: string;
  spots?: SpotInCourse[];
  checklists?: CourseChecklist[];
};

export const coursesApi = {
  // 1. 전체 코스 목록 조회
  getCourses: (): Promise<Course[]> => {
    return fetchWithAuth('/courses', { method: 'GET' });
  },

  // 2. 새 코스 생성
  createCourse: (data: { title: string; startDate: string; endDate: string }): Promise<Course> => {
    return fetchWithAuth('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 3. 코스 상세 조회
  getCourse: (id: number): Promise<Course> => {
    return fetchWithAuth(`/courses/${id}`, { method: 'GET' });
  },

  // 4. 코스 정보 수정
  updateCourse: (id: number, data: { title?: string; startDate?: string; endDate?: string }): Promise<Course> => {
    return fetchWithAuth(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 5. 코스 삭제
  deleteCourse: (id: number): Promise<void> => {
    return fetchWithAuth(`/courses/${id}`, { method: 'DELETE' });
  },

  // 6. 코스에 명소 추가
  addSpotToCourse: (id: number, data: { spotId: number; dayNumber: number; sequenceOrder: number; memo?: string }): Promise<SpotInCourse> => {
    return fetchWithAuth(`/courses/${id}/spots`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 7. 코스에서 명소 제거
  removeSpotFromCourse: (id: number, spotId: number): Promise<void> => {
    return fetchWithAuth(`/courses/${id}/spots/${spotId}`, { method: 'DELETE' });
  },

  // 8. 명소 순서 변경
  reorderSpots: (id: number, spotIds: number[]): Promise<void> => {
    return fetchWithAuth(`/courses/${id}/spots/order`, {
      method: 'PUT',
      body: JSON.stringify({ spotIds }),
    });
  },

  // 9. 체크리스트 항목 추가
  addChecklist: (id: number, content: string): Promise<CourseChecklist> => {
    return fetchWithAuth(`/courses/${id}/checklists`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  // 10. 체크리스트 상태 토글
  toggleChecklist: (id: number, checklistId: number): Promise<CourseChecklist> => {
    return fetchWithAuth(`/courses/${id}/checklists/${checklistId}`, {
      method: 'PUT',
    });
  },

  // 11. 체크리스트 내용 수정
  updateChecklist: (id: number, checklistId: number, content: string): Promise<CourseChecklist> => {
    return fetchWithAuth(`/courses/${id}/checklists/${checklistId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  },

  // 12. 체크리스트 삭제
  deleteChecklist: (id: number, checklistId: number): Promise<void> => {
    return fetchWithAuth(`/courses/${id}/checklists/${checklistId}`, {
      method: 'DELETE',
    });
  },

  // 13. 날씨 정보 조회
  getCourseWeather: (id: number): Promise<CourseWeather[]> => {
    return fetchWithAuth(`/courses/${id}/weather`, { method: 'GET' });
  },
};

export type CourseWeather = {
  dayNumber: number;
  date: string;
  targetSpotId: number;
  targetSpotName: string;
  weatherStatus: string;
  temperature: number | null;
  sunsetTime: string;
  goldenHourEvening: string;
};
