'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { User, Target, Briefcase, TrendingUp, Package, CheckCircle, Star, Edit2, Save, X } from 'lucide-react';
import { useDashboardData, useRatings } from '@/lib/hooks/useDashboardData';
import UserRatingDisplay from '@/components/UserRatingDisplay';
import toast from 'react-hot-toast';

export default function FarmerProfilePage() {
  const { t } = useI18n();
  const { user } = useDashboardData('seller');
  const { userStats, loading: statsLoading } = useRatings(user?.id, 'seller');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone_number: '' });
  const [saving, setSaving] = useState(false);
  const [jobStats, setJobStats] = useState({ posted: 0, completed: 0, applied: 0, jobsCompleted: 0 });
  const [goals, setGoals] = useState({ monthlyRevenue: '' });
  const [savedGoals, setSavedGoals] = useState({ monthlyRevenue: 0 });
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
    fetchJobStats(user.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchGoals = async (userId: number) => {
    try {
      const res = await fetch(`/api/users/goals?userId=${userId}`);
      const data = await res.json();
      if (data.goals) {
        setSavedGoals({ monthlyRevenue: data.goals.monthlyRevenue || 0 });
        setGoals({ monthlyRevenue: String(data.goals.monthlyRevenue || '') });
      }
    } catch {}
  };

  const fetchJobStats = async (userId: number) => {
    try {
      const [postedRes, appliedRes] = await Promise.all([
        fetch(`/api/jobs?lister_id=${userId}`),
        fetch(`/api/jobs?worker_id=${userId}`)
      ]);
      const postedData = await postedRes.json();
      const appliedData = await appliedRes.json();
      const posted = postedData.jobs || [];
      const applications = appliedData.applications || [];
      setJobStats({
        posted: posted.length,
        completed: posted.filter((j: any) => j.status === 'closed').length,
        applied: applications.length,
        jobsCompleted: applications.filter((a: any) => a.status === 'completed').length,
      });
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
    const parsed = { monthlyRevenue: Number(goals.monthlyRevenue) || 0 };
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
  const totalRevenue = stats?.totalValue || 0;
  const completedOrders = stats?.completedOrders || 0;
  const totalOrders = stats?.totalOrders || 0;
  const activeProducts = stats?.activeProducts || 0;
  const totalProducts = stats?.totalProducts || 0;

  return (
    <div className="space-y-6">
      {stats && <UserRatingDisplay stats={stats} userType="seller" isLoading={statsLoading} />}

      {/* Profile Info */}
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
                <input type="text" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-green-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your name" />
              ) : (
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">{user.name}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.role')}</label>
              <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-800 font-medium capitalize">{user.role}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.emailAddress')}</label>
              {isEditing ? (
                <input type="email" value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-green-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-4 py-3 border border-green-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={handleCancel} disabled={saving}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <X className="w-4 h-4" />Cancel
                </button>
              </>
            ) : (
              <button onClick={handleEdit}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
                {t('forms.editProfile')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeProducts}</p>
          <p className="text-xs text-gray-500 mt-1">Active Listings</p>
          <p className="text-xs text-gray-400">{totalProducts} total</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{completedOrders}</p>
          <p className="text-xs text-gray-500 mt-1">Orders Completed</p>
          <p className="text-xs text-gray-400">{totalOrders} total</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Briefcase className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{jobStats.jobsCompleted}</p>
          <p className="text-xs text-gray-500 mt-1">Jobs Completed</p>
          <p className="text-xs text-gray-400">{jobStats.applied} applied</p>
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

      {/* Financial Summary */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Financial Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-green-700 mt-1">₹{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">from {completedOrders} completed orders</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">Jobs Posted</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{jobStats.posted}</p>
            <p className="text-xs text-gray-500 mt-1">{jobStats.completed} completed</p>
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
            <button onClick={() => setEditingGoals(true)} className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700">
              <Edit2 className="w-4 h-4" /> Set Goals
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={saveGoals} disabled={savingGoals} className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 disabled:opacity-50">
                <Save className="w-4 h-4" /> {savingGoals ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditingGoals(false)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          )}
        </div>
        {editingGoals ? (
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Revenue Target (₹)</label>
            <input type="number" value={goals.monthlyRevenue}
              onChange={e => setGoals({ monthlyRevenue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="e.g. 50000" />
          </div>
        ) : savedGoals.monthlyRevenue === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Target className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">No revenue goal set yet. Click "Set Goals" to get started.</p>
          </div>
        ) : (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Monthly Revenue Goal</span>
              <span className="font-medium text-gray-700">₹{totalRevenue.toLocaleString()} / ₹{savedGoals.monthlyRevenue.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-green-500 h-3 rounded-full transition-all duration-700"
                style={{ width: `${savedGoals.monthlyRevenue > 0 ? Math.min((totalRevenue / savedGoals.monthlyRevenue) * 100, 100) : 0}%` }}></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {savedGoals.monthlyRevenue > 0 ? Math.round((totalRevenue / savedGoals.monthlyRevenue) * 100) : 0}% of goal
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
