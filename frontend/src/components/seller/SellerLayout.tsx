import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SellerShell from './SellerShell';
import SellerTopBar from './SellerTopBar';

const SellerLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SellerShell sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      
      {/* 1. Seller-Specific Header */}
      <SellerTopBar onMenuClick={() => setSidebarOpen(true)} />

      {/* 2. Dynamic Page Content (Dashboard, Products, etc.) */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16">
        <div className="max-w-7xl mx-auto">
          {/* This is where the child route renders (e.g. SellerDashboard) */}
          <Outlet />
        </div>
      </main>

    </SellerShell>
  );
};

export default SellerLayout;