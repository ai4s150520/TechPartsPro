import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import apiClient from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import { formatPrice } from '../../lib/formatters'; 

// Updated Interface to match new backend response
interface CartSummaryProps {
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  totalItems: number;
  onCheckout?: () => void;
}

const CartSummary: React.FC<CartSummaryProps> = ({ subtotal, taxTotal, grandTotal, totalItems, onCheckout }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  
  const [isApplying, setIsApplying] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Shipping Logic (Can be dynamic based on grandTotal)
  const shippingCost = grandTotal > 1000 ? 0 : 100.00; // Free shipping > ₹1000
  
  // Recalculate Final Total on Frontend just for display (Backend handles actual total)
  const finalPayable = grandTotal - discountAmount + shippingCost;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsApplying(true);
    setCouponMsg(null);

    try {
      const response = await apiClient.post('/coupons/apply/', {
        code: couponCode,
        cart_total: subtotal // Send subtotal for validation
      });

      setDiscountAmount(response.data.discount_amount);
      setAppliedCoupon(response.data.code);
      setCouponMsg({ type: 'success', text: `Coupon applied! You saved ${formatPrice(response.data.discount_amount)}` });
      
    } catch (error: any) {
      const errorText = error.response?.data?.message || 
                        error.response?.data?.non_field_errors?.[0] || 
                        "Invalid Coupon Code";
      setCouponMsg({ type: 'error', text: errorText });
      setDiscountAmount(0);
      setAppliedCoupon(null);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setDiscountAmount(0);
    setAppliedCoupon(null);
    setCouponMsg(null);
  };

  const handleCheckoutClick = () => {
    if (totalItems === 0) return;

    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: '/checkout' } });
    } else {
      if (onCheckout) onCheckout();
      navigate('/checkout');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

      <div className="space-y-3 text-sm text-gray-600 mb-6">
        <div className="flex justify-between">
          <span>Subtotal (Excl. Tax)</span>
          <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Total GST</span>
          <span className="font-medium text-gray-900">{formatPrice(taxTotal)}</span>
        </div>

        <div className="flex justify-between">
          <span>Shipping Estimate</span>
          {shippingCost === 0 ? (
             <span className="text-green-600 font-medium">Free</span>
          ) : (
             <span className="font-medium text-gray-900">{formatPrice(shippingCost)}</span>
          )}
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({appliedCoupon})</span>
            <span className="font-bold">-{formatPrice(discountAmount)}</span>
          </div>
        )}

        <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
          <span className="text-base font-bold text-gray-900">Total Payable</span>
          <span className="text-xl font-bold text-blue-600">{formatPrice(finalPayable)}</span>
        </div>
        
        <p className="text-xs text-gray-400 mt-1 text-right">Inclusive of all taxes</p>
      </div>

      <div className="mb-6">
        {!appliedCoupon ? (
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Tag className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Promo Code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              />
            </div>
            <button 
              onClick={handleApplyCoupon}
              disabled={isApplying || !couponCode}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
            </button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Coupon {appliedCoupon} applied</span>
            </div>
            <button 
              onClick={handleRemoveCoupon}
              className="text-xs text-red-500 hover:text-red-700 font-medium underline"
            >
              Remove
            </button>
          </div>
        )}

        {couponMsg && !appliedCoupon && (
          <div className={`mt-2 text-xs flex items-center gap-1 ${
            couponMsg.type === 'error' ? 'text-red-600' : 'text-green-600'
          }`}>
            {couponMsg.type === 'error' && <AlertCircle className="w-3 h-3" />}
            {couponMsg.text}
          </div>
        )}
      </div>

      <Button 
        onClick={handleCheckoutClick}
        disabled={totalItems === 0}
        className="w-full py-3 text-base flex justify-center items-center gap-2 shadow-blue-200"
      >
        Proceed to Checkout
        <ArrowRight className="w-5 h-5" />
      </Button>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Secure Encrypted Checkout</span>
      </div>
    </div>
  );
};

export default CartSummary;