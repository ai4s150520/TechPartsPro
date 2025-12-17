import React, { useEffect, useState } from 'react';
import { Edit2, X, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import AccountSidebar from '../../components/layout/AccountSidebar';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import apiClient from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Load current profile
    apiClient.get('/auth/profile/').then(res => {
      setFormData({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        email: res.data.email || '',
        phone_number: res.data.phone_number || ''
      });
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.put('/auth/profile/', formData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
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
        <main className="flex-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">Personal Information</h1>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit2 className="w-4 h-4 mr-2" /> Edit
              </Button>
            ) : (
              <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="First Name" 
                value={formData.first_name} 
                onChange={(e) => setFormData({...formData, first_name: e.target.value})} 
                disabled={!isEditing}
              />
              <Input 
                label="Last Name" 
                value={formData.last_name} 
                onChange={(e) => setFormData({...formData, last_name: e.target.value})} 
                disabled={!isEditing}
              />
            </div>
            <Input 
              label="Email Address" 
              value={formData.email} 
              disabled 
              className="bg-gray-50 cursor-not-allowed"
              helperText="Email cannot be changed."
            />
            <Input 
              label="Phone Number" 
              value={formData.phone_number} 
              onChange={(e) => setFormData({...formData, phone_number: e.target.value})} 
              disabled={!isEditing}
            />
            
            {isEditing && (
              <Button type="submit" isLoading={loading} className="mt-4">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
          </form>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;