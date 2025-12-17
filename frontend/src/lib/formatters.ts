

// 1. Currency Formatter (Indian Rupee)
export const formatPrice = (amount: number | string | undefined | null) => {
  // Handle edge cases (API returns null, undefined, or string)
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Fallback for invalid numbers
  if (numericAmount === undefined || numericAmount === null || isNaN(numericAmount)) {
    return '₹0.00';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2, // Ensures ₹500 becomes ₹500.00 for consistency
  }).format(numericAmount);
};

// 2. Date Formatter (e.g., "28 Nov, 2025")
export const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return 'N/A';
  
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch (error) {
    return dateString; // Return original if parsing fails
  }
};

// 3. DateTime Formatter (e.g., "28 Nov, 2025 at 2:30 PM")
export const formatDateTime = (dateString: string | undefined | null) => {
  if (!dateString) return 'N/A';

  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
};