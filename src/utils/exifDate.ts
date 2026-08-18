// expo-image-picker가 돌려주는 EXIF에서 촬영 일시를 꺼낸다.
// 키 이름과 중첩 구조가 플랫폼마다 달라서(iOS는 '{Exif}' 하위에 있는 경우가 있음)
// 후보를 순서대로 훑는다. 못 찾으면 null — 호출부가 현재 시각으로 폴백한다.

/** EXIF 표준 표기: "2026:08:10 05:30:12". 일부 기기는 날짜 구분자로 '-'를 쓴다. */
const EXIF_DATETIME = /^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/;

// 원본 촬영 시각(DateTimeOriginal)이 가장 정확하다. 편집본은 DateTime이 편집 시각으로 덮여 있어 마지막 순위.
const KEYS = ['DateTimeOriginal', 'DateTimeDigitized', 'DateTime'];

function readString(exif: Record<string, unknown>, key: string): string | null {
  const direct = exif[key];
  if (typeof direct === 'string') return direct;
  // iOS는 '{Exif}' 서브딕셔너리에 담아 주기도 한다.
  const nested = exif['{Exif}'];
  if (nested && typeof nested === 'object') {
    const v = (nested as Record<string, unknown>)[key];
    if (typeof v === 'string') return v;
  }
  return null;
}

/**
 * EXIF 촬영 일시 → Date. 값이 없거나 형식이 어긋나면 null.
 * 타임존 정보가 없는 표기라 기기 로컬 시각으로 해석한다(촬영지 기준과 다를 수 있음).
 */
export function parseExifDateTime(exif: unknown): Date | null {
  if (!exif || typeof exif !== 'object') return null;
  const dict = exif as Record<string, unknown>;

  for (const key of KEYS) {
    const raw = readString(dict, key);
    if (!raw) continue;
    const m = EXIF_DATETIME.exec(raw.trim());
    if (!m) continue;
    const [, y, mo, d, h, mi, s] = m;
    const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s ?? 0));
    // "0000:00:00 00:00:00"을 넣는 기기가 있어 유효성을 확인한다.
    if (Number.isNaN(date.getTime()) || Number(y) < 1900) continue;
    return date;
  }
  return null;
}

// ponytail: dev 전용 self-check — 키 우선순위·형식 파싱 회귀 방지 (프로덕션 no-op)
if (__DEV__) {
  const at = (d: Date | null) => (d ? `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}` : null);
  console.assert(at(parseExifDateTime({ DateTimeOriginal: '2026:08:10 05:30:12' })) === '2026-8-10 5:30', 'EXIF 표준 표기 파싱 오류');
  console.assert(at(parseExifDateTime({ '{Exif}': { DateTimeOriginal: '2026:08:10 05:30:12' } })) === '2026-8-10 5:30', 'iOS 중첩 딕셔너리 파싱 오류');
  console.assert(at(parseExifDateTime({ DateTime: '2026-08-10 18:05:00' })) === '2026-8-10 18:5', '하이픈 구분자 파싱 오류');
  console.assert(
    at(parseExifDateTime({ DateTimeOriginal: '2026:08:10 05:30:12', DateTime: '2026:08:11 09:00:00' })) === '2026-8-10 5:30',
    'DateTimeOriginal이 DateTime보다 우선해야 한다',
  );
  console.assert(parseExifDateTime({ DateTimeOriginal: '0000:00:00 00:00:00' }) === null, '빈 EXIF 값은 null이어야 한다');
  console.assert(parseExifDateTime({}) === null, 'EXIF 없음 → null');
  console.assert(parseExifDateTime(null) === null, 'null 입력 → null');
  console.assert(parseExifDateTime(undefined) === null, 'undefined 입력 → null');
}
