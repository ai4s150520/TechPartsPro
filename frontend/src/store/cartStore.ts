import { create } from 'zustand';
import apiClient from '../lib/apiClient';

interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    feature_image: string | null;
    slug: string;
    stock_quantity: number;
  };
  quantity: number;
  subtotal: number;
}

interface CartData {
  id: number;
  items: CartItem[];
  total_price: number;
  total_items: number;
}

interface CartStore {
  cart: CartData | null;
  cartCount: number;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  cart: null,
  cartCount: 0,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.get('/cart/');
      set({ cart: data, cartCount: data.total_items || 0 });
    } catch (error) {
      console.error('Failed to fetch cart', error);
      set({ cart: null, cartCount: 0 });
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (productId: number, quantity: number = 1) => {
    try {
      const { data } = await apiClient.post('/cart/add/', {
        product_id: productId,
        quantity
      });
      set({ cart: data, cartCount: data.total_items || 0 });
      return data;
    } catch (error: unknown) {
      console.error('Failed to add item to cart', error);
      throw error;
    }
  },

  updateQuantity: async (itemId: number, quantity: number) => {
    try {
      const { data } = await apiClient.patch(`/cart/item/${itemId}/`, { quantity });
      set({ cart: data, cartCount: data.total_items || 0 });
      return data;
    } catch (error: unknown) {
      console.error('Failed to update cart item quantity', error);
      throw error;
    }
  },

  removeItem: async (itemId: number) => {
    try {
      const { data } = await apiClient.delete(`/cart/item/${itemId}/`);
      set({ cart: data, cartCount: data.total_items || 0 });
      return data;
    } catch (error: unknown) {
      console.error('Failed to remove cart item', error);
      throw error;
    }
  },

  clearCart: () => {
    set({ cart: null, cartCount: 0 });
  }
}));
