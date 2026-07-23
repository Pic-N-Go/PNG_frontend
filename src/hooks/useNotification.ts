import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, NotificationItem } from '@/api/notification';
import { useAuthStore } from '@/store/useAuthStore';

export const useNotification = () => {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

  const useNotificationsQuery = () =>
    useQuery<NotificationItem[]>({
      queryKey: ['notifications'],
      queryFn: () => notificationApi.getNotifications(accessToken!),
      enabled: !!accessToken,
    });

  const useMarkReadMutation = () =>
    useMutation({
      mutationFn: (id: number) => notificationApi.markRead(id, accessToken!),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    });

  const useMarkAllReadMutation = () =>
    useMutation({
      mutationFn: () => notificationApi.markAllRead(accessToken!),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    });

  return {
    useNotificationsQuery,
    useMarkReadMutation,
    useMarkAllReadMutation,
  };
};
