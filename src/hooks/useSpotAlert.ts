import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spotAlertApi, SpotAlertSettingUpdateRequest } from '@/api/spotAlert';
import { useAuthStore } from '@/store/useAuthStore';

export const useSpotAlert = () => {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

  const useSpotAlertsQuery = () =>
    useQuery({
      queryKey: ['spotAlerts'],
      queryFn: () => spotAlertApi.getSpotAlerts(accessToken!),
      enabled: !!accessToken,
    });

  const useSpotAlertDetailQuery = (spotId: number) =>
    useQuery({
      queryKey: ['spotAlert', spotId],
      queryFn: () => spotAlertApi.getSpotAlert(spotId, accessToken!),
      enabled: !!accessToken && !!spotId,
    });

  const useUpdateSpotAlertMutation = () =>
    useMutation({
      mutationFn: ({ spotId, data }: { spotId: number; data: SpotAlertSettingUpdateRequest }) =>
        spotAlertApi.updateSpotAlert(spotId, data, accessToken!),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['spotAlerts'] });
        queryClient.invalidateQueries({ queryKey: ['spotAlert', variables.spotId] });
      },
    });

  const useDeleteSpotAlertMutation = () =>
    useMutation({
      mutationFn: (spotId: number) => spotAlertApi.deleteSpotAlert(spotId, accessToken!),
      onSuccess: (_, spotId) => {
        queryClient.invalidateQueries({ queryKey: ['spotAlerts'] });
        queryClient.invalidateQueries({ queryKey: ['spotAlert', spotId] });
      },
    });

  return {
    useSpotAlertsQuery,
    useSpotAlertDetailQuery,
    useUpdateSpotAlertMutation,
    useDeleteSpotAlertMutation,

    // 하위 호환 별칭
    useWishlistsQuery: useSpotAlertsQuery,
    useWishlistDetailQuery: useSpotAlertDetailQuery,
    useUpdateWishlistMutation: useUpdateSpotAlertMutation,
    useDeleteWishlistMutation: useDeleteSpotAlertMutation,
  };
};
