import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../lib/authService';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface LoginFormProps {
  onSuccess: () => void; // Callback to parent (e.g., Close Modal or Redirect)
  isSeller?: boolean; // Changes API logic slightly if needed
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, isSeller = false }) => {
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. API Call
      const data = await authService.login(formData);

      // 2. Role Enforcement
      // Prevent Customer from logging into Seller Portal & Vice Versa
      if (isSeller && data.user.role !== 'SELLER') {
        throw { detail: "Access Denied. Not a Seller account." };
      }
      if (!isSeller && data.user.role === 'SELLER') {
        throw { detail: "Please use the Seller Login portal." };
      }

      // 3. Update Global State
      login(data.user, data.access);
      
      // 4. Trigger Parent Success Action
      onSuccess();

    } catch (err: any) {
      setError(err.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium border border-red-100">
          {error}
        </div>
      )}
      
      <Input 
        label="Email Address" 
        type="email" 
        value={formData.email} 
        onChange={(e) => setFormData({...formData, email: e.target.value})} 
        required 
        autoComplete="email"
      />
      
      <div>
        <Input 
          label="Password" 
          type="password" 
          value={formData.password} 
          onChange={(e) => setFormData({...formData, password: e.target.value})} 
          required 
          autoComplete="current-password"
        />
        <div className="flex justify-end mt-1">
          <Link to="/auth/forgot-password" className="text-xs text-blue-600 hover:underline">
            Forgot Password?
          </Link>
        </div>
      </div>

      <Button 
        type="submit" 
        isLoading={loading} 
        variant={isSeller ? 'seller' : 'primary'}
        className="w-full"
      >
        {isSeller ? 'Login to Dashboard' : 'Secure Login'}
      </Button>
    </form>
  );
};

export default LoginForm;