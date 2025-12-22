import type { UserRole } from '../store/authStore';

interface LocationState {
  from?: {
    pathname: string;
  };
}

/**
 * Determines the redirect path after a successful login.
 * 
 * Logic:
 * 1. If user was redirected to Login (e.g. from Checkout), go back there.
 * 2. If Seller -> Seller Dashboard.
 * 3. If Admin -> Admin Dashboard.
 * 4. Default -> Home Page.
 */
export const getPostLoginRedirect = (role: UserRole, state?: LocationState | null): string => {
  // 1. Check history state
  if (state?.from?.pathname) {
    return state.from.pathname;
  }

  // 2. Role Based Redirection
  switch (role) {
    case 'SELLER':
      return '/seller/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    case 'CUSTOMER':
    default:
      return '/';
  }
};