'use client';

import { useI18n } from '@/lib/i18n/context';
import { User } from 'lucide-react';
import { useDashboardData, useRatings } from '@/lib/hooks/useDashboardData';
import UserRatingDisplay from '@/components/UserRatingDisplay';
import RatingDisplay from '@/components/RatingDisplay';

export default function BuyerProfilePage() {
  const { t } = useI18n();
  const { user } = useDashboardData('buyer');
  const { receivedRatings, userStats, loading: statsLoading } = useRatings(user?.id, 'buyer');

  if (!user) return null;

  return (
    <div className="space-y-6">
      {userStats && (
        <UserRatingDisplay 
          stats={userStats.stats} 
          userType="buyer" 
          isLoading={statsLoading}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
        <div className="flex items-center mb-6">
          <User className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">{t('labels.information')} {t('navigation.profile')}</h2>
        </div>

        <div className="max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.fullName')}</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                {user.name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.role')}</label>
              <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 font-medium capitalize">
                {user.role}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.emailAddress')}</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                {user.email}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.phoneNumber')}</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                {user.phone_number || t('forms.notProvided')}
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              {t('forms.editProfile')}
            </button>
          </div>
        </div>
      </div>

      {receivedRatings.length > 0 && (
        <RatingDisplay
          ratings={receivedRatings}
          title="Reviews from Farmers"
          emptyMessage="No reviews from farmers yet."
        />
      )}
    </div>
  );
}
