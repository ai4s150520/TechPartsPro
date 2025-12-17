import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewAPI } from '../services/api';

export const useReviews = (productId: number) => {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const response = await reviewAPI.list(productId);
      return response.data;
    },
    enabled: !!productId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { product: number; rating: number; comment: string }) => 
      reviewAPI.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.product] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { rating?: number; comment?: string } }) => 
      reviewAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => reviewAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

export const useMarkReviewHelpful = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => reviewAPI.markHelpful(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};
