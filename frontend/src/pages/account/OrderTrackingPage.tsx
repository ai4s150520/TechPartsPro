import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../lib/apiClient';
import AccountSidebar from '../../components/layout/AccountSidebar';

const OrderTrackingPage: React.FC = () => {
  const { id } = useParams();
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    apiClient.get(`/orders/${id}/track/`)
      .then(res => setTracking(res.data))
      .catch(err => {
        console.error('Tracking fetch error:', err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 text-center">Loading tracking...</div>;
  if (!tracking) return <div className="p-10 text-center">Tracking information not found</div>;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'SHIPPED': return <Truck className="w-6 h-6 text-blue-600" />;
      case 'PROCESSING': return <Package className="w-6 h-6 text-orange-600" />;
      default: return <Clock className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0 hidden md:block">
          <AccountSidebar />
        </aside>
        
        <main className="flex-1">
          <Link to="/account/orders" className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
          </Link>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Track Order #{tracking.order_id}</h1>
                <p className="text-gray-600">Current Status: <span className="font-semibold">{tracking.status}</span></p>
              </div>
              {getStatusIcon(tracking.status)}
            </div>

            {tracking.tracking_number && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-600 font-semibold">Tracking Number</p>
                <p className="text-blue-900 font-mono">{tracking.tracking_number}</p>
                {tracking.courier_name && (
                  <p className="text-sm text-blue-600">Courier: {tracking.courier_name}</p>
                )}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">Items in this order:</h3>
              {tracking.items.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-600">Status: {item.status}</p>
                  </div>
                  {item.tracking_number && (
                    <div className="text-right">
                      <p className="text-sm font-mono">{item.tracking_number}</p>
                      <p className="text-xs text-gray-500">{item.courier_name}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {tracking.estimated_delivery && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-green-800">
                  <strong>Estimated Delivery:</strong> {new Date(tracking.estimated_delivery).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderTrackingPage;