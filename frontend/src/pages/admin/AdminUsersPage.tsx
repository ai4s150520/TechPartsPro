import React, { useEffect, useState } from 'react';
import { UserX, UserCheck } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Assuming backend endpoint /accounts/users/ exists for admins
    apiClient.get('/accounts/users/')
      .then(res => setUsers(res.data.results))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleUserStatus = async (id: number, isActive: boolean) => {
    try {
      await apiClient.patch(`/accounts/users/${id}/`, { is_active: !isActive });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !isActive } : u));
    } catch (error) {
      alert("Failed to update user status");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Date Joined</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center">Loading...</td></tr>
            ) : users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{user.name || 'User'}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'SELLER' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(user.date_joined).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {user.is_active ? 'Active' : 'Banned'}
                </td>
                <td className="px-6 py-4">
                  {user.role !== 'ADMIN' && (
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      className={user.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                    >
                      {user.is_active ? <UserX className="w-4 h-4 mr-1" /> : <UserCheck className="w-4 h-4 mr-1" />}
                      {user.is_active ? 'Ban' : 'Unban'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage;