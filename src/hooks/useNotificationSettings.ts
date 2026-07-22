import { useState, useCallback, useRef, useEffect } from 'react';
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

  const latestSettingsRef = useRef(settings);
  useEffect(() => {
    latestSettingsRef.current = settings;
  }, [settings]);

  const updateApiMutation = useMutation({
    mutationFn: (data: NotificationSettingUpdateRequest) => {
      if (!accessToken) return Promise.resolve();
      return notificationsApi.updateSettings(data, accessToken);
    },
  });

  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const syncSettingsToApi = useCallback((newSettings: NotificationSettings) => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = setTimeout(() => {
      const isAllPushEnabled = newSettings.wishlist || newSettings.golden || newSettings.community;
      updateApiMutation.mutate({
        isAllPushEnabled,
        dndStartTime: newSettings.dnd.enabled ? newSettings.dnd.start : '',
        dndEndTime: newSettings.dnd.enabled ? newSettings.dnd.end : '',
      });
    }, 300);
  }, [updateApiMutation]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  const setWishlist = useCallback((value: boolean) => {
    const next = { ...latestSettingsRef.current, wishlist: value };
    setSettings(next);
    syncSettingsToApi(next);
  }, [syncSettingsToApi]);

  const setGolden = useCallback((value: boolean) => {
    const next = { ...latestSettingsRef.current, golden: value };
    setSettings(next);
    syncSettingsToApi(next);
  }, [syncSettingsToApi]);

  const setCommunity = useCallback((value: boolean) => {
    const next = { ...latestSettingsRef.current, community: value };
    setSettings(next);
    syncSettingsToApi(next);
  }, [syncSettingsToApi]);

  const setDndEnabled = useCallback((value: boolean) => {
    const next = {
      ...latestSettingsRef.current,
      dnd: { ...latestSettingsRef.current.dnd, enabled: value },
    };
    setSettings(next);
    syncSettingsToApi(next);
  }, [syncSettingsToApi]);

  const setDndTime = useCallback((start: string, end: string) => {
    const next = {
      ...latestSettingsRef.current,
      dnd: { ...latestSettingsRef.current.dnd, start, end },
    };
    setSettings(next);
    syncSettingsToApi(next);
  }, [syncSettingsToApi]);

  const setDndRepeat = useCallback((preset: DndRepeatPreset, days: number[]) => {
    const next = {
      ...latestSettingsRef.current,
      dnd: { ...latestSettingsRef.current.dnd, repeatPreset: preset, repeatDays: days },
    };
    setSettings(next);
  }, []);

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
