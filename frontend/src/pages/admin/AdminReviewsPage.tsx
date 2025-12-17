import React, { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/reviews/').then(res => setReviews(res.data.results));
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await apiClient.delete(`/reviews/${id}/`);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      alert("Failed to delete");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Review Moderation</h1>
      
      <div className="grid gap-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-gray-900">{review.user_name}</span>
                <span className="text-gray-400">•</span>
                <div className="flex text-yellow-400 text-xs">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
              <h4 className="font-medium text-gray-800">{review.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
            </div>
            
            <button onClick={() => handleDelete(review.id)} className="text-gray-400 hover:text-red-600 transition h-fit p-2 rounded hover:bg-red-50">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminReviewsPage;