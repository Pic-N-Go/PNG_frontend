import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi, WishlistSettingUpdateRequest } from '@/api/wishlist';
import { useAuthStore } from '@/store/useAuthStore';

export const useWishlist = () => {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

  const useWishlistsQuery = () =>
    useQuery({
      queryKey: ['wishlists'],
      queryFn: () => wishlistApi.getWishlists(accessToken!),
      enabled: !!accessToken,
    });

  const useWishlistDetailQuery = (spotId: number) =>
    useQuery({
      queryKey: ['wishlist', spotId],
      queryFn: () => wishlistApi.getWishlist(spotId, accessToken!),
      enabled: !!accessToken && !!spotId,
    });

  const useUpdateWishlistMutation = () =>
    useMutation({
      mutationFn: ({ spotId, data }: { spotId: number; data: WishlistSettingUpdateRequest }) =>
        wishlistApi.updateWishlist(spotId, data, accessToken!),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['wishlists'] });
        queryClient.invalidateQueries({ queryKey: ['wishlist', variables.spotId] });
      },
    });

  const useDeleteWishlistMutation = () =>
    useMutation({
      mutationFn: (spotId: number) => wishlistApi.deleteWishlist(spotId, accessToken!),
      onSuccess: (_, spotId) => {
        queryClient.invalidateQueries({ queryKey: ['wishlists'] });
        queryClient.invalidateQueries({ queryKey: ['wishlist', spotId] });
      },
    });

  return {
    useWishlistsQuery,
    useWishlistDetailQuery,
    useUpdateWishlistMutation,
    useDeleteWishlistMutation,
  };
};
