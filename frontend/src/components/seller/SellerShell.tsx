import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Wallet, 
  Settings, 
  LogOut,
  ChevronRight,
  X,
  Home
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';

interface SellerShellProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  children: React.ReactNode;
}

const SellerShell: React.FC<SellerShellProps> = ({ sidebarOpen, setSidebarOpen, children }) => {
  const { logout } = useAuthStore();

  const navigation = [
    { name: 'Home', href: '/seller/home', icon: Home },
    { name: 'Dashboard', href: '/seller/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/seller/products', icon: Package },
    { name: 'Orders', href: '/seller/orders', icon: ShoppingBag },
    { name: 'Payouts', href: '/seller/payouts', icon: Wallet },
  ];

  return (
    <>
      {/* 1. SIDEBAR (Desktop Fixed / Mobile Fixed) */}
      <aside 
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          
          {/* Logo Area */}
          <div className="h-16 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800">
            <Link to="/seller/home" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="bg-orange-600 rounded px-1.5 py-0.5 text-sm">B2B</span>
              TechParts
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Main Menu
            </p>
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)} // Close on mobile click
                className={({ isActive }) => clsx(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-orange-600 text-white shadow-lg shadow-orange-900/50" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon 
                      className={clsx(
                        "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                        isActive ? "text-white" : "text-slate-500 group-hover:text-white"
                      )} 
                    />
                    {item.name}
                    {isActive && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer Area */}
          <div className="p-4 border-t border-slate-800 bg-slate-950">
             <button 
               onClick={() => logout()}
               className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors"
             >
               <LogOut className="w-5 h-5 mr-3" />
               Sign Out
             </button>
          </div>
        </div>
      </aside>

      {/* 2. OVERLAY (Mobile Only) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 3. MAIN CONTENT WRAPPER */}
      <div className="lg:pl-64 flex flex-col min-h-screen bg-gray-50">
        {children}
      </div>
    </>
  );
};

export default SellerShell;