import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

export const useOrders = (params?: { status?: string; page?: number }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const response = await orderAPI.list(params);
      return response.data;
    },
    retry: false,
    enabled: isAuthenticated,
  });
};

export const useOrder = (id: number) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await orderAPI.get(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { address_id: number; payment_method: string }) => orderAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => orderAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useTrackOrder = (orderId: string) => {
  return useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: async () => {
      const response = await orderAPI.track(orderId);
      return response.data;
    },
    enabled: !!orderId,
  });
};
