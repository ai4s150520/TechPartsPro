import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, LogOut, User, Search, Package, BarChart3, Settings, Store, Home } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationDropdown from '../ui/NotificationDropdown';

interface SellerMainHeaderProps {
  onMenuClick: () => void;
}

const SellerMainHeader: React.FC<SellerMainHeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/seller/login');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-orange-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-orange-50 rounded-full transition-colors text-orange-600"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <Link 
            to="/seller/home" 
            className="text-2xl font-extrabold text-orange-600 tracking-tight flex items-center"
          >
            TechParts<span className="text-gray-900">Pro</span>
            <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">Seller</span>
          </Link>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl relative mx-4">
          <input
            type="text"
            placeholder="Search marketplace for parts, models, or SKUs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-orange-200 rounded-full py-2.5 pl-5 pr-12 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all text-sm"
          />
          <button type="submit" className="absolute right-1.5 top-1.5 bg-orange-600 text-white p-1.5 rounded-full hover:bg-orange-700 transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Navigation Actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          
          {/* Quick Actions for Sellers */}
          <Link 
            to="/seller/dashboard" 
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium text-sm"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden lg:inline">Dashboard</span>
          </Link>

          <Link 
            to="/seller/products" 
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium text-sm"
          >
            <Package className="w-4 h-4" />
            <span className="hidden lg:inline">Products</span>
          </Link>

          <Link 
            to="/" 
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm"
          >
            <Home className="w-4 h-4" />
            <span className="hidden lg:inline">Marketplace</span>
          </Link>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Dropdown */}
          <div className="relative group z-50">
            <button className="flex items-center gap-2 hover:bg-orange-50 px-2 py-1.5 rounded-lg transition">
              <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm border border-orange-200">
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs text-gray-500">Seller</p>
                <p className="text-sm font-semibold text-gray-900 leading-none">
                  {user?.name?.split(' ')[0] || 'Account'}
                </p>
              </div>
            </button>

            {/* Dropdown Content */}
            <div className="absolute right-0 top-full pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden ring-1 ring-black ring-opacity-5">
                <div className="py-2">
                  <div className="px-4 py-3 border-b border-gray-100 bg-orange-50">
                    <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-orange-600 truncate">Seller Account</p>
                  </div>
                  
                  <Link to="/seller/dashboard" className="flex items-center px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 font-medium">
                    <BarChart3 className="w-4 h-4 mr-2" /> Seller Dashboard
                  </Link>
                  <Link to="/seller/products" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Package className="w-4 h-4 mr-2" /> My Products
                  </Link>
                  <Link to="/seller/orders" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Package className="w-4 h-4 mr-2" /> Orders
                  </Link>
                  <Link to="/seller/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <User className="w-4 h-4 mr-2" /> Business Profile
                  </Link>
                  
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100 mt-1"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SellerMainHeader;