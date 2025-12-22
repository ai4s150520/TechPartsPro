import React, { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { formatPrice } from '../../lib/utils';
import { sellerAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { connectNotifications } from '../../services/socket';

const SellerOrdersPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [couriers, setCouriers] = useState<any[]>([]);

  useEffect(() => {
    // Initial fetch and periodic refresh to reflect server-side status changes
    let mounted = true;

    const loadInitial = async () => {
      try {
        const res = await apiClient.get('/sellers/orders/');
        if (!mounted) return;
        setItems(res.data.results || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadInitial();

    // Load supported couriers for selection
    sellerAPI.getCouriers()
      .then(res => setCouriers(res.data || []))
      .catch(() => setCouriers([]));

    // Poll for updates so admin-side changes (e.g., Delivered) reflect here
    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get('/sellers/orders/');
        const fetched = res.data.results || [];
        setItems(prev => {
          // Merge fetched items with existing local state to preserve customer_addresses/show_addresses
          return fetched.map((fi: any) => {
            const old = prev.find(p => p.id === fi.id);
            return {
              ...fi,
              customer_addresses: old?.customer_addresses,
              show_addresses: old?.show_addresses || false,
            };
          });
        });
      } catch (err) {
        // ignore polling errors
      }
    }, 15000);

    // Setup websocket for real-time notifications (if user has JWT stored)
    let ws: WebSocket | null = null;
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        ws = connectNotifications(token, (data: any) => {
          if (data.type === 'notification') {
            const msg = data.message?.title || data.message?.body || 'Notification';
            toast.info(msg);
          }
          if (data.type === 'order_update') {
            setItems(prev => prev.map(i => i.id === String(data.order_id || i.id) ? { ...i, status: data.status } : i));
          }
        });
      }
    } catch (e) {
      // ignore websocket errors
    }

    return () => { mounted = false; clearInterval(interval); if (ws) ws.close(); };
  }, []);

  const handleViewAddresses = async (id: string) => {
    try {
      const existing = items.find(i => i.id === id);
      // If addresses already fetched, toggle visibility
      if (existing && existing.customer_addresses) {
        setItems(prev => prev.map(i => i.id === id ? { ...i, show_addresses: !i.show_addresses } : i));
        return;
      }

      const { data } = await sellerAPI.getCustomerAddresses(id);
      setItems(prev => prev.map(i => i.id === id ? { ...i, customer_addresses: data, show_addresses: true } : i));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to fetch customer addresses');
    }
  };

  const handlePack = async (id: string) => {
    try {
      await sellerAPI.packOrderItem(id);
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'PACKAGED' } : i));
      toast.success('Item marked as packaged');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to mark packaged');
    }
  };

  const handleShip = async (id: string) => {
    // If we have a pre-configured courier list, prompt selection
    let courier_name: string | undefined;
    if (couriers && couriers.length > 0) {
      const list = couriers.map((c, idx) => `${idx+1}. ${c.name}`).join('\n');
      const choice = window.prompt(`Select courier by number (or leave blank to type name):\n${list}`);
      if (choice) {
        const idx = parseInt(choice, 10) - 1;
        if (!isNaN(idx) && couriers[idx]) courier_name = couriers[idx].name;
        else courier_name = choice;
      }
    } else {
      courier_name = window.prompt('Enter courier name (optional)') || undefined;
    }

    const tracking = window.prompt('Enter tracking number (optional)');
    const daysStr = window.prompt('Estimated delivery in days (optional)');
    const data: any = {};
    if (tracking) data.tracking_number = tracking;
    if (courier_name) data.courier_name = courier_name;
    if (daysStr) data.estimated_days = Number(daysStr) || undefined;

    try {
      await sellerAPI.shipOrderItem(id, data);
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'SHIPPED', tracking_number: data.tracking_number || i.tracking_number, courier_name: data.courier_name || i.courier_name } : i));
      toast.success('Item marked as shipped');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to mark shipped');
    }
  };

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
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      item.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.status}
                    </span>
                    {/* Actions */}
                    {/* Removed manual shipping actions - status is updated from server/admin */}
                    <button onClick={() => handleViewAddresses(item.id)} className="text-sm text-gray-600 underline">
                      {item.show_addresses ? 'Hide Addresses' : 'View All Addresses'}
                    </button>
                  </div>
                  {/* Shipping address preview removed to avoid duplicate address display. Use the toggle above to show saved addresses. */}
                  {/* Customer saved addresses (if loaded) */}
                  {item.customer_addresses && item.customer_addresses.length > 0 && item.show_addresses && (
                    <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      <div className="font-semibold mb-1">Customer Saved Addresses</div>
                      {item.customer_addresses.map((a: any) => (
                        <div key={a.id} className="mb-2 border-b pb-2">
                          <div className="text-sm font-medium">{a.full_name} {a.is_default && <span className="text-xs text-green-600 ml-2">Default</span>}</div>
                          <div className="text-xs text-gray-600">{a.phone_number}</div>
                          <div className="text-xs text-gray-600">{a.street_address}, {a.city}, {a.state} - {a.postal_code}</div>
                        </div>
                      ))}
                    </div>
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

export default SellerOrdersPage;