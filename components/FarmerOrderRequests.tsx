'use client';

import { useState, useEffect } from 'react';
import { Bell, Package, Calendar, Users, Send, AlertCircle, CheckCircle, Clock, Repeat, X } from 'lucide-react';
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
  users: {
    name: string;
    phone_number: string;
  };
  order_applications: OrderApplication[];
}

interface OrderApplication {
  id: number;
  farmer_id: number;
  status: string;
}

interface FarmerOrderRequestsProps {
  userId: number;
}

export default function FarmerOrderRequests({ userId }: FarmerOrderRequestsProps) {
  const [orderRequests, setOrderRequests] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState<number | null>(null);
  const [applicationData, setApplicationData] = useState({
    price_per_unit: '',
    available_quantity: '',
    delivery_date: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrderRequests();
  }, []);

  const fetchOrderRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/order-requests?farmer_id=${userId}`);
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

  const handleApplicationSubmit = async (e: React.FormEvent, orderRequestId: number) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/order-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_request_id: orderRequestId,
          farmer_id: userId,
          price_per_unit: parseFloat(applicationData.price_per_unit),
          available_quantity: parseInt(applicationData.available_quantity),
          delivery_date: applicationData.delivery_date || null,
          notes: applicationData.notes
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Application submitted successfully!');
        setShowApplicationForm(null);
        setApplicationData({
          price_per_unit: '',
          available_quantity: '',
          delivery_date: '',
          notes: ''
        });
        fetchOrderRequests();
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Error submitting application. Please try again.');
    } finally {
      setSubmitting(false);
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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const hasUserApplied = (request: OrderRequest) => {
    return request.order_applications?.some(app => app.farmer_id === userId);
  };

  const getUserApplicationStatus = (request: OrderRequest) => {
    const userApp = request.order_applications?.find(app => app.farmer_id === userId);
    return userApp?.status || null;
  };

  const canApply = (request: OrderRequest) => {
    if (hasUserApplied(request)) return false;
    if (request.status !== 'open') return false;
    if (!request.allow_multiple_farmers && request.order_applications?.length > 0) return false;
    return true;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Bell className="w-6 h-6 text-green-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Requests</h2>
            <p className="text-gray-600 text-sm mt-1">Apply to buyer requests for produce</p>
          </div>
        </div>
        
        {orderRequests.filter(req => canApply(req)).length > 0 && (
          <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span>{orderRequests.filter(req => canApply(req)).length} new requests</span>
          </div>
        )}
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header with close button */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Submit Application</h3>
              <button
                onClick={() => setShowApplicationForm(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={(e) => handleApplicationSubmit(e, showApplicationForm)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Price per kg *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 font-medium">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={applicationData.price_per_unit}
                    onChange={(e) => setApplicationData({...applicationData, price_per_unit: e.target.value})}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="45.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Quantity (kg) *
                </label>
                <input
                  type="number"
                  value={applicationData.available_quantity}
                  onChange={(e) => setApplicationData({...applicationData, available_quantity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-500"
                  placeholder="e.g., 100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Date (Optional)
                </label>
                <input
                  type="date"
                  value={applicationData.delivery_date}
                  onChange={(e) => setApplicationData({...applicationData, delivery_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={applicationData.notes}
                  onChange={(e) => setApplicationData({...applicationData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-500 resize-none"
                  rows={3}
                  placeholder="Quality details, farming methods, etc..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Requests List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading order requests...</div>
        </div>
      ) : orderRequests.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Order Requests</h3>
          <p className="text-gray-500">No active order requests at the moment. Check back later!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orderRequests.map((request) => {
            const userStatus = getUserApplicationStatus(request);
            const canApplyToThis = canApply(request);
            
            return (
              <div key={request.id} className={`border rounded-xl p-6 ${
                request.is_scheduled 
                  ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-white' 
                  : request.status !== 'open'
                  ? 'border-gray-200 bg-gray-50 opacity-75'
                  : 'border-gray-200'
              }`}>
                {/* Scheduled Order Badge */}
                {request.is_scheduled && (
                  <div className="flex items-center mb-3">
                    <Repeat className="w-4 h-4 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      Recurring Order Request
                    </span>
                  </div>
                )}

                {/* Request Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{request.product_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">Requested by: {request.users.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-1" />
                        <span>{request.quantity} kg needed</span>
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
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === 'open' ? 'bg-green-100 text-green-800' :
                      request.status === 'closed' ? 'bg-gray-100 text-gray-600' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status}
                    </span>
                    {userStatus && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(userStatus)}`}>
                        Your application: {userStatus}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatDate(request.created_at)}
                    </span>
                  </div>
                </div>

                {/* Request Details */}
                {request.description && (
                  <p className="text-gray-700 text-sm mb-4">{request.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{request.allow_multiple_farmers ? 'Multiple farmers can apply' : 'Single farmer only'}</span>
                  </div>
                  {request.order_applications && request.order_applications.length > 0 && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{request.order_applications.length} application(s) received</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Contact: {request.users.phone_number}
                  </div>
                  
                  {canApplyToThis ? (
                    <button
                      onClick={() => setShowApplicationForm(request.id)}
                      className="flex items-center px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Accept Request
                    </button>
                  ) : userStatus ? (
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      <span>Application submitted</span>
                    </div>
                  ) : !request.allow_multiple_farmers && request.order_applications?.length > 0 ? (
                    <div className="flex items-center text-sm text-gray-500">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span>Application closed</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-gray-500">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span>Request closed</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}