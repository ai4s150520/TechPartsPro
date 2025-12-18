import React, { useState } from 'react';
import AccountSidebar from '../../components/layout/AccountSidebar';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../lib/authService';
import { toast } from 'react-toastify';

const SellerChangePasswordPage: React.FC = () => {
  const [formData, setFormData] = useState({ oldPassword: '', newPassword: '', confirmNew: '' });
  const [msg, setMsg] = useState<{type: 'error'|'success', text: string} | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmNew) {
      setMsg({ type: 'error', text: "New passwords do not match" });
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword({ old_password: formData.oldPassword, new_password: formData.newPassword });
      setMsg({ type: 'success', text: 'Password updated successfully!' });
      setFormData({ oldPassword: '', newPassword: '', confirmNew: '' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.response?.data?.detail || 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h1>

      <div className="flex gap-8">
        {/* Left: Account Sidebar in card */}
        <aside className="w-72">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Settings</h3>
            <AccountSidebar />
          </div>
        </aside>

        {/* Right: Narrow Change Password Card */}
        <main className="flex-1 flex justify-start">
          <div className="w-80 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Change Password</h2>

            {msg && (
              <div className={`p-3 rounded mb-4 text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Current Password" type="password" value={formData.oldPassword} onChange={e => setFormData({...formData, oldPassword: e.target.value})} required />
              <Input label="New Password" type="password" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} required />
              <Input label="Confirm New Password" type="password" value={formData.confirmNew} onChange={e => setFormData({...formData, confirmNew: e.target.value})} required />

              <Button type="submit" isLoading={loading} className="w-full mt-2">Update Password</Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerChangePasswordPage;