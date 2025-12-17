import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

const FlashSaleTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 45, seconds: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg">
      <Clock className="w-5 h-5 text-red-600" />
      <span className="text-sm font-medium text-gray-700">Ends in:</span>
      <div className="flex gap-1">
        <span className="bg-red-600 text-white px-2 py-1 rounded font-bold text-sm">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-red-600 font-bold">:</span>
        <span className="bg-red-600 text-white px-2 py-1 rounded font-bold text-sm">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-red-600 font-bold">:</span>
        <span className="bg-red-600 text-white px-2 py-1 rounded font-bold text-sm">{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
    </div>
  );
};

export default FlashSaleTimer;
