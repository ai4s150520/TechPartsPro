import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Truck, CreditCard, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCart } from '../../hooks/useCart';
import { useAddresses, useCreateAddress } from '../../hooks/useAddresses';
import { useCreateOrder } from '../../hooks/useOrders';
import OrderSummary from '../../components/checkout/OrderSummary';
import { Button } from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import AddressForm from '../../components/forms/AddressForm';
import { formatPrice, getImageUrl } from '../../lib/utils';
import { loadRazorpayScript } from '../../lib/razorpay';
import apiClient from '../../lib/apiClient';

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses, isLoading: addressesLoading, refetch: refetchAddresses } = useAddresses();
  const { mutate: createOrder, isPending: placingOrder } = useCreateOrder();
  
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Removed debug logs
  
  // Backend returns paginated response with 'results' array
  const addressList = Array.isArray(addresses) 
    ? addresses 
    : (addresses?.results || addresses?.data || []);
  const cartData = cart;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.warning('Please select a delivery address');
      return;
    }

    createOrder(
      { address_id: selectedAddress, payment_method: paymentMethod },
      {
        onSuccess: async (response: any) => {
          // Order response received
          const orderData = response?.data || response;
          const orderId = orderData?.order_id;
          
          // If COD, go directly to success
          if (paymentMethod === 'COD') {
            toast.success('Order placed successfully!');
            navigate('/order-success', { state: { orderId } });
            return;
          }
          
          // If CARD, initiate Razorpay payment
          if (paymentMethod === 'CARD' && orderData?.payment_required) {
            try {
              await loadRazorpayScript();
              const paymentResponse = await apiClient.post('/payments/create-order/', { 
                order_id: orderData.id 
              });
              
              const options = {
                key: paymentResponse.data.key,
                amount: paymentResponse.data.amount * 100,
                currency: paymentResponse.data.currency,
                name: 'TechPartsPro',
                description: `Order #${orderId}`,
                order_id: paymentResponse.data.id,
                handler: async (razorpayResponse: any) => {
                  try {
                    await apiClient.post('/payments/verify/', razorpayResponse);
                    toast.success('Payment successful!');
                    navigate('/order-success', { state: { orderId } });
                  } catch (err) {
                    toast.error('Payment verification failed');
                  }
                },
                prefill: {
                  email: cart?.user?.email || '',
                },
                theme: { color: '#2563eb' },
              };
              
              const razorpay = new window.Razorpay(options);
              razorpay.open();
            } catch (err) {
              console.error('Payment error:', err);
              toast.error('Failed to initialize payment');
            }
          }
        },
        onError: (error: any) => {
          console.error('Order error:', error);
          const errorMsg = error?.response?.data?.error || error?.response?.data?.message || 'Failed to place order';
          toast.error(errorMsg);
        },
      }
    );
  };

  if (cartLoading || addressesLoading) return <div className="p-10 text-center">Loading Checkout...</div>;
  if (!cartData) return null;

  const cartTotal = typeof cartData?.total_price === 'string' ? parseFloat(cartData.total_price) : (cartData?.total_price || 0);
  const taxAmount = cartTotal * 0.18;
  const finalTotal = cartTotal + taxAmount;

  const summaryItems = (cartData?.items || []).map((item: any) => ({
    id: item.id,
    product_id: item.product.id,
    product_name: item.product.name,
    product_image: getImageUrl(item.product.feature_image),
    price: item.product.price,
    quantity: item.quantity,
    subtotal: item.subtotal
  }));

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1 space-y-6">
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center"><MapPin className="w-5 h-5 mr-2 text-blue-600" /> Shipping Address</h2>
                <button onClick={() => setIsAddressModalOpen(true)} className="text-sm text-blue-600 font-medium hover:underline flex items-center">
                  <Plus className="w-4 h-4 mr-1" /> Add New
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(!addressList || addressList.length === 0) && <p className="text-gray-500 text-sm p-2">No addresses found. Add one to continue.</p>}
                {Array.isArray(addressList) && addressList.map((addr: any) => (
                  <div 
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedAddress === addr.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-bold text-gray-900">{addr.full_name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {addr.street_address}, {addr.city}<br/>
                      {addr.state} - {addr.postal_code}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Phone: {addr.phone_number}</div>
                  </div>
                ))}
              </div>
            </div>



            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold flex items-center mb-4"><CreditCard className="w-5 h-5 mr-2 text-blue-600" /> Payment</h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="payment" value="CARD" checked={paymentMethod === 'CARD'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-blue-600" />
                  <span className="ml-3 font-medium">Online Payment (Razorpay/UPI)</span>
                </label>
                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-blue-600" />
                  <span className="ml-3 font-medium">Cash on Delivery</span>
                </label>
              </div>
            </div>

            <Button 
              onClick={handlePlaceOrder}
              isLoading={placingOrder}
              disabled={!selectedAddress}
              className="w-full py-4 text-lg shadow-xl"
            >
              Place Order - {formatPrice(finalTotal)}
            </Button>

          </div>

          <div className="lg:w-96 shrink-0">
            <OrderSummary 
              items={summaryItems}
              subtotal={cartTotal}
              discount={0}
              shippingCost={0}
              taxAmount={taxAmount}
              total={finalTotal}
              isLoading={false}
            />
          </div>
        </div>
      </div>

      <Modal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} title="Add Address">
        <AddressForm 
          onSuccess={() => {
            setIsAddressModalOpen(false);
            refetchAddresses();
          }}
          onCancel={() => setIsAddressModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default CheckoutPage;