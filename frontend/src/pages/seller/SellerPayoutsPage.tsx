import React, { useEffect, useState } from 'react';
import { Plus, Wallet, AlertCircle, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { formatPrice } from '../../lib/formatters';
import type { Wallet as WalletType, WalletTransaction, Withdrawal } from '../../types/models';

const SellerPayoutsPage: React.FC = () => {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'transactions' | 'withdrawals'>('transactions');

  const fetchWallet = async () => {
    try {
      const { data } = await apiClient.get('/wallet/');
      setWallet(data);
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
      toast.error('Failed to load wallet');
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await apiClient.get('/wallet/transactions/');
      setTransactions(data.results || data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const { data } = await apiClient.get('/wallet/withdrawals/');
      setWithdrawals(data.results || data);
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
    fetchWithdrawals();
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    
    if (!wallet) {
      toast.error('Wallet not loaded');
      return;
    }
    
    if (amount < 100) {
      toast.error('Minimum withdrawal amount is ₹100');
      return;
    }
    
    if (amount > wallet.balance) {
      toast.error('Withdrawal amount exceeds available balance');
      return;
    }
    
    try {
      await apiClient.post('/wallet/withdrawals/', { amount });
      toast.success('Withdrawal request submitted successfully');
      setIsModalOpen(false);
      setWithdrawAmount('');
      fetchWallet();
      fetchTransactions();
      fetchWithdrawals();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.amount?.[0] || 'Failed to request withdrawal');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'PROCESSING': return 'bg-blue-100 text-blue-700';
      case 'REQUESTED': return 'bg-yellow-100 text-yellow-700';
      case 'FAILED': case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Wallet & Withdrawals</h1>
        <Button 
          variant="seller" 
          onClick={() => setIsModalOpen(true)}
          disabled={!wallet || wallet.balance < 100 || wallet.is_locked}
        >
          <Plus className="w-4 h-4 mr-2" /> Withdraw Money
        </Button>
      </div>

      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-full"><Wallet className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-400">Wallet Balance</p>
              <p className="text-3xl font-bold">{wallet ? formatPrice(wallet.balance) : '₹0.00'}</p>
            </div>
          </div>
          {wallet?.is_locked && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg px-3 py-2">
              <p className="text-xs text-red-200">🔒 Wallet Locked</p>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-400">
          {wallet?.balance === 0 ? (
            <div className="flex items-start gap-2 text-yellow-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>No balance available. Wallet is credited when orders are delivered.</p>
            </div>
          ) : (
            <p>💡 Minimum withdrawal: ₹100 | Instant transfer via IMPS</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'transactions'
                ? 'text-slate-900 border-b-2 border-slate-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Transaction History
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'withdrawals'
                ? 'text-slate-900 border-b-2 border-slate-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Withdrawal History
          </button>
        </div>

        {/* Transaction History Tab */}
        {activeTab === 'transactions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-500">Loading...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-500">No transactions yet</td></tr>
                ) : transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {tx.transaction_type === 'CREDIT' ? (
                          <ArrowDownLeft className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-red-600" />
                        )}
                        <span className={tx.transaction_type === 'CREDIT' ? 'text-green-700' : 'text-red-700'}>
                          {tx.transaction_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{tx.description}</td>
                    <td className={`px-6 py-4 text-right font-semibold ${
                      tx.transaction_type === 'CREDIT' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {tx.transaction_type === 'CREDIT' ? '+' : '-'}{formatPrice(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-medium">
                      {formatPrice(tx.balance_after)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Withdrawal History Tab */}
        {activeTab === 'withdrawals' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Bank Account</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">UTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-500">Loading...</td></tr>
                ) : withdrawals.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-500">No withdrawals yet</td></tr>
                ) : withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id}>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(withdrawal.requested_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {formatPrice(withdrawal.amount)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {withdrawal.bank_account_holder}<br />
                      <span className="text-xs text-gray-400">
                        {withdrawal.bank_account_number.slice(-4).padStart(withdrawal.bank_account_number.length, '*')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status === 'PROCESSING' && <Clock className="w-3 h-3 inline mr-1" />}
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {withdrawal.utr_number || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Withdraw Money">
        <form onSubmit={handleRequest} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            Available Balance: <span className="font-bold">{wallet ? formatPrice(wallet.balance) : '₹0.00'}</span>
          </div>
          <p className="text-sm text-gray-600">Money will be transferred to your linked bank account via IMPS (instant).</p>
          <Input 
            label="Amount (₹)" 
            type="number" 
            value={withdrawAmount} 
            onChange={(e) => setWithdrawAmount(e.target.value)} 
            required 
            min={100}
            max={wallet?.balance || 0}
            helperText={`Minimum: ₹100 | Maximum: ${wallet ? formatPrice(wallet.balance) : '₹0.00'}`}
          />
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <p className="font-semibold mb-1">Note:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Amount will be debited from wallet immediately</li>
              <li>Transfer usually completes within minutes</li>
              <li>You'll receive UTR number once processed</li>
            </ul>
          </div>
          <Button type="submit" variant="seller" className="w-full">Withdraw {withdrawAmount && formatPrice(parseFloat(withdrawAmount))}</Button>
        </form>
      </Modal>
    </div>
  );
};

export default SellerPayoutsPage;