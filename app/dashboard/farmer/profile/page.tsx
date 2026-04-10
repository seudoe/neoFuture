'use client';

import { useI18n } from '@/lib/i18n/context';
import { User, Save, X } from 'lucide-react';
import { useDashboardData, useRatings } from '@/lib/hooks/useDashboardData';
import UserRatingDisplay from '@/components/UserRatingDisplay';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function FarmerProfilePage() {
  const { t } = useI18n();
  const { user } = useDashboardData('seller');
  const { userStats, loading: statsLoading } = useRatings(user?.id, 'seller');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: ''
  });
  const [saving, setSaving] = useState(false);

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone_number: user.phone_number || ''
      });
    }
  }, [user]);

  const handleEdit = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone_number: user?.phone_number || ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone_number: user?.phone_number || ''
    });
  };

  const handleSave = async () => {
    if (!user) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...formData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update localStorage
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        
        // Reload page to reflect changes
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {userStats && (
        <UserRatingDisplay 
          stats={userStats.stats} 
          userType="seller" 
          isLoading={statsLoading}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
        <div className="flex items-center mb-6">
          <User className="w-6 h-6 text-green-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">{t('labels.information')} {t('navigation.profile')}</h2>
        </div>

        <div className="max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.fullName')}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-green-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your name"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                  {user.name}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.role')}</label>
              <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-800 font-medium capitalize">
                {user.role}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.emailAddress')}</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-green-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your email"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                  {user.email}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.phoneNumber')}</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-4 py-3 border border-green-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your phone number"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                  {user.phone_number || t('forms.notProvided')}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                {t('forms.editProfile')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
