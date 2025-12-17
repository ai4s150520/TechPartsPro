export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error
    const status = error.response.status;
    const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
    
    if (status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
      return 'Please login to continue';
    }
    
    if (status === 403) {
      return 'You do not have permission to perform this action';
    }
    
    if (status === 404) {
      return 'Resource not found';
    }
    
    if (status === 500) {
      return 'Server error. Please try again later';
    }
    
    return message;
  }
  
  if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection';
  }
  
  return error.message || 'An unexpected error occurred';
};
