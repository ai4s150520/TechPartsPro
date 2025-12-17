import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import ProductForm from '../../components/forms/ProductForm';

const SellerEditProductPage: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Fetch product data to pre-fill the form
        const { data } = await apiClient.get(`/catalog/products/${slug}/`);
        setProduct(data);
      } catch (error) {
        console.error("Failed to fetch product", error);
        alert("Product not found or access denied.");
        navigate('/seller/products');
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchProduct();
  }, [slug, navigate]);

  if (loading) {
    return <div className="p-20 text-center text-gray-500">Loading product details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/seller/products" className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inventory
      </Link>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h1 className="text-xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-sm text-gray-500 mt-1">
            Updating: <span className="font-mono font-bold">{product?.name}</span>
          </p>
        </div>
        
        {/* Pass fetched data to form via initialData prop */}
        {product && (
          <ProductForm 
            initialData={product} 
            onSuccess={() => navigate('/seller/products')} 
          />
        )}
      </div>
    </div>
  );
};

export default SellerEditProductPage;