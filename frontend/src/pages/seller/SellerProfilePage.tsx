import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Mail, Phone, MapPin, Save, Edit2, X, Shield, CheckCircle, XCircle, Send, Key } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authAPI } from '../../services/api';

const SellerProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    business_email: '',
    business_phone: '',
    warehouse_address: '',
    gst_number: '',
    pan_number: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    bank_account_holder_name: '',
    bank_name: '',
    aadhaar_number: '',
    pan_holder_name: '',
  });
  const [kycData, setKycData] = useState({
    aadhaar_verified: false,
    aadhaar_masked: '',
    pan_verified: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpModal, setOtpModal] = useState({ show: false, type: '', otp: '' });
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [forgotModal, setForgotModal] = useState({ show: false, email: '', loading: false });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await apiClient.get('/sellers/profile/');
      setFormData({
        business_name: data.business_name || '',
        business_email: data.business_email || '',
        business_phone: data.business_phone || '',
        warehouse_address: data.warehouse_address || '',
        gst_number: data.gst_number || '',
        pan_number: data.pan_number || '',
        bank_account_number: data.bank_account_number || '',
        bank_ifsc_code: data.bank_ifsc_code || '',
        bank_account_holder_name: data.bank_account_holder_name || '',
        bank_name: data.bank_name || '',
        aadhaar_number: '',
        pan_holder_name: data.pan_holder_name || '',
      });
      setKycData({
        aadhaar_verified: data.aadhaar_verified || false,
        aadhaar_masked: data.aadhaar_masked || '',
        pan_verified: data.pan_verified || false,
      });
    } catch (error) {
      console.error('Failed to load profile', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear field-level error on change
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.patch('/sellers/profile/', formData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
      fetchProfile();
    } catch (error: any) {
      // Map and display validation errors if present
      const resp = error.response?.data;
      if (error.response?.status === 400 && resp) {
        // resp may be { field: [msg] } or { detail: [msg] }
        const newErrors: Record<string, string> = {};
        if (typeof resp === 'object') {
          Object.keys(resp).forEach((key) => {
            const val = resp[key];
            if (Array.isArray(val)) newErrors[key] = String(val[0]);
            else if (typeof val === 'string') newErrors[key] = val;
          });
        }
        setErrors(newErrors);
        // Show summary toast
        if (newErrors.detail) {
          toast.error(Array.isArray(resp.detail) ? resp.detail.join(', ') : resp.detail);
        } else {
          const first = Object.values(newErrors)[0];
          toast.error(first || 'Failed to update profile');
        }
      } else {
        toast.error('Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (type: 'aadhaar' | 'pan') => {
    setVerifyLoading(true);
    try {
      const payload = type === 'aadhaar' 
        ? { aadhaar_number: formData.aadhaar_number }
        : { pan_number: formData.pan_number, pan_holder_name: formData.pan_holder_name };
      
      const { data } = await apiClient.post(`/accounts/kyc/${type}/send-otp/`, payload);
      toast.success(data.message);
      setOtpModal({ show: true, type, otp: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to send ${type.toUpperCase()} OTP`);
    } finally {
      setVerifyLoading(false);
    }
  };

  const verifyOTP = async () => {
    setVerifyLoading(true);
    try {
      const payload = otpModal.type === 'aadhaar'
        ? { aadhaar_number: formData.aadhaar_number, otp: otpModal.otp }
        : { pan_number: formData.pan_number, otp: otpModal.otp };
      
      const { data } = await apiClient.post(`/accounts/kyc/${otpModal.type}/verify-otp/`, payload);
      toast.success(data.message);
      setOtpModal({ show: false, type: '', otp: '' });
      fetchProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid OTP');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
          ) : (
            <Button onClick={() => setIsEditing(false)} variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
          )}

          <Link to="/seller/change-password">
            <Button variant="outline" className="hidden sm:inline-flex">
              <Key className="w-4 h-4 mr-2" /> Change Password
            </Button>
          </Link>

          <Button onClick={() => setForgotModal({ ...forgotModal, show: true, email: formData.business_email || user?.email || '' })} variant="ghost" className="text-sm">
            Forgot Password
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Business Name"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              icon={Store}
              disabled={!isEditing}
              required
              error={errors.business_name}
            />
            <Input
              label="Business Email"
              type="email"
              name="business_email"
              value={formData.business_email}
              onChange={handleChange}
              icon={Mail}
              disabled={!isEditing}
              required
              error={errors.business_email}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Business Phone"
              name="business_phone"
              value={formData.business_phone}
              onChange={handleChange}
              icon={Phone}
              disabled={!isEditing}
              required
              error={errors.business_phone}
            />
            <Input
              label="GST Number"
              name="gst_number"
              value={formData.gst_number}
              onChange={handleChange}
              placeholder="22AAAAA0000A1Z5"
              disabled={!isEditing}
              error={errors.gst_number}
            />
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-orange-600" />
              KYC Verification
            </h3>
            
            <div className="space-y-6">
              {/* Aadhaar Verification */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Aadhaar Number</label>
                  {kycData.aadhaar_verified ? (
                    <span className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4 mr-1" /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-500 text-sm">
                      <XCircle className="w-4 h-4 mr-1" /> Not Verified
                    </span>
                  )}
                </div>
                {kycData.aadhaar_verified ? (
                  <div className="text-sm text-gray-600">{kycData.aadhaar_masked}</div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      name="aadhaar_number"
                      value={formData.aadhaar_number}
                      onChange={handleChange}
                      placeholder="Enter 12-digit Aadhaar"
                      maxLength={12}
                      disabled={!isEditing}
                    />
                    {isEditing && formData.aadhaar_number.length === 12 && (
                      <Button type="button" onClick={() => sendOTP('aadhaar')} isLoading={verifyLoading}>
                        <Send className="w-4 h-4 mr-1" /> Verify
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* PAN Verification */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">PAN Number</label>
                  {kycData.pan_verified ? (
                    <span className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4 mr-1" /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-500 text-sm">
                      <XCircle className="w-4 h-4 mr-1" /> Not Verified
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  <Input
                    label="PAN Number"
                    name="pan_number"
                    value={formData.pan_number}
                    onChange={handleChange}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    disabled={!isEditing || kycData.pan_verified}
                    error={errors.pan_number}
                  />
                  {!kycData.pan_verified && (
                    <>
                      <Input
                        label="PAN Holder Name"
                        name="pan_holder_name"
                        value={formData.pan_holder_name}
                        onChange={handleChange}
                        placeholder="As per PAN card"
                        disabled={!isEditing}
                        error={errors.pan_holder_name}
                      />
                      {isEditing && formData.pan_number.length === 10 && formData.pan_holder_name && (
                        <Button type="button" onClick={() => sendOTP('pan')} isLoading={verifyLoading}>
                          <Send className="w-4 h-4 mr-1" /> Verify PAN
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Bank Account Details (For Payouts)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Account Holder Name"
                name="bank_account_holder_name"
                value={formData.bank_account_holder_name}
                onChange={handleChange}
                disabled={!isEditing}
                required
                error={errors.bank_account_holder_name}
              />
              <Input
                label="Bank Name"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="e.g., HDFC Bank"
                error={errors.bank_name}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Input
                label="Account Number"
                name="bank_account_number"
                value={formData.bank_account_number}
                onChange={handleChange}
                disabled={!isEditing}
                required
                error={errors.bank_account_number}
              />
              <Input
                label="IFSC Code"
                name="bank_ifsc_code"
                value={formData.bank_ifsc_code}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="e.g., HDFC0001234"
                required
                error={errors.bank_ifsc_code}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Warehouse Address
            </label>
            <textarea
              name="warehouse_address"
              value={formData.warehouse_address}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600"
              disabled={!isEditing}
              required
            />
            {errors.warehouse_address && (
              <div className="mt-1.5 flex items-center text-xs text-red-600">
                {errors.warehouse_address}
              </div>
            )}
          </div>

          {isEditing && (
            <Button type="submit" isLoading={loading} className="w-full md:w-auto">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          )}
        </form>
      </div>

      {/* OTP Modal */}
      {otpModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Enter OTP</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the 6-digit OTP sent to your registered mobile number
            </p>
            <Input
              label="OTP"
              value={otpModal.otp}
              onChange={(e) => setOtpModal({ ...otpModal, otp: e.target.value })}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
            />
            <div className="flex gap-3 mt-6">
              <Button
                onClick={verifyOTP}
                isLoading={verifyLoading}
                disabled={otpModal.otp.length !== 6}
                className="flex-1"
              >
                Verify OTP
              </Button>
              <Button
                onClick={() => setOtpModal({ show: false, type: '', otp: '' })}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {forgotModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Send Password Reset</h3>
            <p className="text-sm text-gray-600 mb-4">We'll send a password reset link to the provided email.</p>
            <Input
              label="Email"
              value={forgotModal.email}
              onChange={(e) => setForgotModal({ ...forgotModal, email: e.target.value })}
              placeholder="your@email.com"
            />
            <div className="flex gap-3 mt-6">
              <Button
                onClick={async () => {
                  setForgotModal({ ...forgotModal, loading: true });
                  try {
                    await authAPI.forgotPassword(forgotModal.email);
                    toast.success('Password reset link sent if account exists');
                    setForgotModal({ show: false, email: '', loading: false });
                  } catch (err: any) {
                    toast.error(err.response?.data?.detail || 'Failed to send reset link');
                    setForgotModal({ ...forgotModal, loading: false });
                  }
                }}
                isLoading={forgotModal.loading}
                className="flex-1"
              >
                Send Link
              </Button>
              <Button onClick={() => setForgotModal({ show: false, email: '', loading: false })} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProfilePage;
