import { jwtDecode } from "jwt-decode";
import { useAuthStore } from '../store/authStore';

interface DecodedToken {
  exp: number;
  user_id: number;
  role?: string;
}

/**
 * Legacy Auth Helper
 * Refactored to read directly from Zustand Store to prevent state duplication.
 * This ensures strict consistency between the API client and the UI.
 */
export const auth = {
  // --- Getters (Read from Store) ---
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,

  // --- Setters (Write to Store) ---
  setTokens: (access: string, refresh?: string) => {
    useAuthStore.getState().setTokens(access, refresh);
  },

  // --- Clear (Action in Store) ---
  clearTokens: () => {
    useAuthStore.getState().logout();
  },

  // --- Validation ---
  isAuthenticated: (): boolean => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return false;
    
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  },

  getUserInfo: () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return null;
    try {
      return jwtDecode<DecodedToken>(token);
    } catch {
      return null;
    }
  }
};