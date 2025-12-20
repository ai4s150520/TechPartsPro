import LoginForm from '../../components/forms/LoginForm';
import SellerHeader from '../../components/layout/SellerHeader';
import { useNavigate } from 'react-router-dom';

const SellerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SellerHeader />
      <div className="flex-grow flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900">Partner Login</h2>
          <p className="mt-2 text-sm text-slate-500">Access your business dashboard</p>
        </div>
        <LoginForm onSuccess={() => navigate('/seller/home')} isSeller={true} />
      </div>
    </div>
  </div>
  );
};

export default SellerLoginPage;