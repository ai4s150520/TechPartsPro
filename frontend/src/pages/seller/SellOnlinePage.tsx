import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Users, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import Footer from '../../components/layout/Footer';
import SellerHeader from '../../components/layout/SellerHeader';
import { useAuthStore } from '../../store/authStore';

const SellOnlinePage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // If user is already a seller, redirect to seller dashboard
  React.useEffect(() => {
    if (isAuthenticated && user?.role === 'SELLER') {
      navigate('/seller/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <SellerHeader />
        
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center py-20">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <span className="text-orange-500 font-bold tracking-wider uppercase text-sm">For Suppliers & Distributors</span>
            <h1 className="text-4xl md:text-6xl font-extrabold mt-4 mb-6 leading-tight">
              Scale Your Parts Business <span className="text-orange-500">Online</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg">
              Join the largest marketplace for mobile spare parts. Reach 50,000+ repair shops and technicians instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {isAuthenticated && user?.role === 'CUSTOMER' ? (
                // If customer wants to become seller, show upgrade option
                <Link to="/seller/register">
                  <Button size="lg" variant="seller" className="px-8 py-4 text-lg">
                    Upgrade to Seller Account
                  </Button>
                </Link>
              ) : !isAuthenticated ? (
                // If not authenticated, show normal flow
                <>
                  <Link to="/seller/login">
                    <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-2 border-orange-500 text-orange-500 hover:bg-orange-50">
                      Seller Login
                    </Button>
                  </Link>
                  <Link to="/seller/register">
                    <Button size="lg" variant="seller" className="px-8 py-4 text-lg">
                      Start Selling Today
                    </Button>
                  </Link>
                </>
              ) : null}
            </div>
            <p className="text-sm text-gray-400 mt-4">
              {isAuthenticated && user?.role === 'CUSTOMER' 
                ? 'Convert your customer account to start selling'
                : 'New to selling? Sign up now • Already a seller? Login to your account'
              }
            </p>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img 
              src="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=800" 
              alt="Dashboard Preview" 
              className="rounded-xl shadow-2xl border border-gray-700 transform rotate-2 hover:rotate-0 transition-transform duration-500"
            />
          </div>
        </div>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Massive Reach</h3>
              <p className="text-gray-600">Don't just sell locally. Ship to every pin code in the country with our integrated logistics network.</p>
            </div>
            <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-6">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fast Payouts</h3>
              <p className="text-gray-600">Get paid directly to your bank account within 7 days of delivery. Transparent fees, no hidden charges.</p>
            </div>
            <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Seller Analytics</h3>
              <p className="text-gray-600">Track your best-selling items, revenue growth, and customer returns with our advanced dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SellOnlinePage;