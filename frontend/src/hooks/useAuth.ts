import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, login, logout } = useAuthStore();

  return {
    // Core State
    user,
    isAuthenticated,
    login,
    logout,

    // 🚀 Derived State (Role Helpers)
    // Makes permission checks cleaner in JSX: {isSeller && <SellerDashboard />}
    isAdmin: user?.role === 'ADMIN',
    isSeller: user?.role === 'SELLER',
    isCustomer: user?.role === 'CUSTOMER',
    
    // Helper to check if user has specific permissions
    checkRole: (allowedRoles: string[]) => {
        if (!user) return false;
        return allowedRoles.includes(user.role);
    }
  };
};