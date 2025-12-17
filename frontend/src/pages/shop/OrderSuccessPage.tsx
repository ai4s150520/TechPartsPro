import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Package } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const orderId = location.state?.orderId;

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No order found. <Link to="/" className="text-blue-600">Go Home</Link></p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-lg w-full border border-gray-100">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-500 mb-8">
          Thank you for your purchase. Your order <span className="font-mono font-bold text-gray-900">#{orderId}</span> has been received and is being processed.
        </p>

        <div className="bg-blue-50 p-4 rounded-lg mb-8 text-sm text-blue-700">
          We've sent a confirmation email to your registered address with the tracking details.
        </div>

        <div className="space-y-3">
          <Link to="/account/orders">
            <Button className="w-full flex items-center justify-center">
              <Package className="w-4 h-4 mr-2" /> Track Order
            </Button>
          </Link>
          <Link to="/shop">
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;