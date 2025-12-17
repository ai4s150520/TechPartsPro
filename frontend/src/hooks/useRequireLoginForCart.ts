import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

export const useRequireLoginForCart = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Checks if user is logged in.
   * If NOT: Redirects to login with return path, returns FALSE.
   * If YES: Returns TRUE.
   */
  const validateLogin = (): boolean => {
    if (!isAuthenticated) {
      // Redirect to login, but remember where we are (e.g., /shop/product/iphone-screen)
      // So after login, we can redirect back here.
      navigate('/auth/login', { 
        state: { from: location.pathname } 
      });
      return false;
    }
    return true;
  };

  return validateLogin;
};