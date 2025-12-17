import React from 'react';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';
import { toast } from 'react-toastify';
import AccountSidebar from '../../components/layout/AccountSidebar';
import { useWishlist, useToggleWishlist } from '../../hooks/useWishlist';
import { useAddToCart } from '../../hooks/useCart';
import { Button } from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

const WishlistPage: React.FC = () => {
  const { data: wishlist, isLoading, error } = useWishlist();
  const { mutate: toggleWishlist } = useToggleWishlist();
  const { mutate: addToCart } = useAddToCart();

  const handleRemove = (productId: number) => {
    toggleWishlist(productId, {
      onSuccess: () => toast.success('Removed from wishlist'),
      onError: () => toast.error('Failed to remove'),
    });
  };

  const handleMoveToCart = (productId: number) => {
    addToCart({ product_id: productId, quantity: 1 }, {
      onSuccess: () => {
        toast.success('Added to cart');
        toggleWishlist(productId);
      },
      onError: () => toast.error('Failed to add to cart'),
    });
  };

  const items = wishlist?.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <AccountSidebar />
        </aside>
        <main className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Wishlist</h1>

          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600">Failed to load wishlist. Please login or try again.</p>
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Your wishlist is empty"
              description="Save items you love for later!"
              actionText="Browse Products"
              actionLink="/shop"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item: any) => {
                const product = item.product || item;
                return (
                <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition group relative">
                  <div className="h-48 p-4 flex items-center justify-center bg-gray-50">
                    <img src={product.feature_image || ''} alt={product.name} className="h-full w-full object-contain mix-blend-multiply" />
                  </div>
                  
                  <button 
                    onClick={() => handleRemove(product.id)}
                    className="absolute top-3 right-3 p-2 bg-white/80 rounded-full text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-blue-600 font-bold mt-1">${product.price}</p>
                    
                    <Button 
                      onClick={() => handleMoveToCart(product.id)}
                      className="w-full mt-4 text-sm"
                      size="sm"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" /> Move to Cart
                    </Button>
                  </div>
                </div>
              );})}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default WishlistPage;