import React from 'react';

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
    <div className="bg-gray-200 h-48"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-6 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

export const OrderCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
    <div className="flex justify-between mb-4">
      <div className="h-6 bg-gray-200 rounded w-32"></div>
      <div className="h-6 bg-gray-200 rounded w-20"></div>
    </div>
    <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
    <div className="flex gap-2">
      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="bg-white rounded-xl p-6 animate-pulse">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex gap-4 p-4 bg-white rounded-lg animate-pulse">
        <div className="h-12 w-12 bg-gray-200 rounded"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);
