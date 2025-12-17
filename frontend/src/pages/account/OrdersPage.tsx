import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, PackageOpen, XCircle, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import AccountSidebar from '../../components/layout/AccountSidebar';
import { useOrders, useCancelOrder } from '../../hooks/useOrders';
import { formatPrice, getImageUrl } from '../../lib/utils';
import { OrderCardSkeleton } from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const OrdersPage: React.FC = () => {
  const { data, isLoading, error } = useOrders();
  const { mutate: cancelOrder, isPending: cancelling } = useCancelOrder();
  
  console.log('Orders data:', data);
  const orders = Array.isArray(data) ? data : (data?.results || []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      case 'SHIPPED': return 'bg-blue-100 text-blue-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const handleCancelOrder = (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    cancelOrder(orderId, {
      onSuccess: () => toast.success('Order cancelled successfully'),
      onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to cancel order'),
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <AccountSidebar />
        </aside>
        <main className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Order History</h1>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600">Failed to load orders. Please try again.</p>
              <p className="text-xs text-gray-500 mt-2">{error?.message}</p>
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              title="No orders yet"
              description="You haven't placed any orders. Browse our products and make your first purchase!"
              actionText="Browse Products"
              actionLink="/shop"
            />
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 text-lg">#{order.order_id}</span>
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString()} • {order.items.length} Items
                      </p>
                    </div>
                    <div className="text-right">
                      {/* CHANGED: Use formatPrice for ₹ Symbol */}
                      <p className="text-lg font-bold text-gray-900">{formatPrice(order.total_amount)}</p>
                    </div>
                  </div>
                  
                  {/* Preview Items */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4 gap-4">
                    <div className="flex gap-2">
                      {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancelling}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          {cancelling ? 'Cancelling...' : 'Cancel Order'}
                        </Button>
                      )}
                      {(order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                        <Link to={`/account/orders/${order.id}/track`}>
                          <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                            <MapPin className="w-4 h-4 mr-1" />
                            Track Order
                          </Button>
                        </Link>
                      )}
                    </div>
                    <div className="flex-1" />
                    <div className="flex -space-x-2 overflow-hidden">
                      {order.items.slice(0, 4).map((item: any) => (
                        <div key={item.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center overflow-hidden">
                           <img 
                             src={item.product?.feature_image ? getImageUrl(item.product.feature_image) : 'https://placehold.co/32x32?text=?'} 
                             alt={item.product_name || 'Product'} 
                             className="w-full h-full object-cover" 
                             onError={(e) => { e.currentTarget.src = 'https://placehold.co/32x32?text=?'; }}
                           />
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-bold">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>
                    <Link to={`/account/orders/${order.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center">
                      View Details <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OrdersPage;