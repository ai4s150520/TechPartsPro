import React from 'react';
import { ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
// 1. Import centralized formatter
import { formatPrice } from '../../lib/utils';

// Types representing the structure from our Backend Cart/Order
interface CheckoutItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface OrderSummaryProps {
  items: CheckoutItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  isLoading?: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  discount,
  shippingCost,
  taxAmount,
  total,
  isLoading = false
}) => {
  // Mobile: Collapsible state for order summary
  const [isOpen, setIsOpen] = React.useState(false);

  // Removed local formatMoney helper in favor of centralized formatPrice

  return (
    <div className="bg-gray-50 md:bg-white rounded-xl md:shadow-sm md:border border-gray-100 overflow-hidden sticky top-24">
      
      {/* MOBILE HEADER (Collapsible) */}
      <div className="md:hidden border-b border-gray-200 p-4 bg-gray-50 flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-2 text-blue-600 font-medium">
          <ShoppingBag className="w-5 h-5" />
          <span>{isOpen ? 'Hide' : 'Show'} Order Summary</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
        <span className="font-bold text-lg text-gray-900">{formatPrice(total)}</span>
      </div>

      {/* CONTENT (Always visible on Desktop, toggled on Mobile) */}
      <div className={clsx("md:block p-6 transition-all duration-300 ease-in-out", {
        "hidden": !isOpen,
        "block": isOpen
      })}>
        <h2 className="hidden md:block text-lg font-bold text-gray-900 mb-6">Your Order</h2>

        {/* 1. Items List */}
        <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 items-start">
              {/* Product Image with Badge */}
              <div className="relative w-16 h-16 bg-white border border-gray-200 rounded-md flex-shrink-0 p-1">
                <img 
                  src={item.product_image || 'https://placehold.co/100x100?text=No+Img'} 
                  alt={item.product_name}
                  className="w-full h-full object-contain"
                />
                <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                  {item.quantity}
                </span>
              </div>

              {/* Details */}
              <div className="flex-grow flex flex-col justify-center">
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2" title={item.product_name}>
                  {item.product_name}
                </h4>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  <p className="text-sm font-medium text-gray-700">{formatPrice(item.subtotal)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Separator */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* 2. Financial Logic Breakdown */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
          </div>

          <div className="flex justify-between text-gray-600">
            <span>Shipping</span>
            {shippingCost === 0 ? (
              <span className="text-sm text-gray-500">Calculated at next step</span>
            ) : (
              <span className="font-medium text-gray-900">{formatPrice(shippingCost)}</span>
            )}
          </div>

          <div className="flex justify-between text-gray-600">
            <span>Tax (GST 18%)</span>
            <span className="font-medium text-gray-900">{formatPrice(taxAmount)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span className="font-bold">-{formatPrice(discount)}</span>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* 3. Total */}
        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-gray-900">Total</span>
          <div className="flex items-end flex-col">
            <span className="text-sm text-gray-500 mb-0.5">INR</span>
            <span className="text-2xl font-bold text-blue-600 tracking-tight">
              {isLoading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                formatPrice(total)
              )}
            </span>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[10px] text-gray-400">
          <div className="flex flex-col items-center">
             <div className="w-8 h-8 rounded-full bg-gray-100 mb-1 flex items-center justify-center">🛡️</div>
             <span>Buyer Protection</span>
          </div>
          <div className="flex flex-col items-center">
             <div className="w-8 h-8 rounded-full bg-gray-100 mb-1 flex items-center justify-center">🔒</div>
             <span>SSL Encrypted</span>
          </div>
          <div className="flex flex-col items-center">
             <div className="w-8 h-8 rounded-full bg-gray-100 mb-1 flex items-center justify-center">↩️</div>
             <span>Easy Returns</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderSummary;