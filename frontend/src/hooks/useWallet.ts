import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletAPI } from '../services/api';

export const useWallet = () => {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletAPI.get(),
  });
};

export const useWalletTransactions = (params?: { page?: number }) => {
  return useQuery({
    queryKey: ['wallet-transactions', params],
    queryFn: () => walletAPI.getTransactions(params),
  });
};

export const useWithdrawals = (params?: { page?: number }) => {
  return useQuery({
    queryKey: ['withdrawals', params],
    queryFn: () => walletAPI.getWithdrawals(params),
  });
};

export const useRequestWithdrawal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (amount: number) => walletAPI.requestWithdrawal(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
    },
  });
};
