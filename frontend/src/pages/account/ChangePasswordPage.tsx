import React, { useState } from 'react';
import AccountSidebar from '../../components/layout/AccountSidebar';
import { authService } from '../../lib/authService';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const ChangePasswordPage: React.FC = () => {
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
      await authService.changePassword({
        old_password: formData.oldPassword,
        new_password: formData.newPassword
      });
      setMsg({ type: 'success', text: "Password updated successfully!" });
      setFormData({ oldPassword: '', newPassword: '', confirmNew: '' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.old_password ? "Incorrect old password" : "Update failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <AccountSidebar />
        </aside>
        <main className="flex-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-lg">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Change Password</h1>
          
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
        </main>
      </div>
    </div>
  );
};

export default ChangePasswordPage;