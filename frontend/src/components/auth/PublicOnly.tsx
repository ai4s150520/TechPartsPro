import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const PublicOnly: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (isAuthenticated && user) {
    // User is already logged in. Redirect them away from Login/Register pages.
    
    // 1. Check if there is a 'from' location in state (User was redirected here)
    // e.g., User clicked Checkout -> Login -> (Success) -> Back to Checkout
    const from = (location.state as any)?.from?.pathname;
    if (from) {
      return <Navigate to={from} replace />;
    }

    // 2. If no history, redirect based on Role
    if (user.role === 'SELLER') {
      return <Navigate to="/seller/dashboard" replace />;
    } else if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      // Default Customer
      return <Navigate to="/" replace />;
    }
  }

  // User is NOT logged in. Allow access to the public page.
  return <Outlet />;
};

export default PublicOnly;