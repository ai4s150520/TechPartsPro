import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, Lock } from 'lucide-react';

// Replace with your actual Stripe Publishable Key (from Dashboard)
const stripePromise = loadStripe('pk_test_YOUR_PUBLISHABLE_KEY_HERE');

const PaymentForm = ({ clientSecret, orderId }: { clientSecret: string, orderId: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');
    
    // Confirm Payment
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      },
    });

    if (stripeError) {
      setError(stripeError.message || "Payment Failed");
      setLoading(false);
    } else if (paymentIntent.status === 'succeeded') {
      // Success! Redirect
      navigate('/order-success', { state: { orderId } });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200 mt-10">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
            <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Secure Payment</h2>
        <p className="text-sm text-gray-500">Order ID: {orderId}</p>
      </div>
      
      <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
        <CardElement options={{
          style: {
            base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
          },
        }}/>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2" /> {error}
        </div>
      )}

      <Button type="submit" disabled={!stripe || loading} isLoading={loading} className="w-full py-3">
        Pay Now
      </Button>
      
      <div className="mt-4 flex justify-center gap-2">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa"/>
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4" alt="Mastercard"/>
      </div>
    </form>
  );
};

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const { clientSecret, orderId } = location.state || {};

  if (!clientSecret || !orderId) {
      return <div className="p-10 text-center text-red-500">Invalid Payment Session. Please try checkout again.</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-gray-50 pt-10 px-4">
        <PaymentForm clientSecret={clientSecret} orderId={orderId} />
      </div>
    </Elements>
  );
};

export default PaymentPage;