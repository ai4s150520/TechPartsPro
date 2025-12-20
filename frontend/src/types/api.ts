/**
 * api.ts
 * Definitions for API Responses and Payloads.
 * Used in Services and Components.
 */

import type { User, Product, Order, Review, Payout, Address } from './models';

// --- GENERIC API RESPONSES ---

/**
 * Standard Django Rest Framework Paginated Response
 * { count: 100, next: "url...", previous: null, results: [...] }
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ErrorResponse {
  status: 'error';
  code: number;
  message: string;
  detail?: string; // DRF specific
  errors?: Record<string, string[]>; // Field validation errors
}

// --- AUTH PAYLOADS ---

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  refresh: string;
  access: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: 'CUSTOMER' | 'SELLER';
  // Optional Seller Fields
  business_name?: string;
  gst_number?: string;
  phone_number?: string;
}

// --- CATALOG PAYLOADS ---

export interface ProductFilterParams {
  page?: number;
  search?: string;
  category?: string; // slug
  price_min?: string;
  price_max?: string;
  ordering?: string; // e.g. '-created_at'
}

// --- CART & CHECKOUT PAYLOADS ---

export interface AddToCartRequest {
  product_id: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CheckoutRequest {
  address_id: number;
  payment_method: string;
  shipping_method_id?: number;
}

// --- SHIPPING PAYLOADS ---

export interface ShippingRateRequest {
  pincode: string;
  weight: number;
}

export interface ShippingMethodResponse {
  id: number;
  name: string;
  total_cost: number;
  estimated_delivery_days_min: number;
  estimated_delivery_days_max: number;
}

// --- SELLER PAYLOADS ---

export interface RequestPayoutRequest {
  amount: number;
}

export type UpdateProductRequest = Partial<Omit<Product, 'id' | 'seller' | 'created_at'>>;
// Use Partial because patches might only update price. Images handled via FormData separately.