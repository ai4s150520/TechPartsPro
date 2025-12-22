import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, MapPin, ArrowLeft, ExternalLink } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { format } from 'date-fns';

interface TrackingUpdate {
  timestamp: string;
  location: string;
  status: string;
  description?: string;
}

interface Order {
  id: string;
  order_id: string;
  status: string;
  tracking_number?: string;
  courier_name?: string;
  estimated_delivery?: string;
  tracking_updates: TrackingUpdate[];
  created_at: string;
  shipping_address: any;
  items: any[];
  total_amount: number;
}

const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await apiClient.get(`/orders/${orderId}/`);
        setOrder(data);
      } catch (error) {
        console.error('Failed to load order', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const getStatusStep = (status: string) => {
    const steps = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    return steps.indexOf(status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'text-green-600 bg-green-50';
      case 'SHIPPED': return 'text-blue-600 bg-blue-50';
      case 'PROCESSING': return 'text-yellow-600 bg-yellow-50';
      case 'CANCELLED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <Link to="/account/orders" className="text-blue-600 hover:underline">
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getStatusStep(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Back Button */}
        <Link to="/account/orders" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Link>

        {/* Order Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Track Order</h1>
              <p className="text-gray-600">Order ID: <span className="font-semibold">{order.order_id}</span></p>
              <p className="text-sm text-gray-500">Placed on {format(new Date(order.created_at), 'MMM dd, yyyy')}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>

          {/* Multiple Shipments Info */}
          {order.items.some((item: any) => item.tracking_number) && (
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tracking Number</p>
                  <p className="font-semibold text-gray-900">{order.tracking_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Courier</p>
                  <p className="font-semibold text-gray-900">{order.courier_name || 'Not assigned'}</p>
                </div>
                {order.estimated_delivery && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Estimated Delivery</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(order.estimated_delivery), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </div>
              
              {order.courier_name && (
                <a
                  href={`https://www.google.com/search?q=${order.courier_name}+tracking+${order.tracking_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm mt-3"
                >
                  Track on {order.courier_name} website
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Progress Timeline */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Order Progress</h2>
          
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div 
              className="absolute left-6 top-0 w-0.5 bg-blue-600 transition-all duration-500"
              style={{ height: `${(currentStep / 3) * 100}%` }}
            ></div>

            {/* Steps */}
            <div className="space-y-8">
              {/* Order Placed */}
              <div className="relative flex items-start">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                  currentStep >= 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  <Package className="w-6 h-6" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold text-gray-900">Order Placed</h3>
                  <p className="text-sm text-gray-500">Your order has been confirmed</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(order.created_at), 'MMM dd, yyyy hh:mm a')}
                  </p>
                </div>
              </div>

              {/* Processing */}
              <div className="relative flex items-start">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                  currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  <Package className="w-6 h-6" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold text-gray-900">Processing</h3>
                  <p className="text-sm text-gray-500">Seller is preparing your order</p>
                </div>
              </div>

              {/* Shipped */}
              <div className="relative flex items-start">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                  currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  <Truck className="w-6 h-6" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold text-gray-900">Shipped</h3>
                  <p className="text-sm text-gray-500">Your order is on the way</p>
                </div>
              </div>

              {/* Delivered */}
              <div className="relative flex items-start">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                  currentStep >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold text-gray-900">Delivered</h3>
                  <p className="text-sm text-gray-500">Order has been delivered</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Updates */}
        {order.tracking_updates && order.tracking_updates.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Tracking History</h2>
            <div className="space-y-4">
              {order.tracking_updates.map((update, index) => (
                <div key={index} className="flex items-start border-l-2 border-blue-600 pl-4 py-2">
                  <MapPin className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{update.status}</p>
                        <p className="text-sm text-gray-600">{update.location}</p>
                        {update.description && (
                          <p className="text-sm text-gray-500 mt-1">{update.description}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 whitespace-nowrap ml-4">
                        {format(new Date(update.timestamp), 'MMM dd, hh:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shipping Address */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Address</h2>
          <div className="text-gray-600">
            <p className="font-semibold text-gray-900">{order.shipping_address.full_name}</p>
            <p>{order.shipping_address.address_line1}</p>
            {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
            <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
            <p className="mt-2">Phone: {order.shipping_address.phone_number}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
