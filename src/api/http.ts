// API 모듈이 공유하는 fetch 래퍼. api/community.ts와 api/spot.ts가 글자까지 같은 사본을
// 하나씩 들고 있어서, 세 번째 사본을 만드는 대신 여기로 뺐다.
// 기존 두 파일은 건드리지 않았다 — 콘테스트 연동과 무관한 변경이라 diff만 커진다.
import { ApiError, fetchWithAuthRetry, toHttpError } from '@/api/auth';

export const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

const TIMEOUT_MS = 10_000;
// 사진 업로드는 약한 회선에서 60초로 자주 걸렸다. 중단돼도 서버엔 저장됐을 수 있어
// 중복 위험이 있으므로 넉넉히 잡는다(spot.ts·community.ts와 같은 값).
const UPLOAD_TIMEOUT_MS = 180_000;

export type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/** RN이 파일 파트로 인식하는 최소 형태 (expo-image-picker 결과 그대로) */
export interface FileUpload {
  uri: string;
  name: string;
  type: string;
}

// fetch는 타임아웃(abort)·전송 실패를 'Aborted' / 'Network request failed' 같은 영문으로 던진다.
// 그대로 Alert에 노출되므로 한국어로 바꿔서 올린다.
function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  // 사용자에게는 한국어를 보여주되, 원인을 잃으면 디버깅이 불가능해 dev에서는 원본을 남긴다.
  if (__DEV__) console.warn('[api] 원본 오류:', err);
  if (err instanceof Error && err.name === 'AbortError') {
    // 서버가 이미 처리를 끝냈을 수 있어 "다시 시도"를 권하지 않는다(멱등 키가 없어 중복이 생긴다).
    return new ApiError('응답이 늦어 중단했어요. 등록됐는지 확인한 뒤 다시 시도해 주세요.');
  }
  return new ApiError('네트워크 연결을 확인해 주세요.');
}

// 본문 없는 성공 응답이 있다(204, DELETE의 200). res.json()을 무조건 부르면 파싱 오류가
// toApiError를 타고 "네트워크 연결을 확인해 주세요"가 돼서, 성공한 요청이 실패로 보인다.
async function parseBody<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function request<T>(
  path: string,
  opts: { method?: Method; body?: unknown; token?: string } = {},
): Promise<T> {
  const { method = 'GET', body, token } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetchWithAuthRetry(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) throw await toHttpError(res, token);
    return await parseBody<T>(res);
  } catch (err) {
    throw toApiError(err);
  } finally {
    clearTimeout(timer);
  }
}

/** multipart 전용. FormData는 boundary를 런타임이 붙이도록 Content-Type을 지정하지 않는다. */
export async function upload<T>(path: string, method: 'POST' | 'PATCH', form: FormData, token: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const res = await fetchWithAuthRetry(`${BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) throw await toHttpError(res, token);
    return await parseBody<T>(res);
  } catch (err) {
    throw toApiError(err);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * `@RequestPart("request")`는 JSON 파트다. RN의 FormData는 Blob을 지원하지 않아 파트별
 * Content-Type을 붙일 수 없는데, Spring은 파트에 타입이 없으면 application/octet-stream으로
 * 보고 415를 던진다. 그래서 문자열 대신 `type: 'application/json'`을 붙인 가짜 파일로 넣는다.
 */
export function appendJsonPart(form: FormData, name: string, value: unknown) {
  form.append(name, {
    string: JSON.stringify(value),
    name: `${name}.json`,
    type: 'application/json',
  } as unknown as Blob);
}

export function appendFilePart(form: FormData, name: string, file: FileUpload) {
  form.append(name, { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
}
