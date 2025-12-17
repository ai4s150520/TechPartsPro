import React from 'react';
import LoginForm from '../../components/forms/LoginForm';
import { useNavigate } from 'react-router-dom';

const SellerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 border-t-8 border-orange-600 py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900">Partner Login</h2>
          <p className="mt-2 text-sm text-slate-500">Access your business dashboard</p>
        </div>
        <LoginForm onSuccess={() => navigate('/seller/home')} isSeller={true} />
      </div>
    </div>
  );
};

export default SellerLoginPage;