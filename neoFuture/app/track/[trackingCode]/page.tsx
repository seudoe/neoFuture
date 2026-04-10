'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Package, MapPin, Phone, User, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import OrderTimeline from '@/components/OrderTimeline';
import Link from 'next/link';

interface TrackingData {
  trackingCode: string;
  currentStatus: string;
  orderDate: string;
  quantity: number;
  totalPrice: number;
  deliveryAddress: string;
  product: {
    name: string;
    category: string;
    photo: string | null;
  };
  seller: {
    name: string;
    phone: string;
  };
  timeline: Array<{
    status: string;
    timestamp: string;
    updated_by_type?: string;
    notes?: string;
    location?: string;
  }>;
}

export default function TrackingPage() {
  const params = useParams();
  const trackingCode = params.trackingCode as string;
  
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trackingCode) {
      fetchTrackingData();
    }
  }, [trackingCode]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tracking/${trackingCode}`);
      const data = await response.json();

      if (data.success) {
        setTracking(data.tracking);
      } else {
        setError(data.error || 'Failed to fetch tracking data');
      }
    } catch (err) {
      console.error('Error fetching tracking data:', err);
      setError('Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tracking Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The tracking code you entered is invalid or the order does not exist.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
                <p className="text-sm text-gray-600">Real-time delivery updates</p>
              </div>
            </div>
            <Link
              href="/"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Visit AgriTech
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tracking Code Banner */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90 mb-1">Tracking Number</div>
              <div className="text-2xl font-bold font-mono">{tracking.trackingCode}</div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90 mb-1">Order Date</div>
              <div className="text-lg font-semibold">
                {new Date(tracking.orderDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Product & Delivery Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Product Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Product Details</h3>
              
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {tracking.product.photo ? (
                    <img
                      src={tracking.product.photo}
                      alt={tracking.product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{tracking.product.name}</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                      {tracking.product.category}
                    </span>
                  </p>
                  <div className="text-sm text-gray-700">
                    <div>Quantity: <span className="font-medium">{tracking.quantity}kg</span></div>
                    <div>Total: <span className="font-semibold text-green-600">₹{tracking.totalPrice}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-green-600" />
                Delivery Address
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{tracking.deliveryAddress}</p>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-4 h-4 mr-2 text-green-600" />
                Seller Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-16">Name:</span>
                  <span className="font-medium text-gray-900">{tracking.seller.name}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-16">Phone:</span>
                  <a
                    href={`tel:${tracking.seller.phone}`}
                    className="font-medium text-green-600 hover:text-green-700 flex items-center"
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    {tracking.seller.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Need Help?</h4>
              <p className="text-xs text-blue-700 mb-3">
                If you have any questions about your order, contact the seller directly.
              </p>
              <a
                href={`tel:${tracking.seller.phone}`}
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Call Seller
              </a>
            </div>
          </div>

          {/* Right Column - Timeline */}
          <div className="lg:col-span-2">
            <OrderTimeline
              currentStatus={tracking.currentStatus}
              timeline={tracking.timeline}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-2">
            This is a public tracking page. No login required.
          </p>
          <p className="text-xs text-gray-500">
            Powered by AgriTech Platform • Secure & Transparent Supply Chain
          </p>
        </div>
      </div>
    </div>
  );
}
