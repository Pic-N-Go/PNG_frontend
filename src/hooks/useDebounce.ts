import { useEffect, useState } from 'react';

/**
 * 값이 변경된 후 지정한 delay(기본 500ms) 동안 추가 변경이 없을 때만
 * 최신 값을 반환하여 API 불필요 연사/호출을 방지하는 디바운스 훅
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
