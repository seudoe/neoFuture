'use client';

import { useI18n } from '@/lib/i18n/context';
import { Star } from 'lucide-react';
import { useDashboardData, useRatings } from '@/lib/hooks/useDashboardData';
import RatingDisplay from '@/components/RatingDisplay';

export default function ReviewsPage() {
  const { t } = useI18n();
  const { user } = useDashboardData('seller');
  const { receivedRatings } = useRatings(user?.id, 'seller');

  if (!user) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Star className="w-6 h-6 text-green-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Received Reviews</h2>
        </div>
      </div>

      <RatingDisplay
        ratings={receivedRatings}
        title="Reviews from Buyers"
        emptyMessage="No reviews yet. Complete some orders to receive reviews from buyers."
      />
    </div>
  );
}
