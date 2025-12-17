import apiClient from '../lib/apiClient';
import type {
  User,
  Product,
  Category,
  Cart,
  CartItem,
  Order,
  Address,
  Review,
  SellerProfile,
  Wallet,
  WalletTransaction,
  Withdrawal,
  ReturnRequest,
} from '../types/models';

// ==================== AUTH ====================
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/accounts/login/', { email, password }),
  
  register: (data: { email: string; password: string; first_name: string; last_name: string; phone_number: string }) =>
    apiClient.post('/accounts/register/', data),
  
  logout: () => apiClient.post('/accounts/logout/'),
  
  refreshToken: (refresh: string) =>
    apiClient.post('/accounts/token/refresh/', { refresh }),
  
  forgotPassword: (email: string) =>
    apiClient.post('/accounts/password-reset/', { email }),
  
  resetPassword: (token: string, password: string) =>
    apiClient.post('/accounts/password-reset-confirm/', { token, password }),
  
  changePassword: (old_password: string, new_password: string) =>
    apiClient.post('/accounts/change-password/', { old_password, new_password }),
  
  getProfile: () => apiClient.get<User>('/accounts/profile/'),
  
  updateProfile: (data: Partial<User>) =>
    apiClient.patch<User>('/accounts/profile/', data),
};

// ==================== PRODUCTS ====================
export const productAPI = {
  list: (params?: { category?: string; search?: string; min_price?: number; max_price?: number; page?: number }) =>
    apiClient.get<{ results: Product[]; count: number }>('/catalog/products/', { params }),
  
  get: (slug: string) =>
    apiClient.get<Product>(`/catalog/products/${slug}/`),
  
  create: (data: FormData) =>
    apiClient.post<Product>('/catalog/products/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  update: (slug: string, data: FormData) =>
    apiClient.patch<Product>(`/catalog/products/${slug}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  delete: (slug: string) =>
    apiClient.delete(`/catalog/products/${slug}/`),
  
  bulkUpload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/catalog/products/bulk-upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ==================== CATEGORIES ====================
export const categoryAPI = {
  list: () => apiClient.get<Category[]>('/catalog/categories/'),
  get: (id: number) => apiClient.get<Category>(`/catalog/categories/${id}/`),
};

// ==================== CART ====================
export const cartAPI = {
  get: () => apiClient.get<Cart>('/cart/'),
  
  addItem: (product_id: number, quantity: number = 1) =>
    apiClient.post<Cart>('/cart/add/', { product_id, quantity }),
  
  updateItem: (itemId: number, quantity: number) =>
    apiClient.patch<Cart>(`/cart/item/${itemId}/`, { quantity }),
  
  removeItem: (itemId: number) =>
    apiClient.delete(`/cart/item/${itemId}/`),
  
  clear: () => apiClient.delete('/cart/'),
};

// ==================== ORDERS ====================
export const orderAPI = {
  list: (params?: { status?: string; page?: number }) =>
    apiClient.get<{ results: Order[]; count: number }>('/orders/', { params }),
  
  get: (id: number) =>
    apiClient.get<Order>(`/orders/${id}/`),
  
  create: (data: { address_id: number; payment_method: string }) =>
    apiClient.post<Order>('/orders/checkout/', data),
  
  cancel: (id: number) =>
    apiClient.post(`/orders/${id}/cancel/`),
  
  track: (orderId: string) =>
    apiClient.get(`/orders/${orderId}/track/`),
};

// ==================== ADDRESSES ====================
export const addressAPI = {
  list: () => apiClient.get<Address[]>('/accounts/addresses/'),
  
  get: (id: number) =>
    apiClient.get<Address>(`/accounts/addresses/${id}/`),
  
  create: (data: Omit<Address, 'id' | 'user' | 'created_at' | 'updated_at'>) =>
    apiClient.post<Address>('/accounts/addresses/', data),
  
  update: (id: number, data: Partial<Address>) =>
    apiClient.patch<Address>(`/accounts/addresses/${id}/`, data),
  
  delete: (id: number) =>
    apiClient.delete(`/accounts/addresses/${id}/`),
  
  setDefault: (id: number) =>
    apiClient.post(`/accounts/addresses/${id}/set-default/`),
};

// ==================== WISHLIST ====================
export const wishlistAPI = {
  list: () => apiClient.get('/wishlist/'),
  
  toggle: (product_id: number) =>
    apiClient.post('/wishlist/toggle/', { product_id }),
  
  check: (product_id: number) =>
    apiClient.get(`/wishlist/check/${product_id}/`),
};

// ==================== REVIEWS ====================
export const reviewAPI = {
  list: (productId: number) =>
    apiClient.get<Review[]>(`/reviews/?product=${productId}`),
  
  create: (data: { product: number; rating: number; comment: string }) =>
    apiClient.post<Review>('/reviews/', data),
  
  update: (id: number, data: Partial<Review>) =>
    apiClient.patch<Review>(`/reviews/${id}/`, data),
  
  delete: (id: number) =>
    apiClient.delete(`/reviews/${id}/`),
  
  markHelpful: (id: number) =>
    apiClient.post(`/reviews/${id}/helpful/`),
};

// ==================== SELLER ====================
export const sellerAPI = {
  register: (data: { business_name: string; business_email: string; phone_number: string; address: string; city: string; state: string; pincode: string; gstin?: string }) =>
    apiClient.post('/sellers/register/', data),
  
  getProfile: () =>
    apiClient.get<SellerProfile>('/sellers/profile/'),
  
  updateProfile: (data: Partial<SellerProfile>) =>
    apiClient.patch<SellerProfile>('/sellers/profile/', data),
  
  getDashboard: () =>
    apiClient.get('/sellers/dashboard/'),
  
  getProducts: (params?: { page?: number; search?: string }) =>
    apiClient.get<{ results: Product[]; count: number }>('/sellers/products/', { params }),
  
  getOrders: (params?: { status?: string; page?: number }) =>
    apiClient.get('/sellers/orders/', { params }),
  
  updateOrderStatus: (orderId: number, status: string) =>
    apiClient.patch(`/sellers/orders/${orderId}/`, { status }),
};

// ==================== WALLET ====================
export const walletAPI = {
  get: () =>
    apiClient.get<Wallet>('/wallet/'),
  
  getTransactions: (params?: { page?: number }) =>
    apiClient.get<{ results: WalletTransaction[]; count: number }>('/wallet/transactions/', { params }),
  
  requestWithdrawal: (amount: number) =>
    apiClient.post<Withdrawal>('/wallet/withdrawals/', { amount }),
  
  getWithdrawals: (params?: { page?: number }) =>
    apiClient.get<{ results: Withdrawal[]; count: number }>('/wallet/withdrawals/', { params }),
};

// ==================== RETURNS ====================
export const returnAPI = {
  list: (params?: { page?: number }) =>
    apiClient.get<{ results: ReturnRequest[]; count: number }>('/returns/', { params }),
  
  get: (id: number) =>
    apiClient.get<ReturnRequest>(`/returns/${id}/`),
  
  create: (data: { order_item_id: number; reason: string; description: string; images?: File[] }) => {
    const formData = new FormData();
    formData.append('order_item_id', data.order_item_id.toString());
    formData.append('reason', data.reason);
    formData.append('description', data.description);
    if (data.images) {
      data.images.forEach((img, idx) => formData.append(`image_${idx}`, img));
    }
    return apiClient.post<ReturnRequest>('/returns/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  cancel: (id: number) =>
    apiClient.post(`/returns/${id}/cancel/`),
};

// ==================== PAYMENTS ====================
export const paymentAPI = {
  createOrder: (orderId: number) =>
    apiClient.post('/payments/create-order/', { order_id: orderId }),
  
  verifyPayment: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    apiClient.post('/payments/verify/', data),
};

// ==================== SHIPPING ====================
export const shippingAPI = {
  getRates: (orderId: number) =>
    apiClient.get(`/shipping/rates/${orderId}/`),
  
  createShipment: (orderId: number) =>
    apiClient.post(`/shipping/create/${orderId}/`),
  
  trackShipment: (awb: string) =>
    apiClient.get(`/shipping/track/${awb}/`),
};
