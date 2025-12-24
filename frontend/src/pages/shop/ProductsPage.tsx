import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductGrid from '../../components/product/ProductGrid';
import ProductFilters from '../../components/product/ProductFilters';
import { useProducts } from '../../hooks/useProducts';
import { ProductCardSkeleton } from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { PackageSearch } from 'lucide-react';

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    ordering: searchParams.get('ordering') || '',
    page: 1
  });

  const { data, isLoading } = useProducts(filters);
  const products = data?.results || [];
  
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.min_price) params.set('min_price', newFilters.min_price);
    if (newFilters.max_price) params.set('max_price', newFilters.max_price);
    if (newFilters.ordering) params.set('ordering', newFilters.ordering);
    setSearchParams(params);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0">
          <ProductFilters filters={filters} setFilters={handleFilterChange} />
        </aside>

        {/* Main Grid */}
        <main className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {filters.category ? (
                <span className="capitalize">{filters.category.replace(/-/g, ' ')} Parts</span>
              ) : (
                'All Products'
              )}
            </h1>

          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No products found"
              description="We couldn't find any products matching your search. Try adjusting your filters or search terms."
              actionText="Clear Filters"
              onAction={() => handleFilterChange({ search: '', category: '', min_price: '', max_price: '', ordering: '', page: 1 })}
            />
          ) : (
            <ProductGrid products={products} loading={false} />
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductsPage;