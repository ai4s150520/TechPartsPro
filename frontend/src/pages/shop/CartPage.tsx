import React from 'react';
import { Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCart, useUpdateCartItem, useRemoveCartItem } from '../../hooks/useCart';
import CartSummary from '../../components/cart/CartSummary';
import { formatPrice } from '../../lib/formatters';
import EmptyState from '../../components/ui/EmptyState';

// --- HELPER: Fix Image URLs ---
const getImageUrl = (path: string | null | undefined) => {
    if (!path) return 'https://placehold.co/300x300?text=No+Img';
    
    // If it's already a complete URL (e.g. from Cloudinary), return it
    if (path.startsWith('http')) return path;

    // Logic: Get the base URL (http://127.0.0.1:8000) from VITE_API_URL (http://127.0.0.1:8000/api)
    // We remove the '/api' suffix to point to the root where /media lives
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const rootUrl = apiBase.replace(/\/api\/?$/, ''); // Removes trailing '/api'
    
    // Ensure path has leading slash
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${rootUrl}${cleanPath}`;
};

const CartPage: React.FC = () => {
  const { data: cart, isLoading, error } = useCart();
  const { mutate: updateQty } = useUpdateCartItem();
  const { mutate: removeFromCart } = useRemoveCartItem();

  // Debug logging
  console.log('=== CART PAGE DEBUG ===');
  console.log('Cart data:', cart);
  console.log('Cart items:', cart?.items);
  console.log('Items length:', cart?.items?.length);
  console.log('Error:', error);
  console.log('isLoading:', isLoading);

  const handleUpdateQuantity = (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    updateQty({ itemId, quantity }, {
      onError: () => toast.error('Failed to update quantity')
    });
  };

  const handleRemove = (itemId: number) => {
    removeFromCart(itemId, {
      onSuccess: () => toast.success('Item removed from cart'),
      onError: () => toast.error('Failed to remove item')
    });
  };

  if (isLoading) return <div className="p-10 text-center">Loading Cart...</div>;
  
  if (error) {
    console.error('Cart loading error:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Failed to load cart. Please login or try again.</p>
        </div>
      </div>
    );
  }

  // Ensure cart data exists and has items array
  if (!cart) {
    console.warn('Cart is null or undefined');
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet. Start shopping to fill it up!"
          actionText="Start Shopping"
          actionLink="/shop"
        />
      </div>
    );
  }

  const cartData = cart || {};
  const items = cartData.items || [];

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet. Start shopping to fill it up!"
          actionText="Start Shopping"
          actionLink="/shop"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="w-24 h-24 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                
                {/* --- FIX APPLIED HERE: Wrapped image path with getImageUrl() --- */}
                <img 
                  src={getImageUrl(item.product.feature_image)} 
                  alt={item.product.name} 
                  className="max-h-full max-w-full object-contain mix-blend-multiply" 
                />
                
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{item.product.name}</h3>
                {item.product.discount_percentage > 0 && (
                  <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded mt-1">
                    {item.product.discount_percentage}% OFF
                  </span>
                )}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center border border-gray-300 rounded-lg h-9">
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="w-8 h-full flex items-center justify-center hover:bg-gray-100">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="w-8 h-full flex items-center justify-center hover:bg-gray-100">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => handleRemove(item.id)} className="text-sm text-red-500 hover:underline flex items-center">
                    <Trash2 className="w-4 h-4 mr-1" /> Remove
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{formatPrice(item.subtotal)}</p>
                {item.product.discount_price && (
                  <p className="text-xs text-gray-400 line-through">{formatPrice(item.product.price * item.quantity)}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">{formatPrice(item.product.discount_price || item.product.price)} / unit</p>
                {item.product.tax_rate > 0 && (
                  <p className="text-xs text-green-600 mt-1">+GST {item.product.tax_rate}%</p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Cart Summary */}
        <div className="lg:w-96 shrink-0">
          <CartSummary 
            subtotal={cartData.total_price || 0} 
            taxTotal={cartData.total_tax || 0} 
            grandTotal={cartData.grand_total || cartData.total_price || 0} 
            totalItems={cartData.total_items || 0} 
          />
        </div>
      </div>
    </div>
  );
};

export default CartPage;