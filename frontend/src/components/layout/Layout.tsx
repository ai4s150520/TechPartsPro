import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SmartHeader from './SmartHeader';
import Footer from './Footer';
import SideDrawer from './SideDrawer';

const Layout: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <SmartHeader onMenuClick={() => setIsDrawerOpen(true)} />
      
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="flex-grow relative z-10">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default Layout;