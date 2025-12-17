/**
 * models.ts
 * Definitions mirroring Django Backend Models.
 * Used for strict typing of data entities.
 */

// --- 1. AUTHENTICATION & USERS ---

export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  name: string; // Computed field from serializer
  role: UserRole;
  phone_number?: string;
  is_verified: boolean;
  avatar?: string;
  date_joined: string; // ISO Date String
}

export interface Address {
  id: number;
  user?: number; // ID reference
  full_name: string;
  phone_number: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  title: 'HOME' | 'OFFICE' | 'WAREHOUSE' | 'OTHER';
  is_default: boolean;
}

export interface SellerProfile {
  id: number;
  user: number; // User ID
  business_name: string;
  gst_number: string;
  pan_number?: string;
  warehouse_address?: string;
  is_approved: boolean;
  rating: number;
  total_sales: number;
}

// --- 2. CATALOG (PRODUCTS) ---

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent?: number | null; // ID of parent category
  image?: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo?: string;
}

export interface ProductImage {
  id: number;
  image: string; // URL
  is_feature: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string;
  category: number; // ID
  category_name?: string; // Read-only from serializer
  brand?: number;
  
  price: number; // Decimal as number in JS
  discount_price?: number | null;
  stock_quantity: number;
  
  images: ProductImage[];
  feature_image?: string | null; // Computed property
  
  // JSON Field in Backend
  specifications: Record<string, string>; 
  
  // Seller Info
  seller: number;
  seller_name?: string;
  
  rating: number;
  review_count: number;
  
  is_active: boolean;
  created_at: string;
}

// --- 3. CART ---

export interface CartItem {
  id: number;
  product: Product; // Nested serializer
  product_id?: number; // For write operations
  quantity: number;
  subtotal: number;
}

export interface Cart {
  id: number;
  user: number;
  items: CartItem[];
  total_price: number;
  total_items: number;
  updated_at: string;
}

// --- 4. ORDERS ---

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export type PaymentMethod = 'CARD' | 'COD' | 'UPI';

export interface OrderItem {
  id: number;
  product_name: string; // Snapshot
  product_details?: Product; // Optional link to live product
  price: number; // Snapshot
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string; // UUID
  order_id: string; // Readable ID (ORD-123)
  user: number;
  
  status: OrderStatus;
  payment_status: boolean;
  payment_method: PaymentMethod;
  
  total_amount: number;
  discount_amount: number;
  
  // Address Snapshot
  shipping_address: {
    full_name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
  };
  
  items: OrderItem[];
  tracking_number?: string;
  courier_name?: string;
  created_at: string;
}

// --- 5. REVIEWS ---

export interface Review {
  id: number;
  user_name: string;
  product: number;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  images: { id: number; image: string }[];
  created_at: string;
}

// --- 6. SELLER DASHBOARD ---

export type PayoutStatus = 'REQUESTED' | 'PROCESSING' | 'PAID' | 'REJECTED';

export interface Payout {
  id: number;
  amount: number;
  status: PayoutStatus;
  created_at: string;
  transaction_reference?: string;
  admin_note?: string;
}

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  total_products: number;
  pending_payouts: number;
}

// --- 7. WALLET SYSTEM ---

export interface Wallet {
  id: number;
  user_email: string;
  balance: number;
  is_active: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'CREDIT' | 'DEBIT';
export type TransactionSource = 'ORDER_PAYMENT' | 'ORDER_REFUND' | 'WITHDRAWAL' | 'COMMISSION' | 'ADJUSTMENT';

export interface WalletTransaction {
  id: number;
  transaction_type: TransactionType;
  source: TransactionSource;
  amount: number;
  balance_before: number;
  balance_after: number;
  order_id?: string;
  description: string;
  created_at: string;
}

export type WithdrawalStatus = 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED';

export interface Withdrawal {
  id: number;
  amount: number;
  bank_account_number: string;
  bank_ifsc_code: string;
  bank_account_holder: string;
  bank_name?: string;
  status: WithdrawalStatus;
  razorpay_payout_id?: string;
  utr_number?: string;
  rejection_reason?: string;
  requested_at: string;
  processed_at?: string;
}

// --- 8. RETURN & EXCHANGE SYSTEM ---

export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PICKUP_SCHEDULED' | 'IN_TRANSIT' | 'RECEIVED' | 'INSPECTED' | 'COMPLETED' | 'CANCELLED';
export type ReturnReason = 'DEFECTIVE' | 'WRONG_ITEM' | 'NOT_AS_DESCRIBED' | 'SIZE_ISSUE' | 'QUALITY_ISSUE' | 'CHANGED_MIND' | 'BETTER_PRICE' | 'OTHER';
export type ReturnType = 'RETURN' | 'EXCHANGE';
export type InspectionResult = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PARTIAL';

export interface ReturnItem {
  id: number;
  order_item: number;
  product_name: string;
  product_price: number;
  quantity: number;
  reason: ReturnReason;
  is_approved: boolean;
  refund_amount: number;
}

export interface ReturnRequest {
  id: number;
  order: string;
  order_id: string;
  customer_email: string;
  seller_email: string;
  request_type: ReturnType;
  reason: ReturnReason;
  description: string;
  images: string[];
  video_url?: string;
  status: ReturnStatus;
  seller_response?: string;
  rejection_reason?: string;
  inspection_result: InspectionResult;
  inspection_notes?: string;
  return_tracking_number?: string;
  refund_amount: number;
  shipping_charge: number;
  exchange_product?: number;
  exchange_tracking_number?: string;
  is_flagged: boolean;
  fraud_score: number;
  items: ReturnItem[];
  created_at: string;
  updated_at: string;
}