import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, FileSpreadsheet, CheckSquare, Square } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { formatPrice, getImageUrl } from '../../lib/utils';

const SellerProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const toggleSelect = (slug: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else {
        newSet.add(slug);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.slug)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      toast.warning('Please select products to delete');
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    setDeleting(true);
    let successCount = 0;
    let failCount = 0;
    const failedProducts: string[] = [];

    for (const slug of selectedProducts) {
      try {
        await apiClient.delete(`/catalog/products/${slug}/`);
        successCount++;
        // Remove from local state immediately
        setProducts(prev => prev.filter(p => p.slug !== slug));
      } catch (error: any) {
        console.error('Delete error:', error);
        failCount++;
        failedProducts.push(slug);
      }
    }

    setDeleting(false);
    setSelectedProducts(new Set());
    
    // Force refresh from server
    setTimeout(() => {
      fetchProducts();
    }, 500);

    if (successCount > 0) {
      toast.success(`${successCount} product(s) deleted successfully`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} product(s) failed to delete`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Inventory</h1>
          {selectedProducts.size > 0 && (
            <p className="text-sm text-gray-600 mt-1">{selectedProducts.size} product(s) selected</p>
          )}
        </div>
        
        <div className="flex gap-3">
          {selectedProducts.size > 0 && (
            <Button 
              onClick={handleBulkDelete} 
              variant="outline" 
              className="border-red-300 text-red-600 hover:bg-red-50"
              isLoading={deleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedProducts.size})
            </Button>
          )}
          
          <Link to="/seller/bulk-upload">
            <Button variant="outline" className="flex items-center bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
              <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
              Bulk Upload
            </Button>
          </Link>

          <Link to="/seller/products/new">
            <Button variant="seller" className="flex items-center">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-4 w-12">
                <button onClick={toggleSelectAll} className="text-gray-600 hover:text-gray-900">
                  {selectedProducts.size === products.length && products.length > 0 ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 font-semibold text-gray-700">Product</th>
              <th className="px-6 py-4 font-semibold text-gray-700">SKU</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Price</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Stock</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading inventory...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No products found. Start selling!</td></tr>
            ) : products.map((product) => (
              <tr key={product.id} className={`hover:bg-gray-50 transition ${selectedProducts.has(product.slug) ? 'bg-blue-50' : ''}`}>
                <td className="px-4 py-4">
                  <button onClick={() => toggleSelect(product.slug)} className="text-gray-600 hover:text-gray-900">
                    {selectedProducts.has(product.slug) ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </td>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Products</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <span className="font-bold">{selectedProducts.size}</span> selected product(s)?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProductsPage;