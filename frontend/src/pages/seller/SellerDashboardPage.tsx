import React, { useEffect, useState } from 'react';
import { DollarSign, Package, ShoppingBag, TrendingUp } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { formatPrice } from '../../lib/formatters';
import RevenueChart from '../../components/seller/RevenueChart';

interface RecentOrder {
  id: number;
  order_id: string;
  product_name: string;
  price: string;
}

const SellerDashboardPage: React.FC = () => {
  // Update state to include revenue_graph from backend
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_orders: 0,
    total_products: 0,
    pending_payouts: 0,
    revenue_graph: [] // Will hold real data [ {name: 'Mon', revenue: 0}, ... ]
  });
  
  const [recentItems, setRecentItems] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          apiClient.get('/sellers/dashboard/'),
          apiClient.get('/sellers/orders/?page_size=5') 
        ]);
        setStats(statsRes.data);
        setRecentItems(ordersRes.data.results);
      } catch (error) {
        console.error("Dashboard error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cards = [
    { 
      label: 'Total Revenue', 
      value: formatPrice(stats.total_revenue),
      icon: DollarSign, 
      color: 'bg-green-500' 
    },
    { 
      label: 'Total Orders', 
      value: stats.total_orders, 
      icon: ShoppingBag, 
      color: 'bg-blue-500' 
    },
    { 
      label: 'Active Products', 
      value: stats.total_products, 
      icon: Package, 
      color: 'bg-orange-500' 
    },
    { 
      label: 'Pending Payout', 
      value: formatPrice(stats.pending_payouts),
      icon: TrendingUp, 
      color: 'bg-purple-500' 
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
            <div className={`p-3 rounded-lg mr-4 text-white shadow-lg ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
              {loading ? (
                <div className="h-7 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* Recent Orders List */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 h-96 overflow-y-auto custom-scrollbar">
          <h3 className="font-bold text-gray-900 mb-4">Recent Sales</h3>
          {recentItems.length === 0 ? (
            <p className="text-gray-400 text-center mt-10">No recent sales.</p>
          ) : (
            <div className="space-y-3">
              {recentItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-bold text-sm text-gray-800">#{item.order_id}</p>
                    <p className="text-xs text-gray-500 truncate w-48">{item.product_name}</p>
                  </div>
                  <span className="font-bold text-green-600 text-sm">
                    {formatPrice(item.price)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- REVENUE CHART (Pass Real Data) --- */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 h-96">
          <RevenueChart data={stats.revenue_graph || []} />
        </div>

      </div>
    </div>
  );
};

export default SellerDashboardPage;