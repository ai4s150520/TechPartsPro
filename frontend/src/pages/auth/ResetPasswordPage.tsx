import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Backend sends these in the email link: /auth/reset-password?uid=...&token=...
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!uid || !token) {
      setError("Invalid or expired link.");
      return;
    }

    setLoading(true);

    try {
      // Assuming backend endpoint: POST /api/auth/password-reset-confirm/
      await apiClient.post('/auth/password-reset-confirm/', {
        uid,
        token,
        new_password: formData.password
      });
      setSuccess(true);
      setTimeout(() => navigate('/auth/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reset password. Link might be expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!uid || !token) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-red-600">
        Invalid Password Reset Link.
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        
        {!success ? (
          <>
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Set New Password</h2>
            
            {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input 
                label="New Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                helperText="Min 8 characters"
              />
              <Input 
                label="Confirm New Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
              <Button type="submit" isLoading={loading} className="w-full mt-4">
                Reset Password
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-2">Success!</h2>
            <p className="text-gray-600 mb-4">Your password has been updated.</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
            <Button onClick={() => navigate('/auth/login')} className="mt-4">
              Login Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;