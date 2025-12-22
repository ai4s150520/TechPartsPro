import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { formatPrice } from '../../lib/utils';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

interface WalletData {
  balance: number;
  is_active: boolean;
  is_locked: boolean;
}

interface WalletTransaction {
  id: string;
  transaction_type: 'CREDIT' | 'DEBIT';
  source: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

const WalletPage: React.FC = () => {
  const { data: wallet, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: ['wallet'],
    queryFn: () => apiClient.get('/wallet/').then(res => res.data)
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<WalletTransaction[]>({
    queryKey: ['wallet-transactions'],
    queryFn: () => apiClient.get('/wallet/transactions/').then(res => res.data.results || [])
  });

  if (walletLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wallet</h1>
          <p className="text-gray-600">Manage your wallet balance and view transaction history</p>
        </div>

        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-6 h-6" />
                <span className="text-blue-100">Wallet Balance</span>
              </div>
              <div className="text-3xl font-bold">
                {formatPrice(wallet?.balance || 0)}
              </div>
              {wallet?.is_locked && (
                <div className="mt-2 text-red-200 text-sm">
                  ⚠️ Wallet is locked. Contact support.
                </div>
              )}
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                wallet?.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {wallet?.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
          </div>
          
          <div className="p-6">
            {transactionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.transaction_type === 'CREDIT' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.transaction_type === 'CREDIT' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {transaction.description || transaction.source.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(transaction.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        transaction.transaction_type === 'CREDIT' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'CREDIT' ? '+' : '-'}
                        {formatPrice(transaction.amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Balance: {formatPrice(transaction.balance_after)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No transactions yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Your wallet transactions will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;