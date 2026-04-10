'use client';

import { useState, useEffect } from 'react';
import { X, Package, MapPin, Phone, User, Calendar } from 'lucide-react';
import OrderQRCode from './OrderQRCode';
import OrderTimeline from './OrderTimeline';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export default function OrderDetailsModal({ isOpen, onClose, order }: OrderDetailsModalProps) {
  const [trackingLogs, setTrackingLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'qr'>('timeline');

  useEffect(() => {
    if (isOpen && order) {
      fetchTrackingLogs();
    }
  }, [isOpen, order]);

  const fetchTrackingLogs = async () => {
    if (!order?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/tracking/log?orderId=${order.id}`);
      const data = await response.json();
      
      if (data.success) {
        setTrackingLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching tracking logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Order Details</h2>
              <p className="text-sm text-gray-600">Order #{order.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mt-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'timeline'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📦 Tracking Timeline
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'qr'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📱 QR Code
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Order Summary Card */}
            <div className="lg:col-span-1 bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              {/* Product Info */}
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  {order.product?.photos && order.product.photos.length > 0 ? (
                    <img
                      src={order.product.photos[0]}
                      alt={order.product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{order.product?.name}</h4>
                  <p className="text-xs text-gray-600">{order.product?.category}</p>
                </div>
              </div>

              {/* Order Details */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-700">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-xs">
                    {new Date(order.order_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center text-gray-700">
                  <Package className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-xs">{order.quantity}kg × ₹{order.unit_price}</span>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Total Amount</span>
                    <span className="text-lg font-bold text-green-600">₹{order.total_price}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-gray-700">{order.delivery_address}</span>
                  </div>
                </div>

                {order.notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Special Instructions:</p>
                    <p className="text-xs text-gray-700">{order.notes}</p>
                  </div>
                )}
              </div>

              {/* Seller Info */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  Seller Information
                </h4>
                <div className="space-y-1 text-xs">
                  <p className="text-gray-700">{order.seller?.name}</p>
                  <a
                    href={`tel:${order.seller?.phone_number}`}
                    className="text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    {order.seller?.phone_number}
                  </a>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {activeTab === 'timeline' && (
                <div>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500">Loading tracking information...</div>
                    </div>
                  ) : trackingLogs.length > 0 ? (
                    <OrderTimeline
                      currentStatus={order.status}
                      timeline={trackingLogs}
                    />
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                      <p className="text-yellow-800">
                        No tracking information available yet. Tracking logs will appear as your order progresses.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'qr' && (
                <div>
                  {order.tracking_code ? (
                    <OrderQRCode
                      trackingCode={order.tracking_code}
                      orderId={order.id}
                      size={250}
                    />
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                      <p className="text-yellow-800 mb-4">
                        Tracking code not generated yet. Please contact support.
                      </p>
                      <button
                        onClick={async () => {
                          // Generate tracking code
                          try {
                            const response = await fetch('/api/setup-tracking', {
                              method: 'POST'
                            });
                            const data = await response.json();
                            if (data.success) {
                              window.location.reload();
                            }
                          } catch (error) {
                            console.error('Error generating tracking code:', error);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Generate Tracking Code
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
