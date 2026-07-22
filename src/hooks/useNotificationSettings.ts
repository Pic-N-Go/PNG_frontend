import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { notificationsApi, NotificationSettingUpdateRequest } from '@/api/notifications';
import { useAuthStore } from '@/store/useAuthStore';

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
  const accessToken = useAuthStore((state) => state.accessToken);

  const [settings, setSettings] = useState<NotificationSettings>({
    ...DEFAULT_SETTINGS,
    ...initial,
    dnd: { ...DEFAULT_SETTINGS.dnd, ...initial?.dnd },
  });

  const updateApiMutation = useMutation({
    mutationFn: (data: NotificationSettingUpdateRequest) => {
      if (!accessToken) return Promise.resolve();
      return notificationsApi.updateSettings(data, accessToken);
    },
  });

  const syncSettingsToApi = (newSettings: NotificationSettings) => {
    const isAllPushEnabled = newSettings.wishlist || newSettings.golden || newSettings.community;
    updateApiMutation.mutate({
      isAllPushEnabled,
      dndStartTime: newSettings.dnd.enabled ? newSettings.dnd.start : '',
      dndEndTime: newSettings.dnd.enabled ? newSettings.dnd.end : '',
    });
  };

  const setWishlist = (value: boolean) =>
    setSettings((prev) => {
      const updated = { ...prev, wishlist: value };
      syncSettingsToApi(updated);
      return updated;
    });

  const setGolden = (value: boolean) =>
    setSettings((prev) => {
      const updated = { ...prev, golden: value };
      syncSettingsToApi(updated);
      return updated;
    });

  const setCommunity = (value: boolean) =>
    setSettings((prev) => {
      const updated = { ...prev, community: value };
      syncSettingsToApi(updated);
      return updated;
    });

  const setDndEnabled = (value: boolean) =>
    setSettings((prev) => {
      const updated = { ...prev, dnd: { ...prev.dnd, enabled: value } };
      syncSettingsToApi(updated);
      return updated;
    });

  const setDndTime = (start: string, end: string) =>
    setSettings((prev) => {
      const updated = { ...prev, dnd: { ...prev.dnd, start, end } };
      syncSettingsToApi(updated);
      return updated;
    });

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
    isUpdating: updateApiMutation.isPending,
  };
}
