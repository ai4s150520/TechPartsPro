import React from 'react';
import { Link } from 'react-router-dom';
import { X, User, ShoppingBag, Heart, LogOut, ChevronRight, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideDrawer: React.FC<SideDrawerProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <>
      {/* Overlay */}
      <div 
        className={clsx(
          "fixed inset-0 bg-black/50 z-50 transition-opacity duration-300",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className={clsx(
        "fixed inset-y-0 left-0 w-[80%] max-w-sm bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        {/* Header */}
        <div className="p-5 bg-gray-900 text-white flex justify-between items-center">
          <div>
             {isAuthenticated ? (
               <>
                 <p className="text-xs text-gray-400">Welcome back,</p>
                 <p className="font-bold text-lg">{user?.name}</p>
               </>
             ) : (
               <Link to="/auth/login" onClick={onClose} className="font-bold text-lg hover:underline">
                 Sign In / Register
               </Link>
             )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-full pb-20">
          
          {/* Main Links */}
          <div className="p-4 space-y-1 border-b border-gray-100">
            <Link to="/" onClick={onClose} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 text-gray-700">
               <span>Home</span> <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link to="/shop" onClick={onClose} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 text-gray-700">
               <span>Shop All Parts</span> <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link to="/cart" onClick={onClose} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 text-gray-700">
               <span className="flex items-center"><ShoppingBag className="w-4 h-4 mr-3" /> My Cart</span>
            </Link>
          </div>

          {/* Account Links */}
          {isAuthenticated && (
            <div className="p-4 space-y-1 border-b border-gray-100">
              <h4 className="px-3 text-xs font-bold text-gray-400 uppercase mb-2">My Account</h4>
              
              {user?.role === 'SELLER' ? (
                <Link to="/seller/dashboard" onClick={onClose} className="flex items-center p-3 rounded-lg hover:bg-orange-50 text-orange-700">
                  <LayoutDashboard className="w-4 h-4 mr-3" /> Seller Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/account" onClick={onClose} className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-gray-700">
                    <User className="w-4 h-4 mr-3" /> Profile
                  </Link>
                  <Link to="/account/orders" onClick={onClose} className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-gray-700">
                    <ShoppingBag className="w-4 h-4 mr-3" /> Orders
                  </Link>
                  <Link to="/account/wishlist" onClick={onClose} className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-gray-700">
                    <Heart className="w-4 h-4 mr-3" /> Wishlist
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="p-4">
             {isAuthenticated ? (
               <button onClick={() => { logout(); onClose(); }} className="w-full flex items-center justify-center p-3 text-red-600 bg-red-50 rounded-lg font-medium">
                 <LogOut className="w-4 h-4 mr-2" /> Logout
               </button>
             ) : (
               <div className="space-y-3">
                 <Link to="/auth/login" onClick={onClose} className="block w-full text-center py-3 bg-blue-600 text-white rounded-lg font-bold">
                   Customer Login
                 </Link>
                 <Link to="/seller/login" onClick={onClose} className="block w-full text-center py-3 border border-gray-300 text-gray-700 rounded-lg font-medium">
                   Seller Login
                 </Link>
               </div>
             )}
          </div>

        </div>
      </div>
    </>
  );
};

export default SideDrawer;