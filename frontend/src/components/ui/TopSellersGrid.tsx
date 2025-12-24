import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, ShoppingBag } from 'lucide-react';
import apiClient from '../../lib/apiClient';

interface TopSeller {
  id: number;
  business_name: string;
  city: string;
  total_sales: number;
  avg_rating: number;
  total_reviews: number;
  satisfaction_rate: number;
  badge: {
    name: string;
    color: string;
    icon: string;
  };
}

const TopSellersGrid: React.FC = () => {
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopSellers = async () => {
      try {
        const response = await apiClient.get('/sellers/top-sellers/');
        setTopSellers(response.data);
      } catch (error) {
        console.error('Failed to fetch top sellers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopSellers();
  }, []);

  const getBadgeColor = (color: string) => {
    const colors = {
      gold: 'from-yellow-400 to-orange-500',
      blue: 'from-blue-500 to-indigo-600',
      green: 'from-green-500 to-emerald-600',
      gray: 'from-gray-400 to-gray-600'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl shadow-lg animate-pulse">
            <div className="w-20 h-20 bg-gray-200 rounded-2xl mb-6"></div>
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (topSellers.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-xl text-slate-600">No top sellers available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {topSellers.map((seller, idx) => (
        <div
          key={seller.id}
          className="group bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-rotate-1 border-2 border-slate-100 hover:border-blue-200"
        >
          {/* Badge */}
          <div className="flex items-center justify-between mb-6">
            <div className={`px-4 py-2 bg-gradient-to-r ${getBadgeColor(seller.badge.color)} text-white rounded-full text-sm font-bold shadow-lg`}>
              <span className="mr-2">{seller.badge.icon}</span>
              {seller.badge.name}
            </div>
            {idx < 3 && (
              <div className="text-2xl">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
              </div>
            )}
          </div>

          {/* Seller Info */}
          <div className="mb-6">
            <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
              {seller.business_name}
            </h3>
            <p className="text-slate-500 font-medium flex items-center">
              📍 {seller.city}
            </p>
          </div>

          {/* Stats */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <span className="text-slate-600 font-medium">Total Sales</span>
              </div>
              <span className="font-black text-slate-900">{seller.total_sales}+</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-slate-600 font-medium">Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900">{seller.avg_rating}</span>
                <span className="text-slate-500">({seller.total_reviews} reviews)</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-slate-600 font-medium">Satisfaction</span>
              </div>
              <span className="font-black text-green-600">{seller.satisfaction_rate}%</span>
            </div>
          </div>

          {/* Rating Stars */}
          <div className="flex items-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(seller.avg_rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Action Button */}
          <Link to={`/shop?seller=${seller.id}`}>
            <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
              View Products
            </button>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default TopSellersGrid;