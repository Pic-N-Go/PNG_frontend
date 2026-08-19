import * as SecureStore from 'expo-secure-store';
import type { StateStorage } from 'zustand/middleware';

const ACCESS_TOKEN_KEY = 'auth-access-token';
const REFRESH_TOKEN_KEY = 'auth-refresh-token';

type PersistEnvelope = {
  state?: Record<string, unknown>;
  version?: number;
  tokenRevision?: string;
};

type StoredToken = {
  revision: string;
  value: string | null;
};

let revisionSequence = 0;
let writeQueue: Promise<void> = Promise.resolve();
let latestWrite: Promise<void> = Promise.resolve();

function nextRevision(): string {
  revisionSequence += 1;
  return `${Date.now()}-${revisionSequence}`;
}

function enqueueAuthStorageWrite(operation: () => Promise<void>): Promise<void> {
  const write = writeQueue.then(operation);
  latestWrite = write;

  // 한 번 실패해도 이후 저장 작업은 계속 실행할 수 있도록 큐만 복구한다.
  writeQueue = write.catch((error) => {
    if (__DEV__) console.error('[authStorage] SecureStore write failed:', error);
  });

  return write;
}

/** Zustand set()의 반환값에 의존하지 않고 가장 최근 SecureStore 쓰기를 기다린다. */
export function waitForAuthStorageWrite(): Promise<void> {
  return latestWrite;
}

function parseStoredToken(raw: string | null): StoredToken | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredToken>;
    if (
      typeof parsed.revision !== 'string' ||
      (parsed.value !== null && typeof parsed.value !== 'string')
    ) {
      return null;
    }
    return { revision: parsed.revision, value: parsed.value };
  } catch {
    return null;
  }
}

/**
 * JWT 두 개를 각자 별도 SecureStore 키에 저장한다. envelope의 revision은 일부 쓰기만
 * 성공한 토큰 쌍이 다음 실행에서 복원되는 것을 막는 commit marker다.
 */
export const authSecureStorage: StateStorage = {
  getItem: async (name) => {
    try {
      await writeQueue.catch(() => undefined);
      const rawEnvelope = await SecureStore.getItemAsync(name);
      if (!rawEnvelope) return null;

      const envelope = JSON.parse(rawEnvelope) as PersistEnvelope;
      if (!envelope.tokenRevision || !envelope.state) {
        // 기존 버전의 accessToken 단독 저장 데이터는 그대로 마이그레이션한다.
        return rawEnvelope;
      }

      const [rawAccessToken, rawRefreshToken] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      ]);
      const accessToken = parseStoredToken(rawAccessToken);
      const refreshToken = parseStoredToken(rawRefreshToken);
      const revisionMatches =
        accessToken?.revision === envelope.tokenRevision &&
        refreshToken?.revision === envelope.tokenRevision;

      envelope.state.accessToken = revisionMatches ? accessToken.value : null;
      envelope.state.refreshToken = revisionMatches ? refreshToken.value : null;
      return JSON.stringify(envelope);
    } catch (error) {
      if (__DEV__) console.error('[authStorage] SecureStore getItem failed:', error);
      return null;
    }
  },

  setItem: (name, value) => {
    return enqueueAuthStorageWrite(async () => {
      const envelope = JSON.parse(value) as PersistEnvelope;
      const state = { ...(envelope.state ?? {}) };
      const accessToken = typeof state.accessToken === 'string' ? state.accessToken : null;
      const refreshToken = typeof state.refreshToken === 'string' ? state.refreshToken : null;
      delete state.accessToken;
      delete state.refreshToken;

      const revision = nextRevision();
      const accessRecord: StoredToken = { revision, value: accessToken };
      const refreshRecord: StoredToken = { revision, value: refreshToken };

      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, JSON.stringify(accessRecord));
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, JSON.stringify(refreshRecord));
      await SecureStore.setItemAsync(
        name,
        JSON.stringify({ ...envelope, state, tokenRevision: revision }),
      );
    });
  },

  removeItem: (name) => {
    return enqueueAuthStorageWrite(async () => {
      await Promise.all([
        SecureStore.deleteItemAsync(name),
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      ]);
    });
  },
};
