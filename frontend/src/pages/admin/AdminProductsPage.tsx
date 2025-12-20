import React, { useEffect, useState } from 'react';
import { Trash2, ExternalLink } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { productAPI } from '../../services/api';

const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await productAPI.list();
      const results = res && res.data && Array.isArray(res.data.results) ? res.data.results : [];
      setProducts(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await apiClient.delete(`/catalog/products/${slug}/`);
      setProducts(prev => prev.filter(p => p.slug !== slug));
    } catch (error) {
      alert("Failed to delete product");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Product Catalog Management</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Seller</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={product.feature_image} alt="" className="w-10 h-10 rounded border object-cover" />
                    <span className="font-medium text-gray-900 line-clamp-1">{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{product.seller_name || 'N/A'}</td>
                <td className="px-6 py-4 font-mono">{product.stock_quantity}</td>
                <td className="px-6 py-4 font-bold text-gray-900">${product.price}</td>
                <td className="px-6 py-4 flex gap-3">
                  <a href={`/shop/product/${product.slug}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={() => handleDelete(product.slug)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProductsPage;