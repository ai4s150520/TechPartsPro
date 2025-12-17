import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, LogOut, User, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationDropdown from '../ui/NotificationDropdown';

interface SellerTopBarProps {
  onMenuClick: () => void;
}

const SellerTopBar: React.FC<SellerTopBarProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/seller/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 fixed top-0 left-0 right-0 z-30 lg:left-64 transition-all duration-300">
      <div className="h-full px-4 flex items-center justify-between">
        
        {/* Left: Mobile Menu & Breadcrumbs */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search (Internal Order Search) */}
          <div className="hidden md:flex items-center relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3" />
            <input 
              type="text" 
              placeholder="Search orders, SKUs..." 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none w-64 transition-all"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          
          {/* Notifications */}
          <NotificationDropdown />

          {/* User Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-none">{user?.name}</p>
                <p className="text-xs text-gray-500">Seller Account</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold border border-orange-200">
                {user?.name?.charAt(0) || 'S'}
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20">
                   <div className="p-3 border-b border-gray-100 bg-gray-50">
                     <p className="text-xs text-gray-500 font-medium">Business ID: #{user?.id}</p>
                   </div>
                   <div className="p-1">
                     <Link to="/seller/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                       <User className="w-4 h-4 mr-2" /> Business Profile
                     </Link>
                     <button 
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      >
                       <LogOut className="w-4 h-4 mr-2" /> Logout
                     </button>
                   </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default SellerTopBar;