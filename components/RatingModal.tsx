'use client';

import { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void;
  existingRating?: any;
  orderDetails: any;
}

export default function RatingModal({
  isOpen,
  onClose,
  onSubmit,
  existingRating,
  orderDetails
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setReview(existingRating.review || '');
    } else {
      setRating(0);
      setReview('');
    }
  }, [existingRating, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(rating, review);
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !orderDetails) return null;

  const order = orderDetails;
  // Determine target user based on what's available in the order
  const targetUser = order.seller || order.buyer || {};
  const targetUserType = order.seller ? 'seller' : 'buyer';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {existingRating ? 'Update Rating' : `Rate ${targetUserType === 'seller' ? 'Farmer' : 'Buyer'}`}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                {order.product?.photos && order.product.photos.length > 0 ? (
                  <img
                    src={order.product.photos[0]}
                    alt={order.product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-gray-400 text-xs">No Image</span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{order.product?.name || 'Product'}</h3>
                <p className="text-sm text-gray-600">Order #{order.id}</p>
                <p className="text-sm text-gray-600">{order.quantity}kg × ₹{order.unit_price}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p><span className="font-medium">{targetUserType === 'seller' ? 'Farmer' : 'Buyer'}:</span> {targetUser?.name || 'N/A'}</p>
              <p><span className="font-medium">Date:</span> {order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}</p>
              <p><span className="font-medium">Status:</span> <span className="capitalize">{order.status || 'N/A'}</span></p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rate your experience (1-5 stars)
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-colors"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review (Optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-900 placeholder-gray-500"
                placeholder={`Share your experience with this ${targetUserType}...`}
                maxLength={500}
              />
              <div className="text-xs text-gray-700 mt-1">
                {review.length}/500 characters
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                  rating === 0 || isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
