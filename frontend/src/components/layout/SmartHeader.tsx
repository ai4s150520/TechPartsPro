import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import SellerMainHeader from './SellerMainHeader';
import SellerTopBar from '../seller/SellerTopBar';

interface SmartHeaderProps {
  onMenuClick: () => void;
}

const SmartHeader: React.FC<SmartHeaderProps> = ({ onMenuClick }) => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  // If user is a seller
  if (isAuthenticated && user?.role === 'SELLER') {
    // Show SellerTopBar for seller dashboard pages
    if (location.pathname.startsWith('/seller/')) {
      return <SellerTopBar onMenuClick={onMenuClick} />;
    }
    // Show SellerMainHeader for main marketplace pages
    return <SellerMainHeader onMenuClick={onMenuClick} />;
  }

  // Show regular header for customers, admins, and guests
  return <Header onMenuClick={onMenuClick} />;
};

export default SmartHeader;