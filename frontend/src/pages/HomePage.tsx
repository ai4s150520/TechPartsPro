import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, Truck, RotateCcw, Wrench, 
  Smartphone, Battery, Zap, Camera, Speaker, HardDrive, 
  Layers, PenTool, CaseUpper, Grid, Flame, Star, Quote,
  Package, Users, Building, TrendingUp, Clock, CheckCircle,
  BarChart, Target, Globe, ShoppingBag, Sparkles, Award,
  Cpu, Monitor, Headphones, Gamepad2, Tablet, Watch
} from 'lucide-react';
import ProductCard, { type ProductSummary } from '../components/product/ProductCard';
import apiClient from '../lib/apiClient';
import { Button } from '../components/ui/Button';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import { ProductCardSkeleton } from '../components/ui/SkeletonLoader';

interface Category {
  id: string;
  name: string;
  slug: string;
  product_count?: number;
}

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<ProductSummary[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<ProductSummary[]>([]);
  const [bulkDeals, setBulkDeals] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featured, trending, bulk, cats] = await Promise.all([
          apiClient.get('/catalog/products/?ordering=-created_at&page_size=4'),
          apiClient.get('/catalog/products/?ordering=-units_sold&page_size=8'),
          apiClient.get('/catalog/products/?min_quantity=50&page_size=4'),
          apiClient.get('/catalog/categories/')
        ]);
        setFeaturedProducts(featured.data.results || []);
        setTrendingProducts(trending.data.results || []);
        setBulkDeals(bulk.data.results || []);
        setCategories(Array.isArray(cats.data) ? cats.data : (cats.data.results || []));
      } catch (error) {
        console.error("Failed to load home data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('display') || lowerName.includes('screen')) return Monitor;
    if (lowerName.includes('battery') || lowerName.includes('batteries')) return Battery;
    if (lowerName.includes('charging') || lowerName.includes('port')) return Zap;
    if (lowerName.includes('housing') || lowerName.includes('glass') || lowerName.includes('back')) return CaseUpper;
    if (lowerName.includes('tool') || lowerName.includes('repair')) return Wrench;
    if (lowerName.includes('camera')) return Camera;
    if (lowerName.includes('speaker') || lowerName.includes('audio')) return Headphones;
    if (lowerName.includes('motherboard') || lowerName.includes('board')) return Cpu;
    if (lowerName.includes('cable') || lowerName.includes('flex')) return Layers;
    if (lowerName.includes('accessory') || lowerName.includes('accessories')) return Grid;
    return Smartphone;
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      { color: "text-blue-600", bg: "bg-gradient-to-br from-blue-50 to-blue-100", border: "border-blue-200" },
      { color: "text-emerald-600", bg: "bg-gradient-to-br from-emerald-50 to-emerald-100", border: "border-emerald-200" },
      { color: "text-purple-600", bg: "bg-gradient-to-br from-purple-50 to-purple-100", border: "border-purple-200" },
      { color: "text-orange-600", bg: "bg-gradient-to-br from-orange-50 to-orange-100", border: "border-orange-200" },
      { color: "text-pink-600", bg: "bg-gradient-to-br from-pink-50 to-pink-100", border: "border-pink-200" },
      { color: "text-indigo-600", bg: "bg-gradient-to-br from-indigo-50 to-indigo-100", border: "border-indigo-200" },
      { color: "text-teal-600", bg: "bg-gradient-to-br from-teal-50 to-teal-100", border: "border-teal-200" },
      { color: "text-red-600", bg: "bg-gradient-to-br from-red-50 to-red-100", border: "border-red-200" },
      { color: "text-cyan-600", bg: "bg-gradient-to-br from-cyan-50 to-cyan-100", border: "border-cyan-200" },
      { color: "text-amber-600", bg: "bg-gradient-to-br from-amber-50 to-amber-100", border: "border-amber-200" },
    ];
    return colors[index % colors.length];
  };

  const topBrands = [
    { name: "Apple", logo: "🍎", products: 1200, gradient: "from-gray-900 to-gray-700" },
    { name: "Samsung", logo: "📱", products: 850, gradient: "from-blue-600 to-blue-800" },
    { name: "Xiaomi", logo: "📲", products: 650, gradient: "from-orange-500 to-red-600" },
    { name: "OnePlus", logo: "1️⃣", products: 420, gradient: "from-red-600 to-red-800" },
    { name: "Vivo", logo: "📳", products: 380, gradient: "from-blue-500 to-purple-600" },
    { name: "Oppo", logo: "📴", products: 350, gradient: "from-green-500 to-blue-600" },
  ];

  const shopOwnerTestimonials = [
    { 
      name: "Rajesh Mobile Repair", 
      city: "Mumbai", 
      text: "As a small shop owner, getting genuine parts was a challenge. Now I get bulk discounts and next-day delivery!",
      savings: "Saves ₹15,000/month",
      rating: 5,
      avatar: "👨‍🔧"
    },
    { 
      name: "TechFix Solutions", 
      city: "Delhi", 
      text: "Wholesale prices without minimum order quantity. Perfect for my growing repair business.",
      savings: "40% cheaper than local market",
      rating: 5,
      avatar: "👩‍💼"
    },
    { 
      name: "Mobile Care Center", 
      city: "Bangalore", 
      text: "GST invoices and bulk discounts helped me scale my business across 3 locations.",
      savings: "Expanded to 3 shops",
      rating: 5,
      avatar: "👨‍💻"
    },
  ];

  const wholesaleBenefits = [
    {
      icon: Package,
      title: "Bulk Pricing",
      description: "Direct wholesale rates with volume discounts",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Truck,
      title: "Pan-India Delivery",
      description: "Free shipping on orders above ₹5,000",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: ShieldCheck,
      title: "GST Invoices",
      description: "Proper billing for business expenses",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: Clock,
      title: "Same Day Dispatch",
      description: "Orders before 3 PM shipped same day",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  const mostPurchasedByShops = [
    { name: "iPhone Displays", qty: "500+ pieces/month", shops: 120, icon: Monitor, trend: "+15%" },
    { name: "Samsung Batteries", qty: "300+ pieces/month", shops: 85, icon: Battery, trend: "+22%" },
    { name: "Charging Ports", qty: "400+ pieces/month", shops: 95, icon: Zap, trend: "+18%" },
    { name: "Repair Tool Kits", qty: "150+ kits/month", shops: 65, icon: Wrench, trend: "+12%" },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      
      {/* Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-20 w-28 h-28 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-2000"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-8 md:p-16 text-white overflow-hidden relative shadow-2xl">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-blue-500/30 to-transparent rounded-full blur-3xl animate-spin-slow"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-r from-purple-500/30 to-transparent rounded-full blur-3xl animate-bounce-slow"></div>
          
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-white/20 shadow-lg">
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              <span className="text-sm font-semibold">Exclusive for Repair Shops & Resellers</span>
              <Award className="w-5 h-5 text-yellow-400" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent leading-tight">
              Wholesale Mobile Parts
              <span className="block text-4xl md:text-6xl mt-2 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text">
                For Your Repair Business
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl leading-relaxed">
              Source genuine parts at wholesale prices. No middlemen. Free Pan-India delivery for shops.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 mb-12">
              <Link to="/shop">
                <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 font-bold px-10 py-4 text-lg shadow-xl transform hover:scale-105 transition-all duration-300">
                  <ShoppingBag className="w-6 h-6 mr-3" />
                  Browse Catalog
                </Button>
              </Link>
              <Link to="/sell-online">
                <Button size="lg" className="bg-green-600 text-white hover:bg-green-700 font-bold px-10 py-4 text-lg shadow-xl transform hover:scale-105 transition-all duration-300">
                  <Users className="w-6 h-6 mr-3" />
                  Register Your Shop
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {wholesaleBenefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                  <div className={`p-3 ${benefit.bgColor} rounded-xl shadow-lg`}>
                    <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{benefit.title}</p>
                    <p className="text-sm text-blue-200">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <section className="relative z-10 py-16 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
            Stock Your Shop
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Everything you need to run a successful mobile repair business. Bulk discounts available on all categories.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.slice(0, 10).map((cat, index) => {
            const Icon = getCategoryIcon(cat.name);
            const colorScheme = getCategoryColor(index);
            return (
              <Link 
                key={cat.slug} 
                to={`/shop?category=${cat.slug}`}
                className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-transparent shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:rotate-1 transform-gpu"
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)`,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className={`w-20 h-20 rounded-2xl ${colorScheme.bg} ${colorScheme.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg border-2 ${colorScheme.border}`}>
                  <Icon className="w-10 h-10" />
                </div>
                <h3 className="font-black text-slate-900 text-xl group-hover:text-blue-600 transition-colors mb-3">
                  {cat.name}
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500 font-medium">{cat.product_count || 0} SKUs</p>
                  <div className="text-xs font-bold px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full border border-green-200">
                    Bulk Available
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Bulk Deals Section */}
      <section className="relative z-10 py-16 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div className="flex items-center gap-4 mb-6 md:mb-0">
              <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 bg-gradient-to-r from-green-800 to-emerald-800 bg-clip-text text-transparent">
                  🏷️ Bulk Purchase Deals
                </h2>
                <p className="text-slate-600 text-lg font-medium">Special wholesale pricing for shop owners</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-xl border-2 border-green-200 shadow-lg">
              <Target className="w-5 h-5 text-green-600" />
              <span className="text-sm font-bold text-green-800">Min. 50 pieces for bulk rates</span>
            </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {(bulkDeals.length > 0 ? bulkDeals : featuredProducts).map((product) => (
                <div key={product.id} className="relative transform hover:scale-105 transition-all duration-300">
                  <div className="absolute -top-3 -right-3 z-10 bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-full text-xs font-black shadow-lg animate-pulse">
                    BULK DEAL
                  </div>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link to="/shop?bulk=true">
              <Button variant="outline" className="border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 text-lg font-bold shadow-lg transform hover:scale-105 transition-all duration-300">
                View All Bulk Deals
                <ArrowRight className="w-5 h-5 ml-3" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Products Section */}
      <section className="relative z-10 py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">📊 Popular with Repair Shops</h2>
              <p className="text-xl text-slate-600">Most purchased items by shops like yours</p>
            </div>
            <Link to="/shop?ordering=-units_sold" className="text-blue-600 font-bold hover:text-blue-800 flex items-center text-lg group">
              View All 
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {mostPurchasedByShops.map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-slate-50 to-blue-50 p-8 rounded-2xl border-2 border-slate-200 hover:border-blue-300 transition-all duration-300 transform hover:scale-105 hover:-rotate-1 shadow-lg hover:shadow-2xl">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-black px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full border border-green-200 mb-2">
                      High Demand
                    </span>
                    <span className="text-sm font-bold text-green-600">{item.trend}</span>
                  </div>
                </div>
                <h3 className="font-black text-slate-900 text-xl mb-4">{item.name}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Package className="w-4 h-4" />
                    <span className="font-medium">{item.qty}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{item.shops} shops buying</span>
                  </div>
                </div>
                <Link 
                  to={`/shop?search=${encodeURIComponent(item.name)}`}
                  className="mt-6 inline-block text-blue-600 hover:text-blue-800 font-bold text-sm group"
                >
                  Check Prices 
                  <ArrowRight className="w-4 h-4 inline ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
          
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-8">🔥 Hot Selling Items</h3>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {trendingProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="transform hover:scale-105 transition-all duration-300">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Brand Section */}
      <section className="relative z-10 py-16 bg-gradient-to-br from-slate-100 to-blue-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">🏭 Wholesale Brands</h2>
              <p className="text-xl text-slate-600">Genuine parts from authorized distributors</p>
            </div>
            <div className="flex items-center gap-3 mt-6 md:mt-0 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-xl border-2 border-green-200 shadow-lg">
              <ShieldCheck className="w-6 h-6 text-green-600" />
              <span className="text-sm font-bold text-green-800">All brands come with warranty</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {topBrands.map((brand) => (
              <Link
                key={brand.name}
                to={`/shop?brand=${brand.name.toLowerCase()}&type=wholesale`}
                className="group bg-white/90 backdrop-blur-sm hover:bg-white border-2 border-slate-200 hover:border-blue-300 rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-500 shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-rotate-2"
              >
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${brand.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-all duration-300`}>
                  <span className="text-3xl">{brand.logo}</span>
                </div>
                <span className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors mb-2">{brand.name}</span>
                <div className="px-4 py-2 bg-gradient-to-r from-slate-100 to-blue-100 text-slate-700 text-xs font-bold rounded-full border border-slate-200">
                  {brand.products}+ SKUs
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">🏪 Trusted by Shop Owners Across India</h2>
            <p className="text-xl text-slate-600">Join 5,000+ repair shops sourcing from us</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {shopOwnerTestimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white/90 backdrop-blur-sm p-6 md:p-10 rounded-2xl shadow-xl border-2 border-slate-100 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-rotate-1">
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-lg flex-shrink-0">
                    {testimonial.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-900 text-base md:text-lg truncate">{testimonial.name}</p>
                    <p className="text-xs md:text-sm text-slate-500 font-medium">{testimonial.city}</p>
                  </div>
                </div>
                
                <Quote className="w-8 h-8 md:w-10 md:h-10 text-blue-600 mb-4 md:mb-6" />
                <p className="text-slate-700 mb-6 md:mb-8 italic leading-relaxed text-base md:text-lg font-medium">"{testimonial.text}"</p>
                
                <div className="flex flex-col gap-4 pt-4 md:pt-6 border-t-2 border-slate-100">
                  <div className="w-full px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-xl border-2 border-green-200 text-center">
                    <span className="font-black text-sm md:text-base">{testimonial.savings}</span>
                  </div>
                  <div className="flex gap-1 justify-center">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 md:w-6 md:h-6 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-12 text-center text-white shadow-2xl">
            <h3 className="text-3xl md:text-4xl font-black mb-6">Ready to Grow Your Shop?</h3>
            <p className="text-blue-200 mb-10 max-w-3xl mx-auto text-xl leading-relaxed">
              Register your shop for wholesale pricing, GST invoices, and dedicated account manager.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/sell-online">
                <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 font-black px-10 py-4 text-lg shadow-xl transform hover:scale-105 transition-all duration-300">
                  <Users className="w-6 h-6 mr-3" />
                  Register Your Shop
                </Button>
              </Link>
              <Link to="/info/contact">
                <Button size="lg" className="bg-green-600 text-white hover:bg-green-700 font-black px-10 py-4 text-lg shadow-xl transform hover:scale-105 transition-all duration-300">
                  Speak to Sales Team
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-20 bg-white border-y-4 border-slate-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Why Shop Owners Choose Us</h2>
            <p className="text-xl text-slate-600">The largest B2B platform for mobile repair parts in India</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 shadow-lg transform hover:scale-105 transition-all duration-300">
              <AnimatedCounter end={5000} suffix="+" className="text-5xl font-black text-blue-600 mb-3" />
              <p className="text-slate-600 font-bold text-lg">Registered Repair Shops</p>
            </div>
            <div className="p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200 shadow-lg transform hover:scale-105 transition-all duration-300">
              <AnimatedCounter end={28} suffix=" States" className="text-5xl font-black text-green-600 mb-3" />
              <p className="text-slate-600 font-bold text-lg">Pan-India Delivery</p>
            </div>
            <div className="p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border-2 border-purple-200 shadow-lg transform hover:scale-105 transition-all duration-300">
              <AnimatedCounter end={98} suffix="%" className="text-5xl font-black text-purple-600 mb-3" />
              <p className="text-slate-600 font-bold text-lg">Order Accuracy Rate</p>
            </div>
            <div className="p-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border-2 border-orange-200 shadow-lg transform hover:scale-105 transition-all duration-300">
              <AnimatedCounter end={24} suffix="/7" className="text-5xl font-black text-orange-600 mb-3" />
              <p className="text-slate-600 font-bold text-lg">Business Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Business Tools Section */}
      <section className="relative z-10 py-24 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Business Tools for Shop Owners</h2>
            <p className="text-blue-200 text-xl mb-16 max-w-3xl mx-auto leading-relaxed">
              Manage your inventory, track expenses, and grow your repair business with our tools
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="bg-slate-800/50 backdrop-blur-sm p-10 rounded-2xl hover:bg-slate-700/50 transition-all duration-500 border-2 border-slate-700 hover:border-blue-500 shadow-2xl transform hover:scale-105 hover:-rotate-1">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-8 shadow-lg mx-auto">
                  <BarChart className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-6">Inventory Management</h3>
                <p className="text-slate-300 mb-8 text-lg leading-relaxed">Track stock levels, set reorder points, and manage multiple shop locations</p>
                <Link to="/info/contact" className="text-blue-400 hover:text-blue-300 font-bold text-lg group">
                  Contact Us 
                  <ArrowRight className="w-5 h-5 inline ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm p-10 rounded-2xl hover:bg-slate-700/50 transition-all duration-500 border-2 border-slate-700 hover:border-green-500 shadow-2xl transform hover:scale-105">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center mb-8 shadow-lg mx-auto">
                  <Globe className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-6">Bulk Order Dashboard</h3>
                <p className="text-slate-300 mb-8 text-lg leading-relaxed">Place orders for multiple shops, track shipments, and manage invoices</p>
                <Link to="/info/contact" className="text-green-400 hover:text-green-300 font-bold text-lg group">
                  Contact Us 
                  <ArrowRight className="w-5 h-5 inline ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm p-10 rounded-2xl hover:bg-slate-700/50 transition-all duration-500 border-2 border-slate-700 hover:border-purple-500 shadow-2xl transform hover:scale-105 hover:rotate-1">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mb-8 shadow-lg mx-auto">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-6">Profit Calculator</h3>
                <p className="text-slate-300 mb-8 text-lg leading-relaxed">Calculate repair costs, profit margins, and business growth projections</p>
                <Link to="/info/contact" className="text-purple-400 hover:text-purple-300 font-bold text-lg group">
                  Contact Us 
                  <ArrowRight className="w-5 h-5 inline ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            
            <div className="mt-16 pt-10 border-t-2 border-slate-700">
              <p className="text-slate-400 mb-8 text-lg">New: Monthly subscription for premium business tools</p>
              <Link to="/info/contact">
                <Button className="bg-orange-600 text-white hover:bg-orange-700 font-black px-10 py-4 text-lg shadow-xl transform hover:scale-105 transition-all duration-300">
                  Contact for Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default HomePage;