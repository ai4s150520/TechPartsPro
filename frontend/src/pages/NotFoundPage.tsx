import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white px-4 text-center">
      
      {/* 404 Visual */}
      <div className="relative mb-8">
        {/* FIXED LINE BELOW: Removed the line break in the className */}
        <h1 className="text-[150px] font-black text-gray-100 leading-none select-none">
          404
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-orange-100 p-4 rounded-full">
            <Search className="w-12 h-12 text-orange-600" />
          </div>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
      <p className="text-gray-500 max-w-md mb-8 text-lg">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
        
        <Link to="/">
          <Button className="flex items-center">
            <Home className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </Link>
      </div>

      {/* Helpful Links */}
      <div className="mt-12 text-sm text-gray-500">
        <p>Looking for something else?</p>
        <div className="flex gap-4 justify-center mt-3 font-medium text-blue-600">
          <Link to="/shop" className="hover:underline">Shop Catalog</Link>
          <Link to="/info/contact" className="hover:underline">Contact Support</Link>
          <Link to="/account" className="hover:underline">My Account</Link>
        </div>
      </div>

    </div>
  );
};

export default NotFoundPage;