'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { Package, Star, Phone, ImageIcon, QrCode } from 'lucide-react';
import { useDashboardData, useOrders, useRatings } from '@/lib/hooks/useDashboardData';
import RatingModal from '@/components/RatingModal';
import OrderDetailsModal from '@/components/OrderDetailsModal';
import toast from 'react-hot-toast';

export default function FarmerOrdersPage() {
  const { t } = useI18n();
  const { user } = useDashboardData('seller');
  const { orders, loading, updateOrderStatus } = useOrders(user?.id, 'seller');
  const { receivedRatings } = useRatings(user?.id, 'seller');
  
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<any>(null);
  const [orderRatings, setOrderRatings] = useState<{[key: number]: any}>({});
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<any>(null);

  useEffect(() => {
    const fetchOrderRatings = async () => {
      if (!user) return;
      const ratingsMap: {[key: number]: any} = {};
      for (const order of orders) {
        try {
          const response = await fetch(`/api/ratings?orderId=${order.id}`);
          const data = await response.json();
          const sellerRating = data.ratings?.find((r: any) => r.rater_id === user.id);
          if (sellerRating) {
            ratingsMap[order.id] = sellerRating;
          }
        } catch (error) {
          console.error(`Error fetching ratings for order ${order.id}:`, error);
        }
      }
      setOrderRatings(ratingsMap);
    };
    
    if (orders.length > 0) {
      fetchOrderRatings();
    }
  }, [orders, user]);

  const handleRateBuyer = (order: any) => {
    setSelectedOrderForRating(order);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (rating: number, review: string) => {
    if (!selectedOrderForRating || !user) return;

    try {
      const existingRating = orderRatings[selectedOrderForRating.id];
      const method = existingRating ? 'PUT' : 'POST';
      const body = existingRating 
        ? { ratingId: existingRating.id, raterId: user.id, rating, review }
        : {
            orderId: selectedOrderForRating.id,
            raterId: user.id,
            ratedId: selectedOrderForRating.buyer.id,
            raterType: 'seller',
            rating,
            review
          };

      const response = await fetch('/api/ratings', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      if (result.success) {
        setOrderRatings(prev => ({
          ...prev,
          [selectedOrderForRating.id]: result.rating
        }));
        toast.success(existingRating ? 'Rating updated successfully!' : 'Rating submitted successfully!');
      } else {
        toast.error(result.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Error submitting rating. Please check your connection and try again.');
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Package className="w-6 h-6 text-green-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
          </div>
          <div className="text-sm text-gray-600">
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading orders...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('status.noOrdersYet')}</h3>
            <p className="text-gray-500">{t('status.ordersWillAppear')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {order.product?.photos && order.product.photos.length > 0 ? (
                        <img
                          src={order.product.photos[0]}
                          alt={order.product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.product?.name}</h3>
                      <p className="text-sm text-gray-600">Order #{order.id}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.order_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-700">Buyer</p>
                    <p className="font-medium text-gray-900">{order.buyer?.name}</p>
                    <p className="text-sm text-gray-700">{order.buyer?.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Quantity & Price</p>
                    <p className="font-medium text-red-400">{order.quantity}kg × ₹{order.unit_price}</p>
                    <p className="text-lg font-semibold text-green-600">₹{order.total_price}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Delivery Address</p>
                    <p className="text-sm text-gray-700">{order.delivery_address}</p>
                  </div>
                </div>

                {order.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-700">Notes</p>
                    <p className="text-sm text-gray-700">{order.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {order.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                      >
                        Confirm Order
                      </button>
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {order.status === 'confirmed' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'shipped')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Mark as Shipped
                    </button>
                  )}
                  {order.status === 'shipped' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                    >
                      Mark as Delivered
                    </button>
                  )}
                  
                  <button 
                    onClick={() => {
                      setSelectedOrderForTracking(order);
                      setShowTrackingModal(true);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors flex items-center space-x-1"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>View Tracking</span>
                  </button>

                  <button 
                    onClick={() => handleRateBuyer(order)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      orderRatings[order.id] 
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {orderRatings[order.id] ? 'Update Rating' : 'Rate Buyer'}
                  </button>
                  
                  <button 
                    onClick={() => {
                      if (order.buyer?.phone_number) {
                        window.open(`tel:${order.buyer.phone_number}`, '_self');
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center space-x-1"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Contact Buyer</span>
                  </button>
                </div>

                {orderRatings[order.id] && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-yellow-800">Your Rating for Buyer:</span>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= orderRatings[order.id].rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-yellow-700">
                        {orderRatings[order.id].rating}/5
                      </span>
                    </div>
                    {orderRatings[order.id].review && (
                      <p className="text-sm text-yellow-700 mt-1">
                        "{orderRatings[order.id].review}"
                      </p>
                    )}
                  </div>
                )}

                {(() => {
                  const buyerRating = receivedRatings.find(r => r.order?.id === order.id);
                  return buyerRating ? (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-blue-800">Buyer's Rating & Review:</span>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= buyerRating.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-blue-700">
                          {buyerRating.rating}/5
                        </span>
                      </div>
                      {buyerRating.review && (
                        <p className="text-sm text-blue-700 mt-1">
                          "{buyerRating.review}"
                        </p>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      {showRatingModal && selectedOrderForRating && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedOrderForRating(null);
          }}
          onSubmit={handleRatingSubmit}
          existingRating={orderRatings[selectedOrderForRating.id]}
          orderDetails={selectedOrderForRating}
        />
      )}

      {showTrackingModal && selectedOrderForTracking && (
        <OrderDetailsModal
          isOpen={showTrackingModal}
          onClose={() => {
            setShowTrackingModal(false);
            setSelectedOrderForTracking(null);
          }}
          order={selectedOrderForTracking}
        />
      )}
    </>
  );
}
