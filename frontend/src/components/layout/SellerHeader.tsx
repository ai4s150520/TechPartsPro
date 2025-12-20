import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

const SellerHeader: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-100 py-6">
      <nav className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="text-2xl font-extrabold text-blue-600 tracking-tight">
          TechParts<span className="text-gray-900">Pro</span>
        </Link>
        <div className="flex items-center space-x-6">
          <Link to="/seller/login" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">
            Seller Login
          </Link>
          <Link to="/seller/register">
            <Button size="sm" variant="seller" className="px-5 py-2 text-sm">
              Seller Register
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default SellerHeader;
