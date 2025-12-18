import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, Truck, RotateCcw, Wrench, 
  Smartphone, Battery, Zap, Camera, Speaker, HardDrive, 
  Layers, PenTool, CaseUpper, Grid, Flame, Star, Quote 
} from 'lucide-react';
import HeroCarousel from '../components/ui/HeroCarousel';
import ProductCard, { type ProductSummary } from '../components/product/ProductCard';
import apiClient from '../lib/apiClient';
import { Button } from '../components/ui/Button';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import { ProductCardSkeleton } from '../components/ui/SkeletonLoader';
import FlashSaleTimer from '../components/ui/FlashSaleTimer';

interface Category {
  id: string;
  name: string;
  slug: string;
  product_count?: number;
}

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<ProductSummary[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products and categories from Backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featured, trending, cats] = await Promise.all([
          apiClient.get('/catalog/products/?ordering=-created_at&page_size=4'),
          apiClient.get('/catalog/products/?ordering=-review_count&page_size=8'),
          apiClient.get('/catalog/categories/')
        ]);
        setFeaturedProducts(featured.data.results || []);
        setTrendingProducts(trending.data.results || []);
        setCategories(Array.isArray(cats.data) ? cats.data : (cats.data.results || []));
      } catch (error) {
        console.error("Failed to load home data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Icon mapping for categories
  const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('display') || lowerName.includes('screen')) return Smartphone;
    if (lowerName.includes('battery') || lowerName.includes('batteries')) return Battery;
    if (lowerName.includes('charging') || lowerName.includes('port')) return Zap;
    if (lowerName.includes('housing') || lowerName.includes('glass') || lowerName.includes('back')) return CaseUpper;
    if (lowerName.includes('tool') || lowerName.includes('repair')) return Wrench;
    if (lowerName.includes('camera')) return Camera;
    if (lowerName.includes('speaker') || lowerName.includes('audio')) return Speaker;
    if (lowerName.includes('motherboard') || lowerName.includes('board')) return HardDrive;
    if (lowerName.includes('cable') || lowerName.includes('flex')) return Layers;
    if (lowerName.includes('accessory') || lowerName.includes('accessories')) return Grid;
    return PenTool;
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      { color: "text-blue-600", bg: "bg-blue-50" },
      { color: "text-green-600", bg: "bg-green-50" },
      { color: "text-yellow-600", bg: "bg-yellow-50" },
      { color: "text-gray-600", bg: "bg-gray-100" },
      { color: "text-orange-600", bg: "bg-orange-50" },
      { color: "text-purple-600", bg: "bg-purple-50" },
      { color: "text-red-600", bg: "bg-red-50" },
      { color: "text-indigo-600", bg: "bg-indigo-50" },
      { color: "text-teal-600", bg: "bg-teal-50" },
      { color: "text-pink-600", bg: "bg-pink-50" },
    ];
    return colors[index % colors.length];
  };

  const brands = [
    { name: "Apple", logo: "🍎" },
    { name: "Samsung", logo: "📱" },
    { name: "Xiaomi", logo: "📲" },
    { name: "OnePlus", logo: "1️⃣" },
    { name: "Vivo", logo: "📳" },
    { name: "Oppo", logo: "📴" },
  ];

  const testimonials = [
    { name: "Rajesh Kumar", role: "Repair Shop Owner", text: "Best quality parts at wholesale prices. My go-to supplier for 2 years!", rating: 5 },
    { name: "Priya Sharma", role: "Customer", text: "Fast delivery and genuine products. Fixed my iPhone screen perfectly.", rating: 5 },
    { name: "Mobile Fix Pro", role: "B2B Partner", text: "Bulk orders are seamless. Great support team and consistent quality.", rating: 5 },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      
      {/* 1. Hero Section */}
      <div className="container mx-auto px-4 py-6">
        <HeroCarousel />
      </div>

      {/* 2. Trust Badges */}
      <section className="bg-white border-y border-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-full text-blue-600"><ShieldCheck className="w-6 h-6" /></div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">100% Original</h4>
                <p className="text-xs text-gray-500">Quality Tested Parts</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-full text-green-600"><Truck className="w-6 h-6" /></div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Fast Shipping</h4>
                <p className="text-xs text-gray-500">Same day dispatch</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-full text-orange-600"><RotateCcw className="w-6 h-6" /></div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Easy Returns</h4>
                <p className="text-xs text-gray-500">7 Day Replacement</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-full text-purple-600"><Wrench className="w-6 h-6" /></div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Expert Support</h4>
                <p className="text-xs text-gray-500">Technical Assistance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Browse Categories (10 BOXES) */}
      <section className="py-12 container mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Explore Parts</h2>
          <Link to="/shop" className="text-blue-600 font-medium hover:underline flex items-center text-sm">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        {/* 10-Grid Layout: 2 cols on mobile, 3 on tablet, 5 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.slice(0, 10).map((cat, index) => {
            const Icon = getCategoryIcon(cat.name);
            const colorScheme = getCategoryColor(index);
            return (
              <Link 
                key={cat.slug} 
                to={`/shop?category=${cat.slug}`}
                className="group bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center text-center cursor-pointer hover:border-blue-200"
              >
                <div className={`w-14 h-14 rounded-full ${colorScheme.bg} ${colorScheme.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{cat.product_count || 0} items</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3.5 Flash Sale Section */}
      <section className="py-12 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Flame className="w-8 h-8 text-red-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">⚡ Flash Sale</h2>
                <p className="text-gray-600 text-sm">Limited time offers - Grab them fast!</p>
              </div>
            </div>
            <FlashSaleTimer />
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3.7 Shop by Brand */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Shop by Brand</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {brands.map((brand) => (
              <Link
                key={brand.name}
                to={`/shop?brand=${brand.name.toLowerCase()}`}
                className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-6 flex flex-col items-center justify-center transition-all group"
              >
                <span className="text-4xl mb-2">{brand.logo}</span>
                <span className="font-semibold text-gray-900 group-hover:text-blue-600">{brand.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. New Arrivals (Dynamic) */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">New Arrivals</h2>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4.5 Trending Products */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">🔥 Trending Now</h2>
              <p className="text-gray-600 mt-1">Most popular parts this week</p>
            </div>
            <Link to="/shop?ordering=-review_count" className="text-blue-600 font-medium hover:underline flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4.7 Stats Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <AnimatedCounter end={50000} suffix="+" />
              <p className="text-gray-600 mt-2 font-medium">Products Sold</p>
            </div>
            <div>
              <AnimatedCounter end={5000} suffix="+" />
              <p className="text-gray-600 mt-2 font-medium">Happy Customers</p>
            </div>
            <div>
              <AnimatedCounter end={24} suffix="/7" />
              <p className="text-gray-600 mt-2 font-medium">Support Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4.9 Customer Testimonials */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">What Our Customers Say</h2>
            <p className="text-gray-600">Trusted by thousands of repair shops and customers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <Quote className="w-8 h-8 text-blue-600 mb-4" />
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. B2B Promo */}
      <section className="py-20 container mx-auto px-4">
        <div className="bg-gradient-to-r from-gray-900 to-slate-800 rounded-2xl p-8 md:p-16 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="relative z-10 max-w-xl text-center md:text-left mb-8 md:mb-0">
            <span className="text-orange-400 font-bold uppercase tracking-wider text-sm mb-2 block">For Repair Shops</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Get Wholesale Pricing
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              Register as a business to unlock exclusive bulk discounts, GST invoices, and priority support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/seller/register">
                <Button variant="seller" size="lg">Create Business Account</Button>
              </Link>
              <Link to="/info/about">
                <Button variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-gray-900">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative z-10 hidden md:block">
            <div className="w-64 h-64 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center p-8">
               <div className="text-center">
                 <p className="text-4xl font-bold text-white mb-2">15% OFF</p>
                 <p className="text-gray-300">On your first bulk order</p>
               </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;