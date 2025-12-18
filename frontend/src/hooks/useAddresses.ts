import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Address } from '../types/models';

export const useAddresses = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const response = await addressAPI.list();
      // Debug log removed
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: true,
  });
};

export const useAddress = (id: number) => {
  return useQuery({
    queryKey: ['address', id],
    queryFn: async () => {
      const response = await addressAPI.get(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Address, 'id' | 'user' | 'created_at' | 'updated_at'>) => 
      addressAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Address> }) => 
      addressAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => addressAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => addressAPI.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};
