import axios from 'axios';
import { API_URL, API_TIMEOUT } from './config';
// Import the Store directly to access state outside of React components
import { useAuthStore } from '../store/authStore';

// Create Axios Instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- 1. Request Interceptor ---
// Automatically attach the Access Token from Zustand Store to every outgoing request
apiClient.interceptors.request.use(
  (config) => {
    // Access state directly (non-hook usage for vanilla JS context)
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- 2. Response Interceptor ---
// Handle 401 errors (Token Expiry) automatically
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors (offline, timeout)
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    // Handle 500+ server errors
    if (error.response.status >= 500) {
      console.error('Server error:', error.response.data);
      return Promise.reject(new Error('Server error. Please try again later.'));
    }

    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as retried to prevent infinite loops

      // Get refresh token from Store
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          // Attempt to get a new Access Token
          // Note: We use axios directly to avoid using the interceptors here to prevent loops
          const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          // Success: Save new tokens to Store
          // Backend rotates refresh tokens (ROTATE_REFRESH_TOKENS: True), so we get a new refresh token too
          const newAccessToken = response.data.access;
          const newRefreshToken = response.data.refresh || refreshToken; // Use new refresh if provided
          
          // Update the store with BOTH tokens (this persists to localStorage automatically via Zustand middleware)
          useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

          // Update header for the original request and retry it
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);

        } catch (refreshError) {
          // Refresh failed (token expired or invalid) -> Force Logout
          console.error("Session expired. Please login again.");
          
          // Clear Store
          useAuthStore.getState().logout();
          
          window.location.href = '/auth/login'; // Hard redirect to login
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available -> Logout
        useAuthStore.getState().logout();
        // Optional: window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;