import React from 'react';
import { Link } from 'react-router-dom';
import { Package, TrendingUp, Upload, Plus, BarChart3, DollarSign, ShoppingBag, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const SellerHomePage: React.FC = () => {
  const quickActions = [
    { title: 'Add Product', icon: Plus, link: '/seller/products/new', color: 'bg-orange-600 hover:bg-orange-700', desc: 'List a new product' },
    { title: 'Bulk Upload', icon: Upload, link: '/seller/bulk-upload', color: 'bg-blue-600 hover:bg-blue-700', desc: 'Upload multiple products' },
    { title: 'View Orders', icon: ShoppingBag, link: '/seller/orders', color: 'bg-green-600 hover:bg-green-700', desc: 'Manage your orders' },
    { title: 'My Products', icon: Package, link: '/seller/products', color: 'bg-purple-600 hover:bg-purple-700', desc: 'View all products' },
  ];

  const features = [
    { title: 'Real-time Analytics', icon: BarChart3, desc: 'Track sales and performance' },
    { title: 'Instant Payouts', icon: DollarSign, desc: 'Get paid quickly and securely' },
    { title: 'Order Management', icon: ShoppingBag, desc: 'Manage orders efficiently' },
    { title: 'Customer Insights', icon: Users, desc: 'Understand your buyers' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to Your Seller Portal</h1>
        <p className="text-orange-100 mb-6">Manage your products, orders, and grow your business</p>
        <Link to="/seller/dashboard">
          <Button className="bg-white text-orange-600 hover:bg-orange-50">
            <BarChart3 className="w-4 h-4 mr-2" /> View Dashboard
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.link}
              className={`${action.color} text-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all group`}
            >
              <action.icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-lg mb-1">{action.title}</h3>
              <p className="text-sm opacity-90">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <div key={feature.title} className="bg-white border border-gray-200 p-6 rounded-xl">
              <feature.icon className="w-8 h-8 text-orange-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-2">🚀 Getting Started</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✓ Complete your seller profile</li>
          <li>✓ Add your first product or use bulk upload</li>
          <li>✓ Set up payment details for payouts</li>
          <li>✓ Start receiving orders!</li>
        </ul>
      </div>
    </div>
  );
};

export default SellerHomePage;
