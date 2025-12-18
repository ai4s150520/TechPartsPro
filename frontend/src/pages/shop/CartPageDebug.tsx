import React from 'react';
import { useCart } from '../../hooks/useCart';

const CartPageDebug: React.FC = () => {
  const { data: cart, isLoading, error } = useCart();

  // Debug logs removed

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {JSON.stringify(error)}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Cart Debug</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(cart, null, 2)}
      </pre>
    </div>
  );
};

export default CartPageDebug;
