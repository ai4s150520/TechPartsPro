import React from 'react';
import SellerRegisterForm from '../../components/forms/RegisterForm'; // Reusing generic form
import { useNavigate } from 'react-router-dom';

const SellerRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
      <div className="max-w-2xl w-full bg-white p-8 rounded-xl shadow-lg border border-orange-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Seller Registration</h2>
          <p className="text-gray-500">Join the network</p>
        </div>
        {/* Pass isSeller=true to enable Business Name / GST fields */}
        <SellerRegisterForm onSuccess={() => navigate('/seller/login')} isSeller={true} />
      </div>
    </div>
  );
};

export default SellerRegisterPage;