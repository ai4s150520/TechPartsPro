import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import AccountSidebar from '../../components/layout/AccountSidebar';
// Import Centralized Helpers
import { formatPrice, getImageUrl } from '../../lib/utils';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/orders/${id}/`)
      .then(res => setOrder(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 text-center">Loading Order...</div>;
  if (!order) return <div className="p-10 text-center">Order not found</div>;

  // Status Progress Logic
  const steps = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const currentStep = steps.indexOf(order.status) === -1 ? 0 : steps.indexOf(order.status);

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

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Order #{order.order_id}</h1>
                <p className="text-sm text-gray-500">Placed on {new Date(order.created_at).toLocaleString()}</p>
              </div>
              {order.tracking_number && (
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <p className="text-xs text-blue-600 font-bold uppercase">Tracking Number</p>
                  <p className="font-mono text-blue-900">{order.tracking_number} ({order.courier_name})</p>
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <div className="relative flex justify-between items-center max-w-2xl mx-auto">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-0"></div>
                <div className={`absolute top-1/2 left-0 h-1 bg-green-500 -z-0 transition-all duration-500`} style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}></div>
                
                {steps.map((step, index) => (
                  <div key={step} className="relative z-10 flex flex-col items-center bg-gray-50 px-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${index <= currentStep ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                      {index <= currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
                    </div>
                    <span className="text-[10px] font-bold mt-2 text-gray-600">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Items */}
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-4">Items Ordered</h3>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 overflow-hidden">
                        {/* CHANGED: Use getImageUrl */}
                        <img 
                          src={getImageUrl(item.product_details?.feature_image)} 
                          alt={item.product_name} 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        {/* CHANGED: Use formatPrice */}
                        <p className="text-sm text-gray-500">
                          {formatPrice(item.price)} x {item.quantity}
                        </p>
                      </div>
                    </div>
                    {/* CHANGED: Use formatPrice */}
                    <p className="font-bold text-gray-900">{formatPrice(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Address */}
            <div className="bg-gray-50 p-6 border-t border-gray-100 grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center"><MapPin className="w-4 h-4 mr-2" /> Shipping Address</h4>
                <div className="text-sm text-gray-600 leading-relaxed">
                  <p className="font-medium text-gray-900">{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.street}</p>
                  <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                  <p>Phone: {order.shipping_address.phone}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  {/* CHANGED: Use formatPrice for Calculation */}
                  <span>{formatPrice(parseFloat(order.total_amount) + parseFloat(order.discount_amount))}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Discount</span>
                  {/* CHANGED: Use formatPrice */}
                  <span className="text-green-600">-{formatPrice(order.discount_amount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-900 pt-3 border-t border-gray-200">
                  <span>Total</span>
                  {/* CHANGED: Use formatPrice */}
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderDetailPage;