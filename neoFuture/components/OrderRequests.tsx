'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Calendar, Users, Package, Clock, CheckCircle, XCircle, AlertCircle, Repeat, Settings, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderRequest {
  id: number;
  product_name: string;
  quantity: number;
  by_date: string;
  allow_multiple_farmers: boolean;
  description: string;
  max_price_per_unit: number | null;
  status: string;
  created_at: string;
  is_scheduled?: boolean;
  schedule_id?: number | null;
  order_applications?: OrderApplication[];
}

interface OrderSchedule {
  id: number;
  product_name: string;
  quantity: number;
  allow_multiple_farmers: boolean;
  description: string;
  max_price_per_unit: number | null;
  schedule_type: string;
  schedule_day: number | null;
  days_before_needed: number;
  is_active: boolean;
  next_execution_date: string;
  created_at: string;
}

interface OrderApplication {
  id: number;
  farmer_id: number;
  price_per_unit: number;
  available_quantity: number;
  delivery_date: string | null;
  notes: string;
  status: string;
  users: {
    name: string;
    phone_number: string;
  };
}

interface OrderRequestsProps {
  userId: number;
}

export default function OrderRequests({ userId }: OrderRequestsProps) {
  const [orderRequests, setOrderRequests] = useState<OrderRequest[]>([]);
  const [orderSchedules, setOrderSchedules] = useState<OrderSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'schedules'>('requests');
  const [formData, setFormData] = useState({
    product_name: '',
    quantity: '',
    by_date: '',
    allow_multiple_farmers: false,
    description: '',
    max_price_per_unit: ''
  });
  const [scheduleFormData, setScheduleFormData] = useState({
    product_name: '',
    quantity: '',
    allow_multiple_farmers: false,
    description: '',
    max_price_per_unit: '',
    schedule_type: 'monthly',
    schedule_day: '',
    days_before_needed: '7'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrderRequests();
    fetchOrderSchedules();
  }, []);

  const fetchOrderRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/order-requests?buyer_id=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setOrderRequests(data.orderRequests || []);
      } else {
        console.error('Failed to fetch order requests:', data.error);
      }
    } catch (error) {
      console.error('Error fetching order requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderSchedules = async () => {
    try {
      const response = await fetch(`/api/order-schedules?buyer_id=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setOrderSchedules(data.schedules || []);
      } else {
        console.error('Failed to fetch order schedules:', data.error);
      }
    } catch (error) {
      console.error('Error fetching order schedules:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/order-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyer_id: userId,
          product_name: formData.product_name,
          quantity: parseInt(formData.quantity),
          by_date: formData.by_date,
          allow_multiple_farmers: formData.allow_multiple_farmers,
          description: formData.description,
          max_price_per_unit: formData.max_price_per_unit ? parseFloat(formData.max_price_per_unit) : null
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Order request created successfully!');
        setShowCreateForm(false);
        setFormData({
          product_name: '',
          quantity: '',
          by_date: '',
          allow_multiple_farmers: false,
          description: '',
          max_price_per_unit: ''
        });
        fetchOrderRequests();
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating order request:', error);
      toast.error('Error creating order request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const isEditing = editingScheduleId !== null;
      const url = '/api/order-schedules';
      const method = isEditing ? 'PUT' : 'POST';
      
      const body: any = {
        buyer_id: userId,
        product_name: scheduleFormData.product_name,
        quantity: parseInt(scheduleFormData.quantity),
        allow_multiple_farmers: scheduleFormData.allow_multiple_farmers,
        description: scheduleFormData.description,
        max_price_per_unit: scheduleFormData.max_price_per_unit ? parseFloat(scheduleFormData.max_price_per_unit) : null,
        schedule_type: scheduleFormData.schedule_type,
        schedule_day: scheduleFormData.schedule_day ? parseInt(scheduleFormData.schedule_day) : null,
        days_before_needed: parseInt(scheduleFormData.days_before_needed)
      };

      if (isEditing) {
        body.schedule_id = editingScheduleId;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Order schedule ${isEditing ? 'updated' : 'created'} successfully!`);
        setShowScheduleForm(false);
        setEditingScheduleId(null);
        setScheduleFormData({
          product_name: '',
          quantity: '',
          allow_multiple_farmers: false,
          description: '',
          max_price_per_unit: '',
          schedule_type: 'monthly',
          schedule_day: '',
          days_before_needed: '7'
        });
        fetchOrderSchedules();
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving order schedule:', error);
      toast.error('Error saving order schedule. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleScheduleStatus = async (scheduleId: number, isActive: boolean) => {
    try {
      const response = await fetch('/api/order-schedules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedule_id: scheduleId,
          buyer_id: userId,
          is_active: !isActive
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Schedule ${!isActive ? 'activated' : 'paused'} successfully!`);
        fetchOrderSchedules();
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Error updating schedule. Please try again.');
    }
  };

  const handleEditSchedule = (schedule: OrderSchedule) => {
    setEditingScheduleId(schedule.id);
    setScheduleFormData({
      product_name: schedule.product_name,
      quantity: schedule.quantity.toString(),
      allow_multiple_farmers: schedule.allow_multiple_farmers,
      description: schedule.description || '',
      max_price_per_unit: schedule.max_price_per_unit?.toString() || '',
      schedule_type: schedule.schedule_type,
      schedule_day: schedule.schedule_day?.toString() || '',
      days_before_needed: schedule.days_before_needed.toString()
    });
    setShowScheduleForm(true);
  };

  const handleProcessSchedules = async (force = false) => {
    if (submitting) return;
    
    if (!force) {
      // Check if any schedules are actually due
      const today = new Date().toISOString().split('T')[0];
      const dueSchedules = orderSchedules.filter(s => s.is_active && s.next_execution_date <= today);
      
      if (dueSchedules.length === 0) {
        const nextDueDate = orderSchedules
          .filter(s => s.is_active)
          .map(s => s.next_execution_date)
          .sort()[0];
        
        if (nextDueDate) {
          const confirmForce = window.confirm(
            `No schedules are due for processing right now.\n\nNext scheduled execution: ${formatDate(nextDueDate)}\n\nWould you like to FORCE PROCESS all active schedules for testing purposes?\n\n⚠️ This will create order requests immediately regardless of schedule dates.`
          );
          
          if (confirmForce) {
            return handleProcessSchedules(true); // Recursive call with force=true
          }
        } else {
          toast('No active schedules found.');
        }
        return;
      }
    }
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/process-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force })
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.processed > 0) {
          toast.success(`Successfully processed ${data.processed} schedule(s)! ${force ? 'FORCE MODE: ' : ''}New order requests have been created.`);
        } else {
          toast(`${data.message}`);
        }
        fetchOrderRequests();
        fetchOrderSchedules();
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error processing schedules:', error);
      toast.error('Error processing schedules. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplicationAction = async (applicationId: number, status: string) => {
    try {
      const response = await fetch('/api/order-applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_id: applicationId,
          status,
          buyer_id: userId
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Application ${status} successfully!`);
        fetchOrderRequests();
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Error updating application. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ShoppingCart className="w-6 h-6 text-green-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Requests</h2>
            <p className="text-gray-600 text-sm mt-1">Request specific produce from farmers</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowScheduleForm(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            <Repeat className="w-4 h-4 mr-2" />
            Schedule Orders
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
            activeTab === 'requests'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Order Requests ({orderRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
            activeTab === 'schedules'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Repeat className="w-4 h-4 mr-2" />
          Scheduled Orders ({orderSchedules.length})
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header with close button */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Create Order Request</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-500"
                  placeholder="e.g., Fresh Tomatoes"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (kg) *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-500"
                  placeholder="e.g., 100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required By Date *
                </label>
                <input
                  type="date"
                  value={formData.by_date}
                  onChange={(e) => setFormData({...formData, by_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-500"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price per kg (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 font-medium">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.max_price_per_unit}
                    onChange={(e) => setFormData({...formData, max_price_per_unit: e.target.value})}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="50.00"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allow_multiple_farmers}
                    onChange={(e) => setFormData({...formData, allow_multiple_farmers: e.target.checked})}
                    className="mr-2 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Allow multiple farmers to apply</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-500 resize-none"
                  rows={3}
                  placeholder="Additional requirements or notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Form Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header with close button */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Repeat className="w-5 h-5 inline mr-2 text-purple-600" />
                {editingScheduleId ? 'Edit Schedule' : 'Schedule Recurring Orders'}
              </h3>
              <button
                onClick={() => {
                  setShowScheduleForm(false);
                  setEditingScheduleId(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={scheduleFormData.product_name}
                  onChange={(e) => setScheduleFormData({...scheduleFormData, product_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="e.g., Fresh Onions"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (kg) *
                </label>
                <input
                  type="number"
                  value={scheduleFormData.quantity}
                  onChange={(e) => setScheduleFormData({...scheduleFormData, quantity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="e.g., 100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Type *
                </label>
                <select
                  value={scheduleFormData.schedule_type}
                  onChange={(e) => setScheduleFormData({...scheduleFormData, schedule_type: e.target.value, schedule_day: ''})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>

              {scheduleFormData.schedule_type === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day of Month (1-31) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={scheduleFormData.schedule_day}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, schedule_day: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="e.g., 5 (for 5th of every month)"
                    required
                  />
                </div>
              )}

              {scheduleFormData.schedule_type === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day of Week *
                  </label>
                  <select
                    value={scheduleFormData.schedule_day}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, schedule_day: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Select day</option>
                    <option value="0">Sunday</option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days Before Needed *
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={scheduleFormData.days_before_needed}
                  onChange={(e) => setScheduleFormData({...scheduleFormData, days_before_needed: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="7"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">How many days before delivery to post the order request</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price per kg (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600 font-medium">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={scheduleFormData.max_price_per_unit}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, max_price_per_unit: e.target.value})}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="50.00"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={scheduleFormData.allow_multiple_farmers}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, allow_multiple_farmers: e.target.checked})}
                    className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Allow multiple farmers to apply</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={scheduleFormData.description}
                  onChange={(e) => setScheduleFormData({...scheduleFormData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  rows={3}
                  placeholder="Additional requirements or notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleForm(false);
                    setEditingScheduleId(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? (editingScheduleId ? 'Updating...' : 'Creating...') : (editingScheduleId ? 'Update Schedule' : 'Create Schedule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Requests List */}
      {activeTab === 'requests' && (
        <>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading order requests...</div>
            </div>
          ) : orderRequests.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Order Requests</h3>
              <p className="text-gray-500 mb-4">Create your first order request to get started</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                Create Order Request
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orderRequests.map((request) => (
                <div key={request.id} className={`border rounded-xl p-6 ${
                  request.is_scheduled 
                    ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-white' 
                    : 'border-gray-200'
                }`}>
                  {/* Scheduled Order Badge */}
                  {request.is_scheduled && (
                    <div className="flex items-center mb-3">
                      <Repeat className="w-4 h-4 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                        Auto-Generated Order
                      </span>
                    </div>
                  )}

                  {/* Request Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.product_name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-1" />
                          <span>{request.quantity} kg requested</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>By {formatDate(request.by_date)}</span>
                        </div>
                        {request.max_price_per_unit && (
                          <div className="flex items-center">
                            <span className="text-green-600 mr-1">₹</span>
                            <span>Max ₹{request.max_price_per_unit}/kg</span>
                          </div>
                        )}
                      </div>
                      {/* Fulfillment Status */}
                      {request.order_applications && request.order_applications.length > 0 && (() => {
                        const acceptedApps = request.order_applications.filter(app => app.status === 'accepted');
                        const totalAccepted = acceptedApps.reduce((sum, app) => sum + app.available_quantity, 0);
                        const remaining = Math.max(0, request.quantity - totalAccepted);
                        
                        if (totalAccepted > 0) {
                          return (
                            <div className="mt-2 text-sm">
                              <div className="flex items-center gap-4">
                                <span className="text-green-600 font-medium">
                                  {totalAccepted} kg confirmed
                                </span>
                                {remaining > 0 && (
                                  <span className="text-orange-600 font-medium">
                                    {remaining} kg still needed
                                  </span>
                                )}
                                {remaining === 0 && (
                                  <span className="text-green-600 font-medium">
                                    ✓ Fully fulfilled
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>

                  {/* Request Details */}
                  {request.description && (
                    <p className="text-gray-700 text-sm mb-4">{request.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{request.allow_multiple_farmers ? 'Multiple farmers allowed' : 'Single farmer only'}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Created {formatDate(request.created_at)}</span>
                    </div>
                  </div>

                  {/* Applications */}
                  {request.order_applications && request.order_applications.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Applications ({request.order_applications.length})
                      </h4>
                      <div className="space-y-3">
                        {request.order_applications.map((application) => (
                          <div key={application.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-gray-900">{application.users.name}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                    {application.status}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                  <div>Price: ₹{application.price_per_unit}/kg</div>
                                  <div>Can supply: {application.available_quantity} kg</div>
                                  {application.delivery_date && (
                                    <div>Delivery: {formatDate(application.delivery_date)}</div>
                                  )}
                                  {application.notes && (
                                    <div className="col-span-2">Notes: {application.notes}</div>
                                  )}
                                </div>
                              </div>
                              
                              {application.status === 'pending' && (
                                <div className="flex gap-2 ml-4">
                                  <button
                                    onClick={() => handleApplicationAction(application.id, 'accepted')}
                                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                    title="Accept"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleApplicationAction(application.id, 'rejected')}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Applications */}
                  {(!request.order_applications || request.order_applications.length === 0) && request.status === 'open' && (
                    <div className="border-t pt-4">
                      <div className="flex items-center text-gray-500 text-sm">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span>No applications yet. Farmers will be notified about your request.</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Order Schedules List */}
      {activeTab === 'schedules' && (
        <>
          {/* Process Schedules Button */}
          {orderSchedules.length > 0 && (() => {
            const today = new Date().toISOString().split('T')[0];
            const dueSchedules = orderSchedules.filter(s => s.is_active && s.next_execution_date <= today);
            const activeSchedules = orderSchedules.filter(s => s.is_active);
            const hasDueSchedules = dueSchedules.length > 0;
            
            return (
              <div className={`mb-4 p-4 rounded-xl border ${
                hasDueSchedules 
                  ? 'bg-orange-50 border-orange-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${hasDueSchedules ? 'text-orange-900' : 'text-blue-900'}`}>
                      {hasDueSchedules ? `⚠️ ${dueSchedules.length} Schedule(s) Due for Processing` : 'Schedule Processing'}
                    </h4>
                    <p className={`text-sm mt-1 ${hasDueSchedules ? 'text-orange-700' : 'text-blue-700'}`}>
                      {hasDueSchedules 
                        ? 'Click to generate order requests from schedules that are due today'
                        : `${activeSchedules.length} active schedule(s). Next due: ${activeSchedules.length > 0 ? formatDate(activeSchedules.map(s => s.next_execution_date).sort()[0]) : 'None'}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleProcessSchedules(false)}
                      disabled={submitting}
                      className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center ${
                        hasDueSchedules 
                          ? 'bg-orange-600 hover:bg-orange-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      {submitting ? 'Processing...' : (hasDueSchedules ? 'Process Now' : 'Check Status')}
                    </button>
                    {!hasDueSchedules && activeSchedules.length > 0 && (
                      <button
                        onClick={() => handleProcessSchedules(true)}
                        disabled={submitting}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
                        title="Force process all active schedules for testing"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Force Process
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading order schedules...</div>
            </div>
          ) : orderSchedules.length === 0 ? (
            <div className="text-center py-12">
              <Repeat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Orders</h3>
              <p className="text-gray-500 mb-4">Create your first recurring order schedule</p>
              <button
                onClick={() => setShowScheduleForm(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                Schedule Orders
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orderSchedules.map((schedule) => {
                const today = new Date().toISOString().split('T')[0];
                const isDue = schedule.is_active && schedule.next_execution_date <= today;
                
                return (
                  <div key={schedule.id} className={`border rounded-xl p-6 ${
                    isDue 
                      ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-white' 
                      : 'border-purple-200 bg-gradient-to-r from-purple-50 to-white'
                  }`}>
                    {/* Due Badge */}
                    {isDue && (
                      <div className="flex items-center mb-3">
                        <AlertCircle className="w-4 h-4 text-orange-600 mr-2" />
                        <span className="text-sm font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                          Due for Processing
                        </span>
                      </div>
                    )}
                    
                    {/* Schedule Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center mb-2">
                          <Repeat className="w-5 h-5 text-purple-600 mr-2" />
                          <h3 className="text-lg font-semibold text-gray-900">{schedule.product_name}</h3>
                        </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-1" />
                          <span>{schedule.quantity} kg</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>
                            {schedule.schedule_type === 'monthly' && `Every ${schedule.schedule_day}th of month`}
                            {schedule.schedule_type === 'weekly' && `Every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.schedule_day || 0]}`}
                            {schedule.schedule_type === 'daily' && 'Daily'}
                          </span>
                        </div>
                        {schedule.max_price_per_unit && (
                          <div className="flex items-center">
                            <span className="text-purple-600 mr-1">₹</span>
                            <span>Max ₹{schedule.max_price_per_unit}/kg</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <span>Next order: {formatDate(schedule.next_execution_date)}</span>
                        <span className="mx-2">•</span>
                        <span>Posts {schedule.days_before_needed} days before needed</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        schedule.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {schedule.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </div>

                  {/* Schedule Details */}
                  {schedule.description && (
                    <p className="text-gray-700 text-sm mb-4">{schedule.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{schedule.allow_multiple_farmers ? 'Multiple farmers allowed' : 'Single farmer only'}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Created {formatDate(schedule.created_at)}</span>
                    </div>
                  </div>

                  {/* Schedule Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => toggleScheduleStatus(schedule.id, schedule.is_active)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        schedule.is_active
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {schedule.is_active ? 'Pause Schedule' : 'Activate Schedule'}
                    </button>
                    <button 
                      onClick={() => handleEditSchedule(schedule)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 inline mr-1" />
                      Edit Schedule
                    </button>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}