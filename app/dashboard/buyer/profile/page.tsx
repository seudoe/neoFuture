'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { User, Target, ShoppingCart, TrendingUp, CheckCircle, Star, Edit2, Save, X, Clock } from 'lucide-react';
import { useDashboardData, useRatings } from '@/lib/hooks/useDashboardData';
import UserRatingDisplay from '@/components/UserRatingDisplay';
import RatingDisplay from '@/components/RatingDisplay';
import toast from 'react-hot-toast';

export default function BuyerProfilePage() {
  const { t } = useI18n();
  const { user } = useDashboardData('buyer');
  const { receivedRatings, userStats, loading: statsLoading } = useRatings(user?.id, 'buyer');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone_number: '' });
  const [saving, setSaving] = useState(false);
  const [goals, setGoals] = useState({ monthlySpend: '', ordersTarget: '', savingsTarget: '' });
  const [savedGoals, setSavedGoals] = useState({ monthlySpend: 0, ordersTarget: 0, savingsTarget: 0 });
  const [editingGoals, setEditingGoals] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || '', email: user.email || '', phone_number: user.phone_number || '' });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchGoals(user.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchGoals = async (userId: number) => {
    try {
      const res = await fetch(`/api/users/goals?userId=${userId}`);
      const data = await res.json();
      if (data.goals) {
        setSavedGoals(data.goals);
        setGoals({
          monthlySpend: String(data.goals.monthlySpend || ''),
          ordersTarget: String(data.goals.ordersTarget || ''),
          savingsTarget: String(data.goals.savingsTarget || ''),
        });
      }
    } catch {}
  };

  const handleEdit = () => {
    setFormData({ name: user?.name || '', email: user?.email || '', phone_number: user?.phone_number || '' });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ name: user?.name || '', email: user?.email || '', phone_number: user?.phone_number || '' });
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.name.trim()) { toast.error('Name is required'); return; }
    if (!formData.email.trim()) { toast.error('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { toast.error('Please enter a valid email'); return; }

    setSaving(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...formData })
      });
      const result = await response.json();
      if (result.success) {
        localStorage.setItem('user', JSON.stringify({ ...user, ...formData }));
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch {
      toast.error('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const saveGoals = async () => {
    if (!user) return;
    const parsed = {
      monthlySpend: Number(goals.monthlySpend) || 0,
      ordersTarget: Number(goals.ordersTarget) || 0,
      savingsTarget: Number(goals.savingsTarget) || 0,
    };
    setSavingGoals(true);
    try {
      await fetch('/api/users/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, goals: parsed }),
      });
      setSavedGoals(parsed);
      setEditingGoals(false);
    } catch {}
    setSavingGoals(false);
  };

  if (!user) return null;

  const stats = userStats?.stats;
  const totalSpend = stats?.totalValue || 0;
  const completedOrders = stats?.completedOrders || 0;
  const totalOrders = stats?.totalOrders || 0;
  const pendingOrders = totalOrders - completedOrders;

  const spendProgress = savedGoals.monthlySpend > 0 ? Math.min((totalSpend / savedGoals.monthlySpend) * 100, 100) : 0;
  const ordersProgress = savedGoals.ordersTarget > 0 ? Math.min((completedOrders / savedGoals.ordersTarget) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {stats && <UserRatingDisplay stats={stats} userType="buyer" isLoading={statsLoading} />}

      {/* Profile Info */}
      <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
        <div className="flex items-center mb-6">
          <User className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">{t('labels.information')} {t('navigation.profile')}</h2>
        </div>
        <div className="max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.fullName')}</label>
              {isEditing ? (
                <input type="text" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your name" />
              ) : (
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">{user.name}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.role')}</label>
              <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 font-medium capitalize">{user.role}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.emailAddress')}</label>
              {isEditing ? (
                <input type="email" value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email" />
              ) : (
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">{user.email}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.phoneNumber')}</label>
              {isEditing ? (
                <input type="tel" value={formData.phone_number}
                  onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number" />
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
                <button onClick={handleSave} disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={handleCancel} disabled={saving}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <X className="w-4 h-4" />Cancel
                </button>
              </>
            ) : (
              <button onClick={handleEdit}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                {t('forms.editProfile')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
          <p className="text-xs text-gray-500 mt-1">Total Orders</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{completedOrders}</p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
          <p className="text-xs text-gray-400">{totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}% rate</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
          <p className="text-xs text-gray-500 mt-1">Pending</p>
          <p className="text-xs text-gray-400">in progress</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Star className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.averageRating?.toFixed(1) || '0.0'}</p>
          <p className="text-xs text-gray-500 mt-1">Avg Rating</p>
          <p className="text-xs text-gray-400">{stats?.totalRatings || 0} reviews</p>
        </div>
      </div>

      {/* Spending Summary */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Spending Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">Total Spent</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">₹{totalSpend.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">across all orders</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">Avg Order Value</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              ₹{completedOrders > 0 ? Math.round(totalSpend / completedOrders).toLocaleString() : 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">per completed order</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">Success Rate</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">order completion</p>
          </div>
        </div>
      </div>

      {/* Financial Goals */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Target className="w-5 h-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Financial Goals</h3>
          </div>
          {!editingGoals ? (
            <button onClick={() => setEditingGoals(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              <Edit2 className="w-4 h-4" /> Set Goals
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={saveGoals} disabled={savingGoals} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50">
                <Save className="w-4 h-4" /> {savingGoals ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditingGoals(false)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          )}
        </div>
        {editingGoals ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Spend Budget (₹)</label>
              <input type="number" value={goals.monthlySpend}
                onChange={e => setGoals({ ...goals, monthlySpend: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 25000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orders Target</label>
              <input type="number" value={goals.ordersTarget}
                onChange={e => setGoals({ ...goals, ordersTarget: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Savings Target (₹)</label>
              <input type="number" value={goals.savingsTarget}
                onChange={e => setGoals({ ...goals, savingsTarget: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 5000" />
            </div>
          </div>
        ) : savedGoals.monthlySpend === 0 && savedGoals.ordersTarget === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Target className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">No goals set yet. Click "Set Goals" to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedGoals.monthlySpend > 0 && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Monthly Spend Budget</span>
                  <span className="font-medium text-gray-700">₹{totalSpend.toLocaleString()} / ₹{savedGoals.monthlySpend.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className={`h-3 rounded-full transition-all duration-700 ${spendProgress >= 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${spendProgress}%` }}></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">{Math.round(spendProgress)}% of budget used</p>
              </div>
            )}
            {savedGoals.ordersTarget > 0 && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Orders Completed</span>
                  <span className="font-medium text-gray-700">{completedOrders} / {savedGoals.ordersTarget}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full transition-all duration-700" style={{ width: `${ordersProgress}%` }}></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">{Math.round(ordersProgress)}% of goal</p>
              </div>
            )}
            {savedGoals.savingsTarget > 0 && (
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700">Savings Target: ₹{savedGoals.savingsTarget.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Track your savings by staying within your monthly budget.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {receivedRatings && receivedRatings.length > 0 && (
        <RatingDisplay
          ratings={receivedRatings}
          title="Reviews from Farmers"
          emptyMessage="No reviews from farmers yet."
        />
      )}
    </div>
  );
}
