import React, { useEffect, useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import apiClient from '../../lib/apiClient';

interface ProductFiltersProps {
  filters: any;
  setFilters: (filters: any) => void;
  className?: string;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({ filters, setFilters, className }) => {
  // Data State
  const [categories, setCategories] = useState<{id: number, slug: string, name: string}[]>([]);
  const [brands, setBrands] = useState<{id: number, slug: string, name: string}[]>([]);
  
  // Mobile Open State
  const [isOpen, setIsOpen] = useState(false);

  // Fetch Metadata on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          apiClient.get('/catalog/categories/'),
          apiClient.get('/catalog/brands/')
        ]);
        setCategories(catRes.data.results);
        setBrands(brandRes.data.results);
      } catch (error) {
        console.error("Filter data load error", error);
      }
    };
    fetchData();
  }, []);

  // Handlers
  const handleCategoryChange = (slug: string) => {
    setFilters({ ...filters, category: slug === filters.category ? '' : slug, page: 1 });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value, page: 1 });
  };

  const clearFilters = () => {
    setFilters({ page: 1, search: '', category: '', min_price: '', max_price: '' });
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="md:hidden flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium w-full mb-4"
        onClick={() => setIsOpen(true)}
      >
        <Filter className="w-4 h-4" /> Filters & Sort
      </button>

      {/* Sidebar Container */}
      <div className={`
        fixed inset-0 z-30 bg-white transform transition-transform duration-300 overflow-y-auto p-6 md:p-0 md:relative md:inset-auto md:bg-transparent md:transform-none md:block md:w-64 flex-shrink-0 md:z-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${className}
      `}>
        
        <div className="flex justify-between items-center mb-6 md:hidden">
          <h2 className="text-lg font-bold">Filters</h2>
          <button onClick={() => setIsOpen(false)}><X className="w-6 h-6" /></button>
        </div>

        {/* 1. Search (Optional here, usually in Header) */}
        <div className="mb-8">
           <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Search</h3>
           <div className="relative">
             <input 
               type="text"
               placeholder="Keyword..."
               value={filters.search || ''}
               onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
               className="w-full pl-8 pr-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-blue-500"
             />
             <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
           </div>
        </div>

        {/* 2. Categories */}
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Categories</h3>
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li key={cat.id}>
                <button 
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`text-sm hover:text-blue-600 transition-colors flex items-center w-full text-left
                    ${filters.category === cat.slug ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
                >
                  <span className={`w-2 h-2 rounded-full mr-2 ${filters.category === cat.slug ? 'bg-blue-600' : 'bg-transparent border border-gray-300'}`}></span>
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Price Range */}
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Price Range</h3>
          <div className="flex items-center space-x-2">
            <input 
              type="number" 
              name="min_price" 
              placeholder="Min" 
              value={filters.min_price || ''}
              onChange={handlePriceChange}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500" 
            />
            <span className="text-gray-400">-</span>
            <input 
              type="number" 
              name="max_price" 
              placeholder="Max" 
              value={filters.max_price || ''}
              onChange={handlePriceChange}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500" 
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
           <button 
             onClick={clearFilters}
             className="w-full py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50"
           >
             Clear All
           </button>
           <button 
             onClick={() => setIsOpen(false)}
             className="md:hidden w-full py-2 text-sm text-white bg-blue-600 rounded"
           >
             Apply
           </button>
        </div>
      </div>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsOpen(false)}></div>
      )}
    </>
  );
};

export default ProductFilters;