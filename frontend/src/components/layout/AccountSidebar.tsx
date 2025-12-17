import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, ShoppingBag, MapPin, Heart, Key, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const AccountSidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuthStore();
  
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: 'My Profile', path: '/account', icon: User },
    { name: 'Orders', path: '/account/orders', icon: ShoppingBag },
    { name: 'Addresses', path: '/account/addresses', icon: MapPin },
    { name: 'Wishlist', path: '/account/wishlist', icon: Heart },
    { name: 'Change Password', path: '/account/change-password', icon: Key },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gray-50">
        <h2 className="font-bold text-gray-900">Account Settings</h2>
      </div>

      {/* Nav */}
      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          );
        })}

        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-4"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </nav>
    </div>
  );
};

export default AccountSidebar;