import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { orderAPI } from '../../services/api';
import { toast } from 'react-toastify';
import AccountSidebar from '../../components/layout/AccountSidebar';
// Import Centralized Helpers
import { formatPrice, getImageUrl } from '../../lib/utils';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState<string>('DEFECTIVE');
  const [returnDescription, setReturnDescription] = useState<string>('');
  const [returnImages, setReturnImages] = useState<File[]>([]);
  const [returnError, setReturnError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    orderAPI.get(id)
      .then(res => setOrder(res.data))
      .catch(err => {
        console.error('Order fetch error:', err);
      })
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
              <div className="flex items-center gap-3">
                {order.tracking_number && (
                  <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <p className="text-xs text-blue-600 font-bold uppercase">Tracking Number</p>
                    <p className="font-mono text-blue-900">{order.tracking_number} ({order.courier_name})</p>
                  </div>
                )}

                <div className="ml-4 flex items-center gap-2">
                  {order.cancellable && (
                    <button
                      onClick={async () => {
                        if (!confirm('Are you sure you want to cancel this order?')) return;
                        try {
                          await orderAPI.cancel(order.id);
                          toast.success('Order cancelled successfully');
                          window.location.reload();
                        } catch (err: any) {
                          toast.error(err?.response?.data?.error || 'Failed to cancel order');
                        }
                      }}
                      className="px-3 py-1 rounded border border-red-300 text-red-600 bg-white hover:bg-red-50 text-sm"
                    >
                      Cancel Order
                    </button>
                  )}

                  {order.cancellable && (
                    <button
                      onClick={() => setShowReturnModal(true)}
                      className="px-3 py-1 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-sm"
                    >
                      Return
                    </button>
                  )}
                </div>
              </div>
                  {showReturnModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                      <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowReturnModal(false)} />
                      <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md z-10">
                        <h3 className="text-lg font-bold mb-3">Request Return / Exchange</h3>
                        <p className="text-sm text-gray-600 mb-4">Returns accepted within 3 days of delivery. Please provide a reason and brief description (min 10 characters).</p>

                        {/* Check return window */}
                        {(() => {
                          const deliveredAt = new Date(order.updated_at);
                          const now = new Date();
                          const diffDays = Math.floor((now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24));
                          if (diffDays > 3) {
                            return (
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 mb-4">
                                Return window (3 days) has expired for this order. If you think this is an error, contact support.
                              </div>
                            );
                          }
                          return null;
                        })()}

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Reason</label>
                            <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2">
                              <option value="DEFECTIVE">Defective / Damaged</option>
                              <option value="WRONG_ITEM">Wrong Item Received</option>
                              <option value="NOT_AS_DESCRIBED">Not as Described</option>
                              <option value="SIZE_ISSUE">Size / Fit Issue</option>
                              <option value="CHANGED_MIND">Changed Mind</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea value={returnDescription} onChange={(e) => setReturnDescription(e.target.value)} rows={4} className="mt-1 block w-full border rounded px-3 py-2" />
                            <p className="text-xs text-gray-500 mt-1">Minimum 10 characters.</p>
                          </div>

                          {(returnReason === 'DEFECTIVE' || returnReason === 'WRONG_ITEM' || returnReason === 'NOT_AS_DESCRIBED') && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Upload evidence (images)</label>
                              <input type="file" accept="image/*" multiple onChange={(e) => {
                                const files = e.target.files ? Array.from(e.target.files) : [];
                                setReturnImages(files);
                              }} className="mt-1" />
                              <p className="text-xs text-gray-500 mt-1">Please upload one or more images showing the issue.</p>
                            </div>
                          )}

                          {returnError && <div className="text-sm text-red-600">{returnError}</div>}

                          <div className="flex gap-2 mt-2">
                            <button onClick={async () => {
                              // Validate
                              setReturnError(null);
                              const deliveredAt = new Date(order.updated_at);
                              const now = new Date();
                              const diffDays = Math.floor((now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24));
                              if (diffDays > 3) { setReturnError('Return window (3 days) has expired'); return; }
                              if (!returnDescription || returnDescription.trim().length < 10) { setReturnError('Please provide a description (at least 10 characters)'); return; }
                              if ((returnReason === 'DEFECTIVE' || returnReason === 'WRONG_ITEM' || returnReason === 'NOT_AS_DESCRIBED') && returnImages.length === 0) { setReturnError('Please upload images as evidence for this reason'); return; }

                              // Build payload
                              const items = order.items.map((it: any) => ({ order_item_id: it.id, quantity: it.quantity }));

                              try {
                                await import('../../services/api').then(mod => mod.returnAPI.create({
                                  order_id: order.order_id,
                                  items,
                                  reason: returnReason,
                                  description: returnDescription,
                                  images: returnImages,
                                }));
                                toast.success('Return request submitted');
                                setShowReturnModal(false);
                                window.location.reload();
                              } catch (err: any) {
                                setReturnError(err?.response?.data?.error || 'Failed to submit return request');
                              }
                            }} className="px-4 py-2 rounded bg-blue-600 text-white">Submit Request</button>

                            <button onClick={() => setShowReturnModal(false)} className="px-4 py-2 rounded border">Cancel</button>
                          </div>
                        </div>
                      </div>
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
                        <img 
                          src={item.product?.feature_image ? getImageUrl(item.product.feature_image) : 'https://placehold.co/64x64?text=?'} 
                          alt={item.product_name} 
                          className="w-full h-full object-contain" 
                          onError={(e) => { e.currentTarget.src = 'https://placehold.co/64x64?text=?'; }}
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
                  <p>{order.shipping_address.street_address}</p>
                  <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                  <p>Phone: {order.shipping_address.phone_number}</p>
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