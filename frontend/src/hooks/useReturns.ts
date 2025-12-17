import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnAPI } from '../services/api';

export const useReturns = (params?: { page?: number }) => {
  return useQuery({
    queryKey: ['returns', params],
    queryFn: () => returnAPI.list(params),
  });
};

export const useReturn = (id: number) => {
  return useQuery({
    queryKey: ['return', id],
    queryFn: () => returnAPI.get(id),
    enabled: !!id,
  });
};

export const useCreateReturn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { order_item_id: number; reason: string; description: string; images?: File[] }) => 
      returnAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useCancelReturn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => returnAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
    },
  });
};
