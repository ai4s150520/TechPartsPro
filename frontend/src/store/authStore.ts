import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. Define Types matching Django User Model
export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  name: string; // Combined first_name + last_name from backend
  role: UserRole;
  phone_number?: string;
  is_verified?: boolean;
  avatar?: string; // If you implement profile pictures later
}

interface AuthState {
  // State Variables
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (user: User, accessToken: string, refreshToken?: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // Actions
      login: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
        });
      },

      logout: () => {
        // Clear everything
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        
        // Clear cart on logout
        import('./cartStore').then(({ useCartStore }) => {
          useCartStore.getState().clearCart();
        });
        
        // Optional: Clear local storage manually if persist behaves oddly in specific browsers
        localStorage.removeItem('auth-storage'); 
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      setTokens: (accessToken, refreshToken) => {
        set((state) => ({
          accessToken,
          refreshToken: refreshToken || state.refreshToken, // Keep old refresh if not provided
        }));
      },
    }),
    {
      name: 'auth-storage', // Key name in localStorage
      storage: createJSONStorage(() => localStorage), // Explicitly use localStorage
      partialize: (state) => ({ 
        // Select fields to persist (Optional: Don't persist everything if not needed)
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);