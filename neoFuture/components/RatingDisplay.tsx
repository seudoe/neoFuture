'use client';

import { Star, User } from 'lucide-react';

interface Rating {
  id: number;
  rating: number;
  review?: string;
  created_at: string;
  rater: {
    id: number;
    name: string;
  };
  order?: {
    id: number;
    product: {
      id: number;
      name: string;
    };
  };
}

interface RatingDisplayProps {
  ratings: Rating[];
  title: string;
  emptyMessage?: string;
}

export default function RatingDisplay({ ratings, title, emptyMessage }: RatingDisplayProps) {
  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
    : 0;

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {ratings.length > 0 && (
          <div className="flex items-center space-x-2">
            {renderStars(Math.round(averageRating), 'md')}
            <span className="text-sm text-gray-600">
              {averageRating.toFixed(1)} ({ratings.length} review{ratings.length !== 1 ? 's' : ''})
            </span>
          </div>
        )}
      </div>

      {ratings.length === 0 ? (
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{emptyMessage || 'No ratings yet'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div key={rating.id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{rating.rater.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {renderStars(rating.rating)}
                  <span className="text-sm font-medium text-gray-700">{rating.rating}/5</span>
                </div>
              </div>
              
              {rating.order && (
                <div className="text-xs text-gray-500 mb-2">
                  Order #{rating.order.id} - {rating.order.product.name}
                </div>
              )}
              
              {rating.review && (
                <p className="text-gray-700 text-sm leading-relaxed">{rating.review}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}