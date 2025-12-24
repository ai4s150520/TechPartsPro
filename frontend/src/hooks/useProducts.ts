import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productAPI } from '../services/api';

export const useProducts = (params?: { category?: string; search?: string; min_price?: string; max_price?: string; page?: number; ordering?: string }) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      // Convert string prices to numbers for API
      const apiParams = {
        ...params,
        min_price: params?.min_price ? Number(params.min_price) : undefined,
        max_price: params?.max_price ? Number(params.max_price) : undefined,
      };
      const response = await productAPI.list(apiParams);
      return response.data;
    },
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const response = await productAPI.get(slug);
      return response.data;
    },
    enabled: !!slug,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: FormData) => productAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: FormData }) => productAPI.update(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (slug: string) => productAPI.delete(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useBulkUpload = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => productAPI.bulkUpload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
