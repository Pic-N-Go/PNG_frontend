// 사용자 장비(카메라·렌즈) CRUD. 서버 라우트는 `/users/me/equipments`라 전부 인증이 필요하다.
import { ApiError, toHttpError, tokenFromHeaders } from '@/api/auth';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const TIMEOUT_MS = 30_000;

export { ApiError };

/**
 * 이 백엔드는 201·204에 본문을 비워 보내는 경우가 있어 res.json()이 그대로 던진다.
 * 쓰기가 성공했는데 실패 Alert이 뜨면 사용자가 같은 장비를 두 번 등록한다.
 */
async function parseBody<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function fetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw await toHttpError(res, tokenFromHeaders(options.headers));
    return res;
  } catch (err) {
    // 변환하지 않으면 "Network request failed" 같은 원문이 그대로 화면에 뜬다.
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('응답이 늦어 중단했어요. 잠시 후 다시 시도해 주세요.');
    }
    throw new ApiError('네트워크 연결을 확인해 주세요.');
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
    return parseBody(res);
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
    return parseBody(res);
  },

  deleteEquipment: async (equipmentId: number, token: string): Promise<void> => {
    await fetchWithTimeout(`${BASE}/users/me/equipments/${equipmentId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  },
};
