import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

export const useWishlist = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await wishlistAPI.list();
      return response.data;
    },
    retry: false,
    enabled: isAuthenticated,
  });
};

export const useToggleWishlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (product_id: number) => wishlistAPI.toggle(product_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
};

export const useAddToWishlist = () => useToggleWishlist();
export const useRemoveFromWishlist = () => useToggleWishlist();

export const useCheckWishlist = (product_id: number) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: ['wishlist-check', product_id],
    queryFn: async () => {
      const response = await wishlistAPI.check(product_id);
      return response.data;
    },
    enabled: !!product_id && isAuthenticated,
  });
};
