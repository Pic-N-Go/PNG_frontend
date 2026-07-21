// TODO: 백엔드 DND 엔드포인트 스펙 확정 후 TanStack Query(useQuery/useMutation)로 교체
import { useState } from 'react';

export type DndRepeatPreset = 'daily' | 'weekday' | 'weekend' | 'custom';

export interface DndSettings {
  enabled: boolean;
  start: string;
  end: string;
  repeatPreset: DndRepeatPreset;
  repeatDays: number[];
}

export interface NotificationSettings {
  wishlist: boolean;
  golden: boolean;
  community: boolean;
  dnd: DndSettings;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  wishlist: true,
  golden: true,
  community: false,
  dnd: {
    enabled: true,
    start: '22:00',
    end: '07:00',
    repeatPreset: 'daily',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
  },
};

export function useNotificationSettings(initial?: Partial<NotificationSettings>) {
  const [settings, setSettings] = useState<NotificationSettings>({
    ...DEFAULT_SETTINGS,
    ...initial,
    dnd: { ...DEFAULT_SETTINGS.dnd, ...initial?.dnd },
  });

  const setWishlist = (value: boolean) =>
    setSettings((prev) => ({ ...prev, wishlist: value }));

  const setGolden = (value: boolean) =>
    setSettings((prev) => ({ ...prev, golden: value }));

  const setCommunity = (value: boolean) =>
    setSettings((prev) => ({ ...prev, community: value }));

  const setDndEnabled = (value: boolean) =>
    setSettings((prev) => ({ ...prev, dnd: { ...prev.dnd, enabled: value } }));

  const setDndTime = (start: string, end: string) =>
    setSettings((prev) => ({ ...prev, dnd: { ...prev.dnd, start, end } }));

  const setDndRepeat = (preset: DndRepeatPreset, days: number[]) =>
    setSettings((prev) => ({ ...prev, dnd: { ...prev.dnd, repeatPreset: preset, repeatDays: days } }));

  return {
    settings,
    setWishlist,
    setGolden,
    setCommunity,
    setDndEnabled,
    setDndTime,
    setDndRepeat,
  };
}
