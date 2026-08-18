// 사용자 장비(카메라·렌즈) CRUD. 서버 라우트는 `/users/me/equipments`라 전부 인증이 필요하다.
import { toHttpError, tokenFromHeaders } from '@/api/auth';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const TIMEOUT_MS = 30_000;

export { ApiError } from '@/api/auth';

async function fetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw await toHttpError(res, tokenFromHeaders(options.headers));
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** 서버 EquipmentType. 카메라·렌즈 둘뿐이라 그 밖의 장비(드론 등)는 등록할 수 없다. */
export type EquipmentTypeApi = 'CAMERA' | 'LENS';

export interface UserEquipmentDTO {
  id: number;
  equipmentType: EquipmentTypeApi;
  equipmentName: string;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });
const jsonHeaders = (token: string) => ({ ...authHeaders(token), 'Content-Type': 'application/json' });

export const equipmentApi = {
  getMyEquipments: async (token: string): Promise<UserEquipmentDTO[]> => {
    const res = await fetchWithTimeout(`${BASE}/users/me/equipments`, {
      method: 'GET',
      headers: authHeaders(token),
    });
    return res.json();
  },

  createEquipment: async (
    body: { equipmentType: EquipmentTypeApi; equipmentName: string },
    token: string,
  ): Promise<UserEquipmentDTO> => {
    const res = await fetchWithTimeout(`${BASE}/users/me/equipments`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(body),
    });
    return res.json();
  },

  updateEquipment: async (
    equipmentId: number,
    body: { equipmentType: EquipmentTypeApi; equipmentName: string },
    token: string,
  ): Promise<UserEquipmentDTO> => {
    const res = await fetchWithTimeout(`${BASE}/users/me/equipments/${equipmentId}`, {
      method: 'PUT',
      headers: jsonHeaders(token),
      body: JSON.stringify(body),
    });
    return res.json();
  },

  deleteEquipment: async (equipmentId: number, token: string): Promise<void> => {
    await fetchWithTimeout(`${BASE}/users/me/equipments/${equipmentId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  },
};
