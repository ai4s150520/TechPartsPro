import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import SideDrawer from './SideDrawer';

const Layout: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      
      {/* <div className="hidden md:block">
        <CategoryBar />  <--- DELETE THIS BLOCK
      </div> */}

      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="flex-grow relative z-10">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default Layout;