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

  const useToggleSpotAlertActiveMutation = () =>
    useMutation({
      mutationFn: ({ spotId, isAlertEnabled }: { spotId: number; isAlertEnabled: boolean }) =>
        spotAlertApi.toggleSpotAlertActive(spotId, isAlertEnabled, accessToken!),
      onMutate: async ({ spotId, isAlertEnabled }) => {
        await queryClient.cancelQueries({ queryKey: ['spotAlerts'] });
        const previousSpotAlerts = queryClient.getQueryData<any[]>(['spotAlerts']);
        if (previousSpotAlerts) {
          queryClient.setQueryData<any[]>(
            ['spotAlerts'],
            previousSpotAlerts.map((item) =>
              item.spotId === spotId ? { ...item, isAlertEnabled } : item
            )
          );
        }
        return { previousSpotAlerts };
      },
      onError: (err, variables, context) => {
        if (context?.previousSpotAlerts) {
          queryClient.setQueryData(['spotAlerts'], context.previousSpotAlerts);
        }
      },
      onSettled: (_, __, variables) => {
        queryClient.invalidateQueries({ queryKey: ['spotAlerts'] });
        queryClient.invalidateQueries({ queryKey: ['spotAlert', variables.spotId] });
      },
    });

  return {
    useSpotAlertsQuery,
    useSpotAlertDetailQuery,
    useUpdateSpotAlertMutation,
    useDeleteSpotAlertMutation,
    useToggleSpotAlertActiveMutation,

    // 하위 호환 별칭
    useWishlistsQuery: useSpotAlertsQuery,
    useWishlistDetailQuery: useSpotAlertDetailQuery,
    useUpdateWishlistMutation: useUpdateSpotAlertMutation,
    useDeleteWishlistMutation: useDeleteSpotAlertMutation,
    useToggleWishlistActiveMutation: useToggleSpotAlertActiveMutation,
  };
};
