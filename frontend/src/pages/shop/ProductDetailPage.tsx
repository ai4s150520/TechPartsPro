import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Check, Truck, Shield, MapPin, Store, Star, Share2, Plus, Minus } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../lib/apiClient';
import { useAddToCart } from '../../hooks/useCart';
import { useToggleWishlist, useCheckWishlist } from '../../hooks/useWishlist';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import ReviewList from '../../components/product/ReviewList';
import { formatPrice } from '../../lib/formatters';
import ImageZoom from '../../components/ui/ImageZoom';
import Breadcrumb from '../../components/ui/Breadcrumb';

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();
  const [product, setProduct] = useState<any>(null);
  
  const { mutate: toggleWishlist } = useToggleWishlist();
  const { data: wishlistCheck } = useCheckWishlist(product?.id || 0);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [qty, setQty] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    apiClient.get(`/catalog/products/${slug}/`)
      .then(res => {
        setProduct(res.data);
        const feat = res.data.images.find((img: any) => img.is_feature);
        setSelectedImage(feat ? feat.image : res.data.images[0]?.image);
      })
      .catch(() => navigate('/404'))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  useEffect(() => {
    if (wishlistCheck?.data?.is_wishlisted !== undefined) {
      setIsInWishlist(wishlistCheck.data.is_wishlisted);
    }
  }, [wishlistCheck]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.info('Please login to add items to cart');
      navigate('/auth/login', { state: { from: window.location.pathname } });
      return;
    }
    addToCart({ product_id: product.id, quantity: qty }, {
      onSuccess: () => toast.success(`${product.name} added to cart!`),
      onError: () => toast.error('Failed to add to cart'),
    });
  };

  const handleToggleWishlist = () => {
    if (!isAuthenticated) {
      toast.info('Please login to add to wishlist');
      navigate('/auth/login', { state: { from: window.location.pathname } });
      return;
    }
    
    toggleWishlist(product.id, {
      onSuccess: (response) => {
        const action = response.data.action;
        setIsInWishlist(action === 'added');
        toast.success(action === 'added' ? 'Added to wishlist' : 'Removed from wishlist');
      },
    });
  };

  const scrollToReviews = () => {
    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) return <div className="p-20 text-center">Loading Product...</div>;
  if (!product) return null;

  const isOutOfStock = product.stock_quantity < 1;

  // Helper for Rating Logic
  const RatingDisplay = () => {
    if (!product.review_count || product.review_count === 0) {
      return <span className="text-sm text-gray-400 font-medium">No ratings yet</span>;
    }
    return (
      <div 
        onClick={scrollToReviews} 
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 -ml-1 rounded transition w-fit"
      >
        <div className="flex text-yellow-400">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`w-4 h-4 ${i < Math.round(product.rating) ? 'fill-current' : 'text-gray-300'}`} 
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-700 underline decoration-gray-300 underline-offset-2">
          {parseFloat(product.rating).toFixed(1)} 
          <span className="text-gray-500 font-normal ml-1">({product.review_count} Reviews)</span>
        </span>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Breadcrumb items={[
        { label: 'Shop', path: '/shop' },
        { label: product.category_name || 'Products', path: `/shop?category=${product.category_name}` },
        { label: product.name }
      ]} />
      {/* Main Grid: Images (Left) | Details (Middle) | Seller (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        
        {/* 1. Image Gallery (Left - 4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 h-[400px] flex items-center justify-center overflow-hidden relative shadow-sm">
            <ImageZoom
              src={selectedImage}
              alt={product.name}
              className="max-h-full max-w-full mix-blend-multiply"
            />
            {product.discount_price && (
              <span className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded font-bold shadow-md animate-pulse">
                SALE
              </span>
            )}
          </div>
          {/* Thumbnails */}
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {product.images.map((img: any) => (
              <button 
                key={img.id}
                onClick={() => setSelectedImage(img.image)}
                className={`w-16 h-16 rounded-lg border-2 flex-shrink-0 bg-white p-1 transition-all overflow-hidden ${
                  selectedImage === img.image ? 'border-blue-600 shadow-md scale-105' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img src={img.image} alt="" className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        </div>

        {/* 2. Product Details (Middle - 5 Cols) */}
        <div className="lg:col-span-5 px-2">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h1>
            <button className="p-2 text-gray-400 hover:text-blue-600 transition bg-gray-50 rounded-full flex-shrink-0">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-4">
            <RatingDisplay />
          </div>

          {/* SKU & Stock Badge */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <span>SKU: <span className="font-mono text-gray-700">{product.sku}</span></span>
            <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>
            <span className={`${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'} font-medium flex items-center`}>
              {product.stock_quantity > 0 ? <Check className="w-4 h-4 mr-1" /> : null} 
              {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {/* Price Block */}
          <div className="mb-8">
            {product.discount_price ? (
              <div className="flex items-end gap-3 flex-wrap">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(product.discount_price)}
                </span>
                <span className="text-lg text-gray-400 line-through mb-1">
                  {formatPrice(product.price)}
                </span>
                <span className="mb-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
                  {Math.round(((product.price - product.discount_price) / product.price) * 100)}% OFF
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
            )}
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-gray-500">Inclusive of all taxes</p>
              {product.tax_rate && (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                  GST {product.tax_rate}%
                </span>
              )}
            </div>
          </div>

          {/* --- RESIZED ACTION BUTTONS (h-10) --- */}
          <div className="flex items-center gap-3 mb-8">
            
            {/* Quantity Selector */}
            <div className="flex items-center border border-gray-300 rounded-lg h-10 bg-white shadow-sm">
              <button 
                onClick={() => setQty(Math.max(1, qty - 1))} 
                className="w-8 h-full hover:bg-gray-50 text-gray-600 rounded-l-lg transition-colors flex items-center justify-center"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input 
                type="number" 
                value={qty} 
                onChange={(e) => setQty(parseInt(e.target.value))} 
                className="w-10 text-center outline-none border-x border-gray-200 text-sm font-semibold text-gray-900 h-full"
                min="1"
                max={product.stock_quantity}
              />
              <button 
                onClick={() => setQty(Math.min(product.stock_quantity, qty + 1))} 
                className="w-8 h-full hover:bg-gray-50 text-gray-600 rounded-r-lg transition-colors flex items-center justify-center"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            
            {/* Add to Cart */}
            <Button 
              size="md" 
              onClick={handleAddToCart} 
              disabled={isOutOfStock || isAddingToCart}
              className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap px-4"
            >
              <ShoppingCart className="w-4 h-4" />
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            
            {/* Wishlist */}
            <button 
              onClick={handleToggleWishlist}
              className={`h-10 w-10 border rounded-lg flex items-center justify-center transition-all shadow-sm ${
                isInWishlist 
                  ? 'bg-red-50 border-red-200 text-red-500' 
                  : 'border-gray-300 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50'
              }`}
            >
              <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
          </div>
          {/* --- END BUTTONS --- */}

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-8">
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-100">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-100">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Warranty</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Specifications</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="space-y-2 text-sm">
                {Object.entries(product.specifications || {}).map(([key, value]: any) => (
                  <div key={key} className="flex justify-between border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                    <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. SELLER INFO CARD (Right - 3 Cols) */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm sticky top-24">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center border-b border-gray-100 pb-3">
              <Store className="w-5 h-5 mr-2 text-orange-500" /> Seller Info
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Sold By</p>
                <p className="text-base font-bold text-blue-600 hover:underline cursor-pointer leading-tight">
                  {product.seller_name || "TechParts Official"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Location</p>
                <div className="flex items-start text-sm text-gray-700">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                  <span className="line-clamp-2">
                    {product.seller_location || "Central Warehouse, India"}
                  </span>
                </div>
              </div>

              {/* Seller Trust Stats */}
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100">
                <div className="text-center bg-gray-50 p-2 rounded border border-gray-100">
                  <p className="text-lg font-bold text-gray-900 flex items-center justify-center">
                    {product.seller_rating ? parseFloat(product.seller_rating).toFixed(1) : "4.8"} 
                    <Star className="w-3 h-3 ml-1 fill-yellow-400 text-yellow-400" />
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Rating</p>
                </div>
                <div className="text-center bg-gray-50 p-2 rounded border border-gray-100">
                  <p className="text-lg font-bold text-gray-900">98%</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">On-Time</p>
                </div>
              </div>

              <div className="text-xs text-gray-400 text-center pt-2">
                Verified Seller since {product.seller_joined ? new Date(product.seller_joined).getFullYear() : '2023'}
              </div>
            </div>

            {/* Warranty Box */}
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-blue-900 text-xs uppercase">TechParts Promise</p>
                  <p className="text-xs text-blue-700 mt-1 leading-tight">
                    100% Purchase Protection. 7-Day Returns for defective items.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8 mb-12 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Product Description</h3>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{product.description}</p>
      </div>

      {/* Reviews Section */}
      <div id="reviews" className="scroll-mt-24">
        <ReviewList productSlug={slug || ''} productId={product.id} />
      </div>
    </div>
  );
};

export default ProductDetailPage;