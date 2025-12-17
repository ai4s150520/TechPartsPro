import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

interface Category {
  id: number;
  name: string;
  slug: string;
}

const CategoryBar: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ideally, cache this or use React Query
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get('/catalog/categories/');
        // Filter only top-level categories (parent is null)
        const topLevel = res.data.results.filter((c: any) => !c.parent);
        setCategories(topLevel);
      } catch (err) {
        console.error("Failed to load categories", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) return null; // Or a skeleton

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm hidden md:block">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-3 text-sm font-medium text-gray-600">
          <Link to="/shop" className="hover:text-blue-600 whitespace-nowrap">All Products</Link>
          {categories.slice(0, 8).map((cat) => (
            <Link 
              key={cat.id} 
              to={`/shop?category=${cat.slug}`} 
              className="hover:text-blue-600 whitespace-nowrap transition-colors"
            >
              {cat.name}
            </Link>
          ))}
          <Link to="/shop?sort=-created_at" className="hover:text-blue-600 whitespace-nowrap text-orange-600 ml-auto">
            New Arrivals
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CategoryBar;