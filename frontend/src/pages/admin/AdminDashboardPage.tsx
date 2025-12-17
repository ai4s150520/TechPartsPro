import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, DollarSign, Package, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_orders: 0,
    total_products: 0,
    total_users: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch stats from the Analytics App backend
    const fetchStats = async () => {
      try {
        const { data } = await apiClient.get('/analytics/admin/stats/');
        setStats(data);
      } catch (error) {
        console.error("Failed to load admin stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Revenue', value: `$${stats.total_revenue.toLocaleString()}`, icon: DollarSign, color: 'bg-green-100 text-green-600' },
    { label: 'Total Orders', value: stats.total_orders, icon: ShoppingBag, color: 'bg-blue-100 text-blue-600' },
    { label: 'Products', value: stats.total_products, icon: Package, color: 'bg-purple-100 text-purple-600' },
    { label: 'Users', value: stats.total_users, icon: Users, color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
          <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div key={card.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className={`p-4 rounded-full ${card.color} mr-4`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                {loading ? (
                  <div className="h-6 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/admin/sellers" className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-500 transition group">
            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 flex items-center">
              Manage Sellers <TrendingUp className="w-4 h-4 ml-2" />
            </h3>
            <p className="text-sm text-gray-500 mt-2">Approve pending seller accounts and payouts.</p>
          </Link>
          <Link to="/admin/orders" className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-500 transition group">
            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 flex items-center">
              All Orders <ShoppingBag className="w-4 h-4 ml-2" />
            </h3>
            <p className="text-sm text-gray-500 mt-2">Track and manage all platform orders.</p>
          </Link>
          <Link to="/admin/reviews" className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-500 transition group">
            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 flex items-center">
              Moderation <Users className="w-4 h-4 ml-2" />
            </h3>
            <p className="text-sm text-gray-500 mt-2">Review reported comments and products.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;