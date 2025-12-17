import React from 'react';
import ChangePasswordPage from '../account/ChangePasswordPage'; // Reuse

const SellerChangePasswordPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-xl border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Security Settings</h2>
      <ChangePasswordPage />
    </div>
  );
};

export default SellerChangePasswordPage;