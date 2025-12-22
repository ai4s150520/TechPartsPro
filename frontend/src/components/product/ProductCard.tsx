import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, Star, Eye } from "lucide-react";
import { toast } from "react-toastify";
import { useAuthStore } from "../../store/authStore";
import { useAddToCart } from "../../hooks/useCart";
import { useToggleWishlist, useCheckWishlist } from "../../hooks/useWishlist";
import { formatPrice, getImageUrl } from "../../lib/utils";

interface WishlistResponse {
  data?: {
    is_wishlisted?: boolean;
    action?: string;
  };
  is_wishlisted?: boolean;
  action?: string;
}

interface ErrorResponse {
  response?: {
    data?: Record<string, unknown>;
    status?: number;
  };
  message?: string;
}

export type ProductSummary = {
  id: number;
  name: string;
  slug: string;
  price: number;
  discount_price?: number;
  category_name: string;
  stock_quantity: number;
  feature_image: string | null;
};

interface ProductCardProps {
  product: ProductSummary;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { mutate: addToCart, isPending: loadingCart } = useAddToCart();

  const [isWishlisted, setIsWishlisted] = useState(false);

  const { mutate: toggleWishlist } = useToggleWishlist();
  const { data: wishlistCheck, error: wishlistError } = useCheckWishlist(product.id);

  useEffect(() => {
    // Defensive: some hooks return { data: ... } others return plain boolean - adapt safely
    if (wishlistCheck) {
      // If your hook returns { data: { is_wishlisted: true } }:
      if ((wishlistCheck as WishlistResponse)?.data?.is_wishlisted !== undefined) {
        setIsWishlisted((wishlistCheck as WishlistResponse).data!.is_wishlisted!);
        return;
      }
      // If your hook returns { is_wishlisted: true }:
      if ((wishlistCheck as WishlistResponse)?.is_wishlisted !== undefined) {
        setIsWishlisted((wishlistCheck as WishlistResponse).is_wishlisted!);
        return;
      }
      // If hook returns boolean directly:
      if (typeof wishlistCheck === "boolean") {
        setIsWishlisted(wishlistCheck);
        return;
      }
    }

    // If there is a 401 or any error, ensure we don't set wishlisted to undefined
    if (wishlistError) {
      // If error.status === 401, keep false (guest)
      setIsWishlisted(false);
    }
  }, [wishlistCheck, wishlistError]);

  const discountPercentage = product.discount_price
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0;

  const currentPrice = product.discount_price ?? product.price;
  const isOutOfStock = product.stock_quantity <= 0;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) {
      toast.info("Product is out of stock");
      return;
    }

    if (!isAuthenticated) {
      navigate("/auth/login", { state: { from: window.location.pathname } });
      return;
    }

    addToCart({ product_id: product.id, quantity: 1 }, {
      onSuccess: () => toast.success(`${product.name} added to cart!`),
      onError: (err: ErrorResponse) => {
        if (err?.response?.status === 401) {
          toast.error("Please login to add items to cart");
          navigate("/auth/login", { state: { from: window.location.pathname } });
        } else {
          toast.error((err?.response?.data as { error?: string })?.error || "Failed to add to cart");
        }
      }
    });
  };

  const handleWishlistToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation(); // IMPORTANT: prevent Link navigation when clicking the button

    if (!isAuthenticated) {
      navigate("/auth/login", { state: { from: window.location.pathname } });
      return;
    }

    // Call mutation with callbacks
    toggleWishlist(product.id, {
      onSuccess: (response: WishlistResponse) => {
        // Expecting response.data.action = 'added' | 'removed'
        const action = (response?.data?.action ?? response?.action) as string | undefined;
        if (action) {
          setIsWishlisted(action === "added");
          toast.success(action === "added" ? "Added to wishlist" : "Removed from wishlist");
        } else {
          // Fallback: toggle locally
          setIsWishlisted((prev) => !prev);
        }
      },
      onError: (error: ErrorResponse) => {
        if (error?.response?.status === 401) {
          toast.error("Please login to manage wishlist");
          navigate("/auth/login", { state: { from: window.location.pathname } });
          return;
        }
        toast.error("Failed to update wishlist");
      },
    });
  };

  return (
    <Link
      to={`/shop/product/${product.slug}`}
      className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden relative"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {discountPercentage > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
            -{discountPercentage}%
          </span>
        )}
        {isOutOfStock && (
          <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
            Sold Out
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlistToggle}
        className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        {/* lucide icons are stroke-based; this class toggles color */}
        <Heart className={`w-4 h-4 ${isWishlisted ? "text-red-500" : ""}`} />
      </button>

      {/* Image Area */}
      <div className="relative h-48 sm:h-56 bg-gray-50 p-4 flex items-center justify-center overflow-hidden">
        <img
          src={getImageUrl(product.feature_image)}
          alt={product.name}
          className="object-contain h-full w-full mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
        />

        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white text-gray-800 px-4 py-2 rounded-full font-medium text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform flex items-center gap-2">
            <Eye className="w-4 h-4" /> View Details
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wider">
          {product.category_name}
        </div>

        <h3
          className="font-medium text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]"
          title={product.name}
        >
          {product.name}
        </h3>

        <div className="flex items-center mb-4">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current" />
            ))}
          </div>
          <span className="text-xs text-gray-400 ml-1">(0)</span>
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900">{formatPrice(currentPrice)}</span>
            {product.discount_price && (
              <span className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || loadingCart}
            className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm
              ${isOutOfStock ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200 active:scale-95"}`}
            aria-label="Add to cart"
            title={isOutOfStock ? "Out of stock" : "Add to cart"}
          >
            {loadingCart ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ShoppingCart className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
