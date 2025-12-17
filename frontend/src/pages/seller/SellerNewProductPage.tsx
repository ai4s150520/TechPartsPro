import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../../components/forms/ProductForm';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const SellerNewProductPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/seller/products" className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inventory
      </Link>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h1 className="text-xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-sm text-gray-500 mt-1">Fill in the details to list a new item in the marketplace.</p>
        </div>
        
        {/* We pass a callback to redirect after success */}
        <ProductForm onSuccess={() => navigate('/seller/products')} />
      </div>
    </div>
  );
};

export default SellerNewProductPage;