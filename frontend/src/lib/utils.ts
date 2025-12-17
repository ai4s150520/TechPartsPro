import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// CSS Merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 1. Currency Formatter (Indian Rupee)
export const formatPrice = (price: number | string) => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numericPrice)) return '₹0';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0, // Removes decimals (e.g. ₹500 instead of ₹500.00)
  }).format(numericPrice);
};

// 2. Image URL Fixer
export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return 'https://placehold.co/400x400?text=No+Image';
  
  // If it's already a full URL (e.g. Cloudinary or AWS or External), return it
  if (path.startsWith('http')) return path;
  
  // Logic: Prepend Backend URL to relative path
  // If VITE_API_URL is http://127.0.0.1:8000/api, we remove '/api' to get root
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  const rootUrl = apiBase.replace(/\/api\/?$/, ''); // Regex to remove trailing /api
  
  // Ensure path has leading slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${rootUrl}${cleanPath}`;
};