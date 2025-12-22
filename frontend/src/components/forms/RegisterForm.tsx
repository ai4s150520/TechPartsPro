import React, { useState } from 'react';
import { authService } from '../../lib/authService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface RegisterFormProps {
  onSuccess: () => void;
  isSeller?: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, isSeller = false }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Seller Fields
    businessName: '',
    gstNumber: '',
    phone: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Construct Payload based on Backend Serializer (accounts/serializers.py)
      const payload: Record<string, unknown> = {
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phone,
        role: isSeller ? 'SELLER' : 'CUSTOMER'
      };

      if (isSeller) {
        payload.business_name = formData.businessName;
        payload.gst_number = formData.gstNumber;
      }

      await authService.register(payload);
      onSuccess();

    } catch (err: unknown) {
      console.error('Registration error:', err);
      
      const error = err as { response?: { data?: Record<string, unknown> }; message?: string };
      const errorData = error.response?.data || error;
      
      let errorMessage = '';
      if (typeof errorData === 'object' && errorData !== null) {
        Object.keys(errorData).forEach(key => {
          const value = errorData[key];
          if (Array.isArray(value)) {
            errorMessage += `${key}: ${value[0]} `;
          } else {
            errorMessage += `${key}: ${value} `;
          }
        });
      }
      
      setError(errorMessage || (errorData as { detail?: string })?.detail || error.message || "Registration failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
        <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
      </div>

      <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
      <Input label="Phone Number" type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+91..." />

      {isSeller && (
        <div className="p-4 bg-orange-50 rounded-lg space-y-3 border border-orange-100">
          <h4 className="font-bold text-orange-800 text-sm uppercase">Business Details</h4>
          <Input label="Business Name" name="businessName" value={formData.businessName} onChange={handleChange} required />
          <Input label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={handleChange} required placeholder="22AAAAA0000A1Z5" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} />
        <Input label="Confirm Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required minLength={8} />
      </div>

      <Button type="submit" isLoading={loading} variant={isSeller ? 'seller' : 'primary'} className="w-full">
        {isSeller ? 'Register Business' : 'Create Account'}
      </Button>
    </form>
  );
};

export default RegisterForm;