// 컬렉션 색·아이콘 — BookmarkSheet(저장 시트), MY 탭 컬렉션 목록, 북마크 목록 배지가 같은 값을 쓴다.
// 시트에서 고른 색이 목록·배지에서 그대로 보여야 하므로 단일 소스로 둔다.
import React from 'react';
import {
  IconArchive,
  IconBookmark,
  IconCamera,
  IconClock,
  IconFlag,
  IconHeart,
  IconMapPin,
  IconMountain,
  IconSparkles,
  IconStar,
} from '@tabler/icons-react-native';
import { BRAND } from '@/constants/colors';

export type CollectionColorKey = 'pink' | 'blue' | 'purple' | 'green' | 'orange';

/** s = 아이콘·점 등 진한 색, t = 타일·배지 배경 틴트 */
export const COLLECTION_PAL: Record<CollectionColorKey, { s: string; t: string }> = {
  pink: { s: BRAND, t: '#FDE8EF' },
  blue: { s: '#2E7BF6', t: '#E4EEFD' },
  purple: { s: '#7C4DFF', t: '#EEE9FE' },
  green: { s: '#16A34A', t: '#E7F6EC' },
  orange: { s: '#E8890B', t: '#FCEBD5' },
};

export const COLLECTION_COLOR_KEYS: CollectionColorKey[] = ['pink', 'blue', 'purple', 'green', 'orange'];

/** 서버가 주는 color는 그냥 문자열이라 모르는 값이 올 수 있다 — pink로 떨어뜨린다. */
export const palOf = (key: string) => COLLECTION_PAL[key as CollectionColorKey] ?? COLLECTION_PAL.pink;

export type CollectionIconKey =
  | 'star' | 'heart' | 'bookmark' | 'map-pin' | 'camera' | 'flag' | 'sparkles' | 'mountain' | 'clock' | 'archive';

const ICON_MAP: Record<CollectionIconKey, React.ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
  star: IconStar,
  heart: IconHeart,
  bookmark: IconBookmark,
  'map-pin': IconMapPin,
  camera: IconCamera,
  flag: IconFlag,
  sparkles: IconSparkles,
  mountain: IconMountain,
  clock: IconClock,
  archive: IconArchive,
};

/** 시트에서 고를 수 있는 아이콘. clock·archive는 구버전 데이터 호환용으로 맵에만 남긴다. */
export const COLLECTION_ICON_SET: CollectionIconKey[] = [
  'star', 'heart', 'bookmark', 'map-pin', 'camera', 'flag', 'sparkles', 'mountain',
];

export function CollectionIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const Cmp = ICON_MAP[name as CollectionIconKey] ?? IconBookmark;
  return <Cmp size={size} color={color} strokeWidth={2} />;
}
