import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, NotificationSettingUpdateRequest, NotificationSettingResponse } from '@/api/notification';
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
  community: true,
  dnd: {
    enabled: true,
    start: '22:00',
    end: '07:00',
    repeatPreset: 'daily',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
  },
};

const parseLocalTime = (timeStr?: string | null) => {
  if (!timeStr) return undefined;
  return timeStr.substring(0, 5);
};

export function useNotificationSettings(initial?: Partial<NotificationSettings>) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<NotificationSettings>({
    ...DEFAULT_SETTINGS,
    ...initial,
    dnd: { ...DEFAULT_SETTINGS.dnd, ...initial?.dnd },
  });

  const latestSettingsRef = useRef(settings);
  const previousSettingsRef = useRef(settings);

  useEffect(() => {
    latestSettingsRef.current = settings;
  }, [settings]);

  // 1. GET /notifications/settings 수신 설정 데이터 조회 (Hydration)
  const { data: serverSettings } = useQuery<NotificationSettingResponse>({
    queryKey: ['notificationSettings', accessToken],
    queryFn: () => {
      if (!accessToken) return Promise.reject(new Error('AccessToken missing'));
      return notificationApi.getSettings(accessToken);
    },
    enabled: !!accessToken,
  });

  const currentTokenRef = useRef(accessToken);

  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    currentTokenRef.current = accessToken;
    // accessToken 변경 시 (로그아웃 / 계정 전환 등) 큐에 대기 중인 동기화 타이머 취소
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
  }, [accessToken]);

  // 2. PUT /notifications/settings 수신 설정 동기화
  const updateApiMutation = useMutation({
    mutationFn: ({ requestToken, ...data }: NotificationSettingUpdateRequest & { requestToken?: string }) => {
      if (!requestToken) return Promise.resolve();
      return notificationApi.updateSettings(data, requestToken);
    },
    onMutate: (variables) => {
      // API 전송 실패 시 롤백용 스냅샷 및 당시 토큰 기록
      return { previousSettings: previousSettingsRef.current, requestToken: variables.requestToken };
    },
    onError: (_err, _variables, context) => {
      // 계정 전환 없이 동일한 로그인 세션일 때만 Rollback 수행
      if (context?.requestToken && context.requestToken === currentTokenRef.current) {
        if (context?.previousSettings) {
          setSettings(context.previousSettings);
          latestSettingsRef.current = context.previousSettings;
        }
        Alert.alert(
          '설정 저장 실패',
          '네트워크 오류로 알림 수신 설정 변경에 실패했습니다. 이전 설정으로 되돌아갑니다.'
        );
      }
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.requestToken && context.requestToken === currentTokenRef.current) {
        queryClient.invalidateQueries({ queryKey: ['notificationSettings', context.requestToken] });
      }
    },
  });

  useEffect(() => {
    // 동기화 타이머 대기 중이거나 API 요청 중일 때는 하이드레이션 스킵
    if (serverSettings && !syncTimerRef.current && !updateApiMutation.isPending) {
      const hasDnd = serverSettings.isDndEnabled ?? !!(serverSettings.dndStartTime && serverSettings.dndEndTime);
      setSettings((prev) => ({
        ...prev,
        wishlist: serverSettings.isSpotAlertPushEnabled ?? prev.wishlist,
        golden: serverSettings.isGoldenHourPushEnabled ?? prev.golden,
        community: serverSettings.isCommunityPushEnabled ?? prev.community,
        dnd: {
          ...prev.dnd,
          enabled: hasDnd,
          start: parseLocalTime(serverSettings.dndStartTime) ?? prev.dnd.start,
          end: parseLocalTime(serverSettings.dndEndTime) ?? prev.dnd.end,
        },
      }));
    }
  }, [serverSettings, updateApiMutation.isPending]);

  const formatLocalTime = (timeStr?: string) => {
    if (!timeStr) return undefined;
    return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  };

  const syncSettingsToApi = useCallback((newSettings: NotificationSettings) => {
    if (!accessToken) return;

    // 첫 디바운스 시작 시점(타이머가 아직 없는 상태)에서만 롤백 스냅샷 캡처
    if (!syncTimerRef.current) {
      previousSettingsRef.current = latestSettingsRef.current;
    } else {
      clearTimeout(syncTimerRef.current);
    }

    const tokenForRequest = accessToken;

    syncTimerRef.current = setTimeout(() => {
      syncTimerRef.current = null;
      updateApiMutation.mutate({
        requestToken: tokenForRequest,
        isSpotAlertPushEnabled: newSettings.wishlist,
        isGoldenHourPushEnabled: newSettings.golden,
        isCommunityPushEnabled: newSettings.community,
        isDndEnabled: newSettings.dnd.enabled,
        dndStartTime: newSettings.dnd.enabled ? formatLocalTime(newSettings.dnd.start) : undefined,
        dndEndTime: newSettings.dnd.enabled ? formatLocalTime(newSettings.dnd.end) : undefined,
      });
    }, 300);
  }, [accessToken, updateApiMutation]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  // 3. 독립 토글 업데이트 함수
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
