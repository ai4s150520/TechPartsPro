import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { authService } from '../../lib/authService';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const CustomerRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear specific field error when user types
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');

    // 1. Client-side Validation
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    if (formData.password.length < 8) {
      setErrors({ password: "Password must be at least 8 characters" });
      return;
    }

    setLoading(true);

    try {
      // 2. Prepare Payload (Match Backend Serializer)
      const payload = {
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phone,
        role: 'CUSTOMER'
      };

      // 3. API Call
      await authService.register(payload);

      // 4. Success -> Redirect
      // In production, you might show a "Check your email for verification" page instead.
      toast.success("Account created successfully! Please login.");
      navigate('/auth/login');

    } catch (err: any) {
      console.error("Registration Error:", err);
      
      // Handle Django Field Errors (returns object: { field: ['error'] })
      const fieldErrors: Record<string, string> = {};
      
      if (err.email) fieldErrors.email = err.email[0];
      if (err.password) fieldErrors.password = err.password[0];
      if (err.first_name) fieldErrors.firstName = err.first_name[0];
      if (err.phone_number) fieldErrors.phone = err.phone_number[0];
      
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setGlobalError(err.detail || "Registration failed. Please check your inputs.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-500">Join TechParts Pro today</p>
        </div>

        {globalError && (
          <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="First Name" 
              name="firstName" 
              value={formData.firstName} 
              onChange={handleChange} 
              error={errors.firstName}
              required 
            />
            <Input 
              label="Last Name" 
              name="lastName" 
              value={formData.lastName} 
              onChange={handleChange} 
              required 
            />
          </div>

          <Input 
            label="Email Address" 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            error={errors.email}
            required 
          />

          <Input 
            label="Phone Number (Optional)" 
            type="tel" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            error={errors.phone}
            placeholder="+91..."
          />

          <Input 
            label="Password" 
            type="password" 
            name="password" 
            value={formData.password} 
            onChange={handleChange} 
            error={errors.password}
            required 
            helperText="Min 8 chars, alphanumeric"
          />

          <Input 
            label="Confirm Password" 
            type="password" 
            name="confirmPassword" 
            value={formData.confirmPassword} 
            onChange={handleChange} 
            error={errors.confirmPassword}
            required 
          />

          <Button type="submit" isLoading={loading} className="w-full mt-4">
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/auth/login" className="font-bold text-blue-600 hover:text-blue-500 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegisterPage;