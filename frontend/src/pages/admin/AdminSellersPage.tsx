import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Shield } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';

const AdminSellersPage: React.FC = () => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      // Assuming GET /api/admin/sellers/ exists or we filter users by role
      const { data } = await apiClient.get('/accounts/users/?role=SELLER'); 
      setSellers(data.results);
    } catch (error) {
      console.error("Error fetching sellers", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (sellerId: number, currentStatus: boolean) => {
    try {
      // PATCH /api/accounts/seller-profile/{id}/
      await apiClient.patch(`/accounts/seller-profile/${sellerId}/`, {
        is_approved: !currentStatus
      });
      fetchSellers(); // Refresh list
    } catch (error) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <Shield className="w-6 h-6 mr-2 text-blue-600" /> Seller Management
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">Business Name</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Email</th>
              <th className="px-6 py-4 font-semibold text-gray-700">GST Number</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading sellers...</td></tr>
            ) : sellers.map((seller: any) => (
              <tr key={seller.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {seller.seller_profile?.business_name || 'N/A'}
                </td>
                <td className="px-6 py-4 text-gray-600">{seller.email}</td>
                <td className="px-6 py-4 font-mono text-xs">{seller.seller_profile?.gst_number || 'N/A'}</td>
                <td className="px-6 py-4">
                  {seller.seller_profile?.is_approved ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <Button 
                    size="sm"
                    variant={seller.seller_profile?.is_approved ? 'danger' : 'primary'}
                    onClick={() => toggleApproval(seller.seller_profile.id, seller.seller_profile.is_approved)}
                    className="flex items-center gap-1"
                  >
                    {seller.seller_profile?.is_approved ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    {seller.seller_profile?.is_approved ? 'Revoke' : 'Approve'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSellersPage;