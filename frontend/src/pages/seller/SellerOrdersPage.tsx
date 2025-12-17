import React, { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { formatPrice } from '../../lib/utils'; // Use formatter

const SellerOrdersPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // FIXED: Fetch from Seller specific endpoint
    apiClient.get('/sellers/orders/')
      .then(res => setItems(res.data.results))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders to Fulfill</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Product Name</th>
              <th className="px-6 py-4">Qty</th>
              <th className="px-6 py-4">Earnings</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">Loading orders...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">No orders found.</td></tr>
            ) : items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold text-gray-900">#{item.order_id}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(item.order_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{item.product_name}</td>
                <td className="px-6 py-4">{item.quantity}</td>
                <td className="px-6 py-4 font-bold text-green-600">
                  {formatPrice(parseFloat(item.price) * item.quantity)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    item.order_status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {item.order_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerOrdersPage;