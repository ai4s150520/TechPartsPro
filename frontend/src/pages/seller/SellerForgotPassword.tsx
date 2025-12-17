import React from 'react';
import ForgotPasswordPage from '../auth/ForgotPasswordPage'; // Reusing logic

const SellerForgotPassword: React.FC = () => {
  return (
    <div className="seller-theme">
      {/* 
        In a real app, you might wrap this to inject specific styling 
        or just reuse the component if logic is identical 
      */}
      <ForgotPasswordPage />
    </div>
  );
};

export default SellerForgotPassword;