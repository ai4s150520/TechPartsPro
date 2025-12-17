import React, { useEffect, useState } from 'react';
import { Star, ThumbsUp, CheckCircle, User, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import Modal from '../ui/Modal';

interface Review {
  id: number;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  images: { id: number, image: string }[];
}

interface ReviewListProps {
  productSlug: string;
  productId: number;
}

const ReviewList: React.FC<ReviewListProps> = ({ productSlug, productId }) => {
  const { isAuthenticated } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch Reviews
  const fetchReviews = async () => {
    try {
      const res = await apiClient.get(`/reviews/?product_slug=${productSlug}`);
      setReviews(res.data.results);
    } catch (error) {
      console.error("Failed to load reviews", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productSlug) fetchReviews();
  }, [productSlug]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.info("Please login to review");
    
    setSubmitting(true);
    try {
      // POST to backend with productId
      await apiClient.post('/reviews/', {
        product: productId, 
        rating,
        title,
        comment
      });
      toast.success("Review Submitted Successfully!");
      setIsModalOpen(false);
      fetchReviews(); // Refresh list to show new review
      
      // Reset form
      setRating(5);
      setTitle('');
      setComment('');
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.response?.data?.non_field_errors?.[0] || "Failed to submit review";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: number) => {
    if (!isAuthenticated) return toast.info("Please login to vote");
    try {
      const res = await apiClient.post(`/reviews/${reviewId}/helpful/`);
      // Optimistic update
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpful_count: res.data.count } : r));
    } catch (error) {
      console.error("Vote failed");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading reviews...</div>;

  return (
    <div className="space-y-8">
      {/* Header with "Write Review" Button */}
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Customer Reviews</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < 4 ? 'fill-current' : 'text-gray-300'}`} /> // Simple average visual logic for now
              ))}
            </div>
            <span className="text-gray-500 font-medium">Based on {reviews.length} reviews</span>
          </div>
        </div>
        
        <Button onClick={() => setIsModalOpen(true)} variant="outline" className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Write a Review
        </Button>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-900 font-medium">No reviews yet</p>
          <p className="text-gray-500 text-sm mb-4">Be the first to share your thoughts on this product.</p>
          <Button onClick={() => setIsModalOpen(true)} size="sm">Write Review</Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    {review.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{review.user_name}</span>
                      {review.is_verified_purchase && (
                        <span className="flex items-center text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 font-medium">
                          <CheckCircle className="w-3 h-3 mr-1" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex text-yellow-400 text-xs mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>

              <h4 className="font-bold text-gray-800 text-sm mb-1">{review.title}</h4>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{review.comment}</p>

              {review.images.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {review.images.map((img) => (
                    <img 
                      key={img.id} 
                      src={img.image} 
                      alt="Review" 
                      className="w-16 h-16 object-cover rounded border border-gray-200" 
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 border-t border-gray-50 pt-4">
                <button 
                  onClick={() => handleHelpful(review.id)}
                  className="flex items-center text-xs text-gray-500 hover:text-blue-600 transition-colors group"
                >
                  <ThumbsUp className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" />
                  Helpful ({review.helpful_count})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Write Review Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Write a Review">
        <form onSubmit={handleSubmitReview} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star 
                    className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                  />
                </button>
              ))}
            </div>
          </div>

          <Input 
            label="Review Title" 
            placeholder="e.g. Great quality screen!" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
              rows={4}
              placeholder="Tell us what you liked or disliked..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={submitting}>Submit Review</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ReviewList;