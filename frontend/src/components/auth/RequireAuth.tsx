import React from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../../store/authStore';

interface RequireAuthProps {
  allowedRoles?: UserRole[]; // Optional: If empty, allows any logged-in user
}

const RequireAuth: React.FC<RequireAuthProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // 1. Check if User is Logged In
  if (!isAuthenticated || !user) {
    // Redirect to Login, but save the current location they were trying to visit.
    // We will access this 'state.from' in the Login page to redirect them back.
    
    // Determine login page based on context (Seller vs Customer)
    // If they were trying to access a seller route, send to seller login.
    const isSellerRoute = location.pathname.startsWith('/seller');
    const loginPath = isSellerRoute ? '/seller/login' : '/auth/login';

    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // 2. Role-Based Access Control (RBAC)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User is logged in, but doesn't have permission.
    
    // Scenario A: A Customer tries to access Seller Dashboard -> Redirect Home
    if (user.role === 'CUSTOMER') {
      return <Navigate to="/" replace />;
    }
    
    // Scenario B: A Seller tries to access Customer Checkout -> Redirect Home
    if (user.role === 'SELLER') {
      return <Navigate to="/seller/home" replace />;
    }

    // Default Fallback
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. Access Granted
  return <Outlet />;
};

export default RequireAuth;