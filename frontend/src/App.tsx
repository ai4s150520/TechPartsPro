import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- LAYOUTS ---
import Layout from './components/layout/Layout';
import SellerLayout from './components/seller/SellerLayout';

// --- GLOBAL UI ---
import ToastContainer from './components/ui/ToastContainer';
import NotFoundPage from './pages/NotFoundPage';

// --- AUTH GUARDS ---
import RequireAuth from './components/auth/RequireAuth';
import PublicOnly from './components/auth/PublicOnly';

// --- PAGES: PUBLIC / SHOP ---
import HomePage from './pages/HomePage';
import ProductsPage from './pages/shop/ProductsPage';
import ProductDetailPage from './pages/shop/ProductDetailPage';
import CartPage from './pages/shop/CartPage';

// --- PAGES: AUTH ---
import CustomerLoginPage from './pages/auth/CustomerLoginPage';
import CustomerRegisterPage from './pages/auth/CustomerRegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

// --- PAGES: ACCOUNT (CUSTOMER) ---
import AccountOverviewPage from './pages/account/AccountOverviewPage';
import ProfilePage from './pages/account/ProfilePage';
import AddressesPage from './pages/account/AddressesPage';
import OrdersPage from './pages/account/OrdersPage';
import OrderDetailPage from './pages/account/OrderDetailPage';
import OrderTrackingPage from './pages/account/OrderTrackingPage';
import WishlistPage from './pages/account/WishlistPage';
import ChangePasswordPage from './pages/account/ChangePasswordPage';

// --- PAGES: CHECKOUT ---
import CheckoutPage from './pages/shop/CheckoutPage';
import OrderSuccessPage from './pages/shop/OrderSuccessPage';

// --- PAGES: SELLER ---
import SellerLoginPage from './pages/seller/SellerLoginPage';
import SellerRegisterPage from './pages/seller/SellerRegisterPage';
import SellOnlinePage from './pages/seller/SellOnlinePage';
import SellerHomePage from './pages/seller/SellerHomePage';
import SellerDashboardPage from './pages/seller/SellerDashboardPage';
import SellerProductsPage from './pages/seller/SellerProductsPage';
import SellerNewProductPage from './pages/seller/SellerNewProductPage';
import SellerEditProductPage from './pages/seller/SellerEditProductPage';
import SellerOrdersPage from './pages/seller/SellerOrdersPage';
import SellerPayoutsPage from './pages/seller/SellerPayoutsPage';
import SellerBulkUploadPage from './pages/seller/SellerBulkUploadPage';
import SellerProfilePage from './pages/seller/SellerProfilePage';
import SellerChangePasswordPage from './pages/seller/SellerChangePasswordPage';


// --- PAGES: INFO & LEGAL ---
import AboutPage from './pages/info/AboutPage';
import ContactPage from './pages/info/ContactPage';
import HelpPage from './pages/info/HelpPage';
import TermsPage from './pages/legal/TermsPage';
import PrivacyPage from './pages/legal/PrivacyPage';
import RefundsPage from './pages/legal/RefundsPage';

function App() {
  return (
    <Router>
      {/* Global Toast Notifications (Overlay) */}
      <ToastContainer />

      <Routes>
        
        {/* =========================================================
            GROUP 1: MAIN SITE LAYOUT (Header + Footer)
        ========================================================= */}
        <Route path="/" element={<Layout />}>
          
          {/* 1.1 Public Routes */}
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ProductsPage />} />
          <Route path="shop/product/:slug" element={<ProductDetailPage />} />
          
          {/* Info Pages */}
          <Route path="info/about" element={<AboutPage />} />
          <Route path="info/contact" element={<ContactPage />} />
          <Route path="info/faq" element={<HelpPage />} />
          
          {/* Legal Pages */}
          <Route path="legal/terms" element={<TermsPage />} />
          <Route path="legal/privacy" element={<PrivacyPage />} />
          <Route path="legal/returns" element={<RefundsPage />} />

          {/* Seller Landing (Public) */}
          <Route path="sell-online" element={<SellOnlinePage />} />

          {/* 1.2 Guest Only Routes (Login/Register) 
              Redirects to Dashboard if already logged in */}
          <Route element={<PublicOnly />}>
            <Route path="auth/login" element={<CustomerLoginPage />} />
            <Route path="auth/register" element={<CustomerRegisterPage />} />
            <Route path="auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="verify-email" element={<VerifyEmailPage />} />
            
            {/* Seller Auth */}
            <Route path="seller/login" element={<SellerLoginPage />} />
            <Route path="seller/register" element={<SellerRegisterPage />} />
          </Route>

          {/* 1.3 Protected Customer Routes 
              Requires Role: CUSTOMER or ADMIN */}
          <Route element={<RequireAuth allowedRoles={['CUSTOMER', 'ADMIN']} />}>
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="order-success" element={<OrderSuccessPage />} />
            
            {/* Account Dashboard Group */}
            <Route path="account">
              <Route index element={<AccountOverviewPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="addresses" element={<AddressesPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="orders/:orderId/track" element={<OrderTrackingPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
              <Route path="change-password" element={<ChangePasswordPage />} />
            </Route>
          </Route>

        </Route> {/* End Main Layout */}


        {/* =========================================================
            GROUP 2: SELLER PORTAL LAYOUT (Sidebar + Topbar)
            Requires Role: SELLER
        ========================================================= */}
        <Route element={<RequireAuth allowedRoles={['SELLER']} />}>
          <Route element={<SellerLayout />}>
            
            <Route path="seller/home" element={<SellerHomePage />} />
            <Route path="seller/dashboard" element={<SellerDashboardPage />} />
            
            {/* Product Management */}
            <Route path="seller/products" element={<SellerProductsPage />} />
            <Route path="seller/products/new" element={<SellerNewProductPage />} />
            <Route path="seller/products/edit/:slug" element={<SellerEditProductPage />} />

            <Route path="seller/bulk-upload" element={<SellerBulkUploadPage />} />
            
            {/* Order Fulfillment */}
            <Route path="seller/orders" element={<SellerOrdersPage />} />
            
            {/* Finance */}
            <Route path="seller/payouts" element={<SellerPayoutsPage />} />
            
            {/* Profile */}
            <Route path="seller/profile" element={<SellerProfilePage />} />
            <Route path="seller/change-password" element={<SellerChangePasswordPage />} />
            
            {/* Redirect root seller path to home */}
            <Route path="seller" element={<Navigate to="/seller/home" replace />} />
            
          </Route>
        </Route>


        {/* =========================================================
            GROUP 3: FALLBACKS
        ========================================================= */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />

      </Routes>
    </Router>
  );
}

export default App;