import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, Users, DollarSign, Truck, Building, 
  Globe, ShieldCheck, TrendingUp, BarChart, 
  Target, Warehouse, CheckCircle, Percent,
  ArrowRight, MapPin, CreditCard, FileText, Sparkles, Award
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import Footer from '../../components/layout/Footer';
import SellerHeader from '../../components/layout/SellerHeader';
import { useAuthStore } from '../../store/authStore';

const SellOnlinePage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated && user?.role === 'SELLER') {
      navigate('/seller/home');
    }
  }, [isAuthenticated, user, navigate]);

  const wholesaleBenefits = [
    {
      icon: Users,
      title: "5,000+ Business Buyers",
      description: "Verified repair shops across India ready to buy in bulk",
      color: "from-blue-500 to-blue-700",
      bgColor: "bg-blue-50"
    },
    {
      icon: Globe,
      title: "Pan-India Reach",
      description: "Sell to shops in every state from your warehouse",
      color: "from-green-500 to-green-700",
      bgColor: "bg-green-50"
    },
    {
      icon: ShieldCheck,
      title: "GST Compliant",
      description: "Automated B2B invoicing and tax compliance",
      color: "from-purple-500 to-purple-700",
      bgColor: "bg-purple-50"
    },
    {
      icon: Truck,
      title: "Logistics Support",
      description: "Bulk shipping rates and nationwide delivery network",
      color: "from-orange-500 to-orange-700",
      bgColor: "bg-orange-50"
    }
  ];

  const sellerSuccessStories = [
    {
      quote: "Had 500 iPhone screens sitting in inventory. Sold to 47 shops in 2 months through this platform.",
      author: "Mobile Parts Seller, Delhi",
      metric: "₹4.2L revenue in 60 days",
      avatar: "👨💼",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      quote: "From supplying locally to shipping to 15 states. Our monthly turnover grew 300% in 6 months.",
      author: "Battery Distributor, Bangalore",
      metric: "3x business growth",
      avatar: "👩💻",
      gradient: "from-green-500 to-teal-600"
    },
    {
      quote: "The bulk order system saved us from cash flow issues. Now we get regular orders from verified shops.",
      author: "Display Panel Supplier, Mumbai",
      metric: "Steady ₹8L/month revenue",
      avatar: "👨🔧",
      gradient: "from-orange-500 to-red-600"
    }
  ];

  const requirements = [
    { text: "GST registered business", icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
    { text: "Minimum 50 pieces per SKU", icon: Package, color: "text-green-600", bg: "bg-green-100" },
    { text: "Pan-India shipping capability", icon: Truck, color: "text-purple-600", bg: "bg-purple-100" },
    { text: "Consistent inventory availability", icon: Warehouse, color: "text-orange-600", bg: "bg-orange-100" },
    { text: "Competitive wholesale pricing", icon: Percent, color: "text-pink-600", bg: "bg-pink-100" },
    { text: "Quality assurance", icon: ShieldCheck, color: "text-indigo-600", bg: "bg-indigo-100" }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen flex flex-col overflow-hidden">
      <SellerHeader />

      {/* Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-20 w-28 h-28 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-2000"></div>
      </div>
        
      {/* Hero Section */}
      <div className="relative z-10 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-blue-500/30 to-transparent rounded-full blur-3xl animate-spin-slow"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-r from-purple-500/30 to-transparent rounded-full blur-3xl animate-bounce-slow"></div>
        
        <div className="relative z-10 container mx-auto px-4 md:px-6 flex flex-col lg:flex-row items-center py-16 md:py-20">
          <div className="lg:w-1/2 mb-10 lg:mb-0">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-white/20 shadow-lg">
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              <span className="text-sm font-semibold">FOR SELLERS & DISTRIBUTORS</span>
              <Award className="w-5 h-5 text-yellow-400" />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              Got Bulk Mobile Parts?<br />
              <span className="text-3xl md:text-5xl lg:text-6xl bg-gradient-to-r from-orange-300 to-pink-300 bg-clip-text">Sell to Repair Shops</span><br />
              <span className="text-3xl md:text-5xl lg:text-6xl">Across India</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-blue-100 mb-10 max-w-3xl leading-relaxed">
              Connect your inventory with 5,000+ verified repair shops. 
              Liquidate bulk stock, reach national market, and grow your B2B business.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 mb-12">
              {isAuthenticated && user?.role === 'CUSTOMER' ? (
                <Link to="/seller/register">
                  <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 font-bold px-10 py-4 text-lg shadow-xl transform hover:scale-105 transition-all duration-300">
                    <Building className="w-6 h-6 mr-3" />
                    Upgrade to Seller Account
                  </Button>
                </Link>
              ) : !isAuthenticated ? (
                <>
                  <Link to="/seller/register">
                    <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 font-bold px-10 py-4 text-lg shadow-xl transform hover:scale-105 transition-all duration-300">
                      <Package className="w-6 h-6 mr-3" />
                      Register as Seller
                    </Button>
                  </Link>
                  <Link to="/seller/login">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 font-bold px-10 py-4 text-lg shadow-xl transform hover:scale-105 transition-all duration-300">
                      Seller Login
                    </Button>
                  </Link>
                </>
              ) : null}
            </div>
            <p className="text-sm text-blue-200 font-medium">
              {isAuthenticated && user?.role === 'CUSTOMER' 
                ? '✨ Convert your account to seller in minutes'
                : '🚀 New to selling? Get started in 48 hours'
              }
            </p>
          </div>
          <div className="lg:w-1/2 flex justify-center">
            <div className="relative transform hover:scale-105 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-2xl blur-2xl"></div>
              <img 
                src="https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&q=80&w=800" 
                alt="Warehouse Inventory" 
                className="relative rounded-2xl shadow-2xl border-4 border-white/20 backdrop-blur-sm"
              />
              <div className="absolute -bottom-6 -right-1 bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border-2 border-white/50 transform hover:rotate-3 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Average Monthly Revenue</p>
                    <p className="font-black text-slate-900 text-lg">₹3.8L/seller</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <section className="relative z-10 py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-4 bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
              Solving Seller Problems
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">Transform your challenges into opportunities</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Package,
                title: "Stuck with Bulk Inventory?",
                description: "Large quantities but limited local buyers. Inventory tying up capital instead of generating revenue.",
                color: "from-red-500 to-pink-600",
                bgColor: "bg-red-50"
              },
              {
                icon: MapPin,
                title: "Can't Reach Small Shops?",
                description: "Thousands of repair shops need parts but can't find reliable suppliers in their area.",
                color: "from-yellow-500 to-orange-600",
                bgColor: "bg-yellow-50"
              },
              {
                icon: CreditCard,
                title: "Cash Flow Issues?",
                description: "Slow-moving stock affects business growth. Need consistent bulk orders to maintain cash flow.",
                color: "from-blue-500 to-indigo-600",
                bgColor: "bg-blue-50"
              }
            ].map((problem, idx) => (
              <div key={idx} className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-rotate-1 border-2 border-transparent hover:border-slate-200">
                <div className={`w-20 h-20 bg-gradient-to-r ${problem.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                  <problem.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">{problem.title}</h3>
                <p className="text-slate-600 leading-relaxed">{problem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-16 md:py-20 bg-gradient-to-r from-white to-blue-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-4">
              How Selling Works
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Simple 4-step process to start selling your inventory to repair shops nationwide
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "List Bulk Inventory",
                description: "Upload your stock with wholesale minimums (50+ units per SKU)",
                icon: Package,
                color: "from-blue-500 to-blue-700"
              },
              {
                step: "02",
                title: "Shops Discover You",
                description: "5,000+ shop owners search and place bulk orders",
                icon: Users,
                color: "from-green-500 to-green-700"
              },
              {
                step: "03",
                title: "Receive Bulk Orders",
                description: "Get consolidated orders with proper GST invoices",
                icon: BarChart,
                color: "from-purple-500 to-purple-700"
              },
              {
                step: "04",
                title: "Ship & Get Paid",
                description: "Secure payments, logistics support, 7-day payouts",
                icon: DollarSign,
                color: "from-orange-500 to-orange-700"
              }
            ].map((step, idx) => (
              <div key={idx} className="relative group">
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-2 border-slate-100 hover:border-blue-200">
                  <div className="text-5xl font-black text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300">{step.step}</div>
                  <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:rotate-12 transition-all duration-300`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{step.description}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-10 h-10 text-blue-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative z-10 py-16 md:py-20 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative z-10 container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6">Seller Partner Benefits</h2>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto">
              Everything you need to scale your business
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {wholesaleBenefits.map((benefit, idx) => (
              <div key={idx} className="group bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 hover:bg-white/20 transition-all duration-500 transform hover:scale-105 hover:-rotate-1 shadow-2xl">
                <div className={`w-20 h-20 bg-gradient-to-r ${benefit.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                  <benefit.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-4 group-hover:text-blue-300 transition-colors">{benefit.title}</h3>
                <p className="text-blue-200 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="relative z-10 py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-4">
              Seller Partner Requirements
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              We ensure quality and reliability for our repair shop buyers
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requirements.map((req, idx) => (
                <div key={idx} className="group flex items-center gap-6 p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-slate-100 hover:border-blue-200">
                  <div className={`w-16 h-16 ${req.bg} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                    <req.icon className={`w-8 h-8 ${req.color}`} />
                  </div>
                  <span className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{req.text}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
                All seller partners undergo verification to maintain platform quality
              </p>
              <Link to="/info/contact">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 font-bold px-10 py-4 text-lg shadow-xl transform hover:scale-105 transition-all duration-300">
                  View Detailed Requirements
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="relative z-10 py-16 md:py-20 bg-gradient-to-br from-slate-100 to-blue-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-4">
              Seller Success Stories
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Real sellers, real results. Join distributors who transformed their business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sellerSuccessStories.map((story, idx) => (
              <div key={idx} className="group bg-white/90 backdrop-blur-sm p-8 md:p-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-rotate-1 border-2 border-slate-100 hover:border-blue-200">
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-16 h-16 bg-gradient-to-r ${story.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                    {story.avatar}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{story.author}</p>
                  </div>
                </div>
                <div className="text-6xl text-blue-200 mb-6 group-hover:text-blue-400 transition-colors">"</div>
                <p className="text-slate-700 text-lg italic mb-8 leading-relaxed font-medium">
                  {story.quote}
                </p>
                <div className="pt-6 border-t-2 border-slate-100">
                  <div className="px-6 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-xl border-2 border-blue-200 text-center">
                    <span className="font-black text-lg">{story.metric}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-16 md:py-20 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              Ready to Scale Your Business?
            </h2>
            <p className="text-xl md:text-2xl text-blue-200 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join 500+ sellers already selling to repair shops nationwide. 
              Start in 48 hours with complete business verification.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link to="/seller/register">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 font-black px-12 py-6 text-xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <Building className="w-8 h-8 mr-3" />
                  Register as Seller
                </Button>
              </Link>
              <Link to="/info/contact">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 font-black px-12 py-6 text-xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <Target className="w-8 h-8 mr-3" />
                  Schedule Demo
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { value: "48H", label: "Average Setup Time", color: "text-blue-400" },
                { value: "5K+", label: "Business Buyers", color: "text-green-400" },
                { value: "28", label: "States Covered", color: "text-purple-400" },
                { value: "7D", label: "Payment Cycle", color: "text-orange-400" }
              ].map((stat, idx) => (
                <div key={idx} className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                  <div className={`text-4xl font-black ${stat.color} mb-2`}>{stat.value}</div>
                  <p className="text-blue-200 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />

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

export default SellOnlinePage;