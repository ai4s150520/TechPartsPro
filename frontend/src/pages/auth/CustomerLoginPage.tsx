import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { authService } from '../../lib/authService';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const CustomerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  
  // State
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Retrieve the page the user was trying to visit before being redirected to login
  // Default to '/' (Home) if no history exists
  const from = (location.state as any)?.from || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. API Call
      const data = await authService.login(formData);

      // 2. Role Validation
      // If a Seller tries to login here, deny them.
      if (data.user.role === 'SELLER') {
        setError("This account is registered as a Seller. Please use the Seller Portal.");
        setLoading(false);
        return;
      }

      // 3. Update Store
      login(data.user, data.access);

      // 4. Redirect Logic
      toast.success(`Welcome back, ${data.user.name || data.user.email}!`);
      navigate(from, { replace: true });

    } catch (err: any) {
      console.error("Login Failed:", err);
      const errorMsg = err.detail || "Invalid email or password. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
            <LogIn className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to access your orders and wishlist.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />

          <div>
            <Input 
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
            <div className="flex justify-end mt-1">
              <Link to="/auth/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-500 hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" isLoading={loading} className="w-full text-base py-3">
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/auth/register" className="font-bold text-blue-600 hover:text-blue-500 hover:underline">
              Create Account
            </Link>
          </p>
        </div>

        {/* Seller Link */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">For Vendors</p>
          <Link to="/seller/login" className="text-sm font-medium text-gray-500 hover:text-orange-600 transition-colors">
            Go to Seller Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default CustomerLoginPage;