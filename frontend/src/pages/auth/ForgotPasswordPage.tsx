import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Assuming backend endpoint: POST /api/auth/password-reset/
      await apiClient.post('/auth/password-reset/', { email });
      setIsSubmitted(true);
    } catch (err: any) {
      // Even if email is not found, security best practice is to NOT tell the user.
      // But for this dev phase, we might show errors.
      // Ideally: Always show success to prevent email enumeration.
      setIsSubmitted(true); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        {!isSubmitted ? (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
              <p className="mt-2 text-sm text-gray-500">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input 
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                startIcon={<Mail className="w-4 h-4" />}
                placeholder="you@example.com"
              />
              <Button type="submit" isLoading={loading} className="w-full">
                Send Reset Link
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Check your email</h3>
            <p className="mt-2 text-sm text-gray-500">
              We have sent a password reset link to <strong>{email}</strong>.
            </p>
            <p className="mt-4 text-xs text-gray-400">
              Did not receive the email? Check your spam filter.
            </p>
          </div>
        )}

        <div className="mt-6 text-center border-t border-gray-100 pt-4">
          <Link to="/auth/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;