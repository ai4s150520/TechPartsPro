import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, CreditCard, ChevronRight, Wallet } from 'lucide-react';
import AccountSidebar from '../../components/layout/AccountSidebar';
import apiClient from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import { formatPrice } from '../../lib/utils';

const AccountOverviewPage: React.FC = () => {
  const { user } = useAuthStore();
  
  // State to hold dashboard stats
  const [stats, setStats] = useState({ 
    totalOrders: 0, 
    defaultAddress: null,
    walletBalance: 0 
  });
  
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, addressRes] = await Promise.all([
          apiClient.get('/orders/'),
          apiClient.get('/accounts/addresses/')
        ]);

        // --- CRITICAL FIX: Handle Pagination Response ({ results: [...] }) correctly ---
        
        // 1. Handle Orders
        const ordersList = Array.isArray(ordersRes.data) 
          ? ordersRes.data 
          : (ordersRes.data.results || []);
        
        // Use backend count if available (for total history), else array length
        const totalCount = ordersRes.data.count || ordersList.length;

        // 2. Handle Addresses
        const addressList = Array.isArray(addressRes.data) 
          ? addressRes.data 
          : (addressRes.data.results || []);

        // 3. Find default address
        const defaultAddr = addressList.find((a: any) => a.is_default) || addressList[0];

        // Update State
        setStats({
          totalOrders: totalCount,
          defaultAddress: defaultAddr,
          walletBalance: 0 // Placeholder: Connect to Wallet API if available
        });
        
        // Set recent orders (Top 3)
        setRecentOrders(ordersList.slice(0, 3)); 

      } catch (error) {
        console.error("Dashboard load failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <AccountSidebar />
        </aside>

        {/* Content */}
        <main className="flex-1 space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Hello, {user?.name}</h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Total Orders Card */}
            <div className="bg-blue-50 p-6 rounded-xl flex items-center gap-4 border border-blue-100">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
            </div>
            
            {/* Address Card */}
            <div className="bg-green-50 p-6 rounded-xl flex items-center gap-4 border border-green-100">
              <div className="p-3 bg-green-100 text-green-600 rounded-full">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {(stats.defaultAddress as any)?.city || 'No Address'}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {(stats.defaultAddress as any)?.street_address || 'Add Default Shipping'}
                </p>
              </div>
            </div>

            {/* Wallet Card */}
            <div className="bg-purple-50 p-6 rounded-xl flex items-center gap-4 border border-purple-100">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Wallet</p>
                <p className="text-sm text-gray-600">{formatPrice(stats.walletBalance)} Credit</p>
              </div>
            </div>
          </div>

          {/* Recent Orders List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-900">Recent Orders</h2>
              {recentOrders.length > 0 && (
                <Link to="/account/orders" className="text-sm text-blue-600 hover:underline">View All</Link>
              )}
            </div>
            
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading activity...</div>
            ) : recentOrders.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center">
                <Package className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No orders placed yet.</p>
                <Link to="/shop" className="mt-4 text-blue-600 font-bold hover:underline">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <div key={order.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">Order #{order.order_id}</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString()} • {formatPrice(order.total_amount)}
                      </p>
                    </div>
                    
                    <Link to={`/account/orders/${order.id}`} className="flex items-center text-sm font-medium text-gray-500 hover:text-blue-600">
                      Details <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AccountOverviewPage;