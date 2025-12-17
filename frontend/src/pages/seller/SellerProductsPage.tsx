import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, FileSpreadsheet } from 'lucide-react'; // Added FileIcon
import apiClient from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { formatPrice, getImageUrl } from '../../lib/utils'; // Imported Helpers

const SellerProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const { data } = await apiClient.get('/catalog/products/');
      setProducts(data.results);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (slug: string) => {
    if (!window.confirm("Are you sure you want to delete this product? This cannot be undone.")) return;
    try {
      await apiClient.delete(`/catalog/products/${slug}/`);
      setProducts(prev => prev.filter(p => p.slug !== slug));
    } catch (error) {
      alert("Failed to delete product. It might be in an active order.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">My Inventory</h1>
        
        <div className="flex gap-3">
          <Link to="/seller/bulk-upload">
            <Button variant="outline" className="flex items-center bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
              <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
              Bulk Upload (Excel)
            </Button>
          </Link>

          <Link to="/seller/products/new">
            <Button variant="seller" className="flex items-center">
              <Plus className="w-4 h-4 mr-2" /> Add New Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">Product</th>
              <th className="px-6 py-4 font-semibold text-gray-700">SKU</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Price</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Stock</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading inventory...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No products found. Start selling!</td></tr>
            ) : products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                      {/* Fixed Image URL */}
                      <img 
                        src={getImageUrl(product.feature_image)} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <span className="font-medium text-gray-900 line-clamp-1 max-w-xs" title={product.name}>
                      {product.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-gray-600">{product.sku}</td>
                {/* Fixed Currency Format */}
                <td className="px-6 py-4 font-bold text-gray-900">{formatPrice(product.price)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    product.stock_quantity > 10 ? 'bg-green-100 text-green-700' : 
                    product.stock_quantity > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {product.stock_quantity} units
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-3">
                  <Link to={`/seller/products/edit/${product.slug}`} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <a href={`/shop/product/${product.slug}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                    <Eye className="w-4 h-4" />
                  </a>
                  <button onClick={() => handleDelete(product.slug)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
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

export default SellerProductsPage;