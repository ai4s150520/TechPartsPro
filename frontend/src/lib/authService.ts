import apiClient from './apiClient';
import { useAuthStore } from '../store/authStore'; // FIX: Direct Store Access

// Types matching Django Serializers
export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  };
}

export const authService = {
  // Login
  // PURE FUNCTION: Only returns data. Does not save to LocalStorage/Store.
  async login(credentials: any): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login/', credentials);
    return response.data; 
  },

  // Register
  async register(data: any) {
    const response = await apiClient.post('/auth/register/', data);
    return response.data;
  },

  // Logout
  // Updated to read directly from Store and call Blacklist endpoint
  async logout() {
    // 1. Get token directly from Zustand Store (Source of Truth)
    const refresh = useAuthStore.getState().refreshToken;
    
    try {
      if (refresh) {
        // 2. Call the endpoint we are adding to backend/accounts/urls.py
        await apiClient.post('/auth/token/blacklist/', { refresh });
      }
    } catch (e) {
      // Ignore network errors during logout (e.g. token already expired)
      console.warn("Logout blacklist failed", e);
    } finally {
      // 3. Clear Global State
      useAuthStore.getState().logout();
    }
  },

  // Change Password
  async changePassword(data: any) {
    const response = await apiClient.put('/auth/change-password/', data);
    return response.data;
  }
};