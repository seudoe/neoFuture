'use client';

import { Star, Award, TrendingUp, Package, ShoppingCart } from 'lucide-react';

interface UserStats {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: { [key: number]: number };
  totalOrders: number;
  completedOrders: number;
  totalValue: number;
  joinedDate: string;
  totalProducts?: number;
  activeProducts?: number;
}

interface UserRatingDisplayProps {
  stats: UserStats;
  userType: 'buyer' | 'seller';
  isLoading?: boolean;
}

export default function UserRatingDisplay({ stats, userType, isLoading }: UserRatingDisplayProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= Math.round(rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 3.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Fair';
    if (rating > 0) return 'Needs Improvement';
    return 'No ratings yet';
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Award className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {userType === 'seller' ? 'Farmer' : 'Buyer'} Rating
            </h3>
            <p className="text-sm text-gray-600">Based on {stats.totalRatings} reviews</p>
          </div>
        </div>
        
        {stats.averageRating > 0 && (
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-1">
              {renderStars(stats.averageRating, 'lg')}
              <span className={`text-2xl font-bold ${getRatingColor(stats.averageRating)}`}>
                {stats.averageRating.toFixed(1)}
              </span>
            </div>
            <p className={`text-sm font-medium ${getRatingColor(stats.averageRating)}`}>
              {getRatingLabel(stats.averageRating)}
            </p>
          </div>
        )}
      </div>

      {/* Rating Distribution */}
      {stats.totalRatings > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Rating Distribution</h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating] || 0;
              const percentage = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 w-12">
                    <span className="text-sm text-gray-600">{rating}</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
          <div className="flex items-center justify-center mb-2">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-lg font-semibold text-gray-900">{stats.totalOrders}</div>
          <div className="text-xs text-gray-600">Total Orders</div>
        </div>

        <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
          <div className="flex items-center justify-center mb-2">
            <Package className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-lg font-semibold text-gray-900">{stats.completedOrders}</div>
          <div className="text-xs text-gray-600">Completed</div>
        </div>

        <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-lg font-semibold text-gray-900">₹{stats.totalValue.toLocaleString()}</div>
          <div className="text-xs text-gray-600">Total Value</div>
        </div>

        {userType === 'seller' && stats.totalProducts !== undefined && (
          <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
            <div className="flex items-center justify-center mb-2">
              <Package className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-lg font-semibold text-gray-900">{stats.activeProducts}</div>
            <div className="text-xs text-gray-600">Active Products</div>
          </div>
        )}

        {userType === 'buyer' && (
          <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
            <div className="flex items-center justify-center mb-2">
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
            </div>
            <div className="text-xs text-gray-600">Success Rate</div>
          </div>
        )}
      </div>

      {/* Member Since */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          Member since {new Date(stats.joinedDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          })}
        </p>
      </div>
    </div>
  );
}