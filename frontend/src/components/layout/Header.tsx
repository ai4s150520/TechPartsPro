import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, LogOut, Package, Heart, LayoutDashboard, Store, BarChart3, Boxes } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCart } from '../../hooks/useCart';
import NotificationDropdown from '../ui/NotificationDropdown';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { data: cart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  
  const cartCount = cart?.total_items || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <Link 
            to={user?.role === 'SELLER' ? '/seller/home' : '/'} 
            className="text-2xl font-extrabold text-blue-600 tracking-tight flex items-center"
          >
            TechParts<span className="text-gray-900">Pro</span>
          </Link>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl relative mx-4">
          <input
            type="text"
            placeholder="Search for parts, models, or SKUs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-300 rounded-full py-2.5 pl-5 pr-12 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
          />
          <button type="submit" className="absolute right-1.5 top-1.5 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Navigation Actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          
          {/* Become a Seller Button - Only for Guests */}
          {!isAuthenticated && (
            <Link 
              to="/sell-online" 
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm shadow-sm"
            >
              <Store className="w-4 h-4" />
              <span>Become a Seller</span>
            </Link>
          )}
          
          {/* Customer Navigation */}
          {user?.role === 'CUSTOMER' && (
            <>
              {/* Notifications */}
              <NotificationDropdown />
              
              {/* Wishlist */}
              <Link to="/account/wishlist" className="hidden sm:flex items-center justify-center w-10 h-10 hover:bg-gray-50 rounded-full transition text-gray-700">
                <Heart className="w-5 h-5" />
              </Link>

              {/* Cart with Dynamic Badge */}
              <Link to="/cart" className="relative w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-full transition text-gray-700">
                <ShoppingCart className="w-5 h-5" />
                {isAuthenticated && cartCount > 0 && (
                  <span className="absolute top-1 right-0.5 bg-red-600 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full ring-2 ring-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {/* Seller Navigation */}
          {user?.role === 'SELLER' && (
            <>
              <Link to="/seller/products" className="hidden sm:flex items-center justify-center w-10 h-10 hover:bg-orange-50 rounded-full transition text-orange-600">
                <Boxes className="w-5 h-5" />
              </Link>
              <Link to="/seller/orders" className="hidden sm:flex items-center justify-center w-10 h-10 hover:bg-orange-50 rounded-full transition text-orange-600">
                <Package className="w-5 h-5" />
              </Link>
            </>
          )}

          {/* Guest Navigation */}
          {!isAuthenticated && (
            <>
              <Link to="/account/wishlist" className="hidden sm:flex items-center justify-center w-10 h-10 hover:bg-gray-50 rounded-full transition text-gray-700">
                <Heart className="w-5 h-5" />
              </Link>
              <Link to="/cart" className="relative w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-full transition text-gray-700">
                <ShoppingCart className="w-5 h-5" />
              </Link>
            </>
          )}

          {/* User Dropdown */}
          <div className="relative group z-50">
            <button className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1.5 rounded-lg transition">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                {isAuthenticated ? user?.name?.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs text-gray-500">Welcome</p>
                <p className="text-sm font-semibold text-gray-900 leading-none">
                  {isAuthenticated ? user?.name.split(' ')[0] : 'Sign In'}
                </p>
              </div>
            </button>

            {/* Dropdown Content */}
            <div className="absolute right-0 top-full pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden ring-1 ring-black ring-opacity-5">
                {!isAuthenticated ? (
                  <>
                    <div className="p-4">
                      <Link to="/auth/login" className="block w-full text-center py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold shadow-sm">
                        Login / Register
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="py-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    
                    {user?.role === 'SELLER' ? (
                      <>
                        <Link to="/seller/dashboard" className="flex items-center px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 font-medium">
                          <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                        </Link>
                        <Link to="/seller/products" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Boxes className="w-4 h-4 mr-2" /> My Products
                        </Link>
                        <Link to="/seller/orders" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Package className="w-4 h-4 mr-2" /> Orders
                        </Link>
                        <Link to="/seller/analytics" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <BarChart3 className="w-4 h-4 mr-2" /> Analytics
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link to="/account" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <User className="w-4 h-4 mr-2" /> My Profile
                        </Link>
                        <Link to="/account/orders" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Package className="w-4 h-4 mr-2" /> My Orders
                        </Link>
                        <Link to="/account/wishlist" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Heart className="w-4 h-4 mr-2" /> Wishlist
                        </Link>
                      </>
                    )}
                    
                    <button 
                      onClick={handleLogout} 
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100 mt-1"
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;