import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce values.
 * Useful for Search Inputs to prevent API calls on every keystroke.
 * 
 * Usage:
 * const debouncedSearch = useDebounce(searchQuery, 500);
 * useEffect(() => { api.search(debouncedSearch) }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timeout to update value after delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timeout if value changes before delay (User typed again)
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}