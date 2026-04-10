'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { Package, Star, Phone, ImageIcon, QrCode, AlertTriangle } from 'lucide-react';
import { useDashboardData, useOrders, useRatings } from '@/lib/hooks/useDashboardData';
import RatingModal from '@/components/RatingModal';
import ReorderModal from '@/components/ReorderModal';
import OrderDetailsModal from '@/components/OrderDetailsModal';
import ReceiptButton from '@/components/ReceiptButton';
import WastageReportModal from '@/components/WastageReportModal';
import toast from 'react-hot-toast';

export default function MyOrdersPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useDashboardData('buyer');
  const { orders, loading, updateOrderStatus, refetch } = useOrders(user?.id, 'buyer');
  const { receivedRatings } = useRatings(user?.id, 'buyer');
  
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<any>(null);
  const [orderRatings, setOrderRatings] = useState<{[key: number]: any}>({});
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [selectedOrderForReorder, setSelectedOrderForReorder] = useState<any>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<any>(null);
  const [showWastageModal, setShowWastageModal] = useState(false);
  const [selectedOrderForWastage, setSelectedOrderForWastage] = useState<any>(null);

  // Fetch ratings for orders
  useState(() => {
    const fetchOrderRatings = async () => {
      if (!user) return;
      const ratingsMap: {[key: number]: any} = {};
      for (const order of orders) {
        try {
          const response = await fetch(`/api/ratings?orderId=${order.id}`);
          const data = await response.json();
          const buyerRating = data.ratings?.find((r: any) => r.rater_id === user.id);
          if (buyerRating) {
            ratingsMap[order.id] = buyerRating;
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
  });

  const handleRateOrder = (order: any) => {
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
            ratedId: selectedOrderForRating.seller.id,
            raterType: 'buyer',
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

  const handleReorder = (order: any) => {
    setSelectedOrderForReorder(order);
    setShowReorderModal(true);
  };

  const handleConfirmReorder = async (quantity: number) => {
    if (!user || !selectedOrderForReorder) return;

    try {
      const order = selectedOrderForReorder;
      const newTotalPrice = quantity * order.unit_price;

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: user.id,
          sellerId: order.seller_id,
          productId: order.product_id,
          quantity: quantity,
          unitPrice: order.unit_price,
          totalPrice: newTotalPrice,
          deliveryAddress: order.delivery_address,
          notes: `Reorder of order #${order.id} (${quantity}kg)`
        })
      });

      const result = await response.json();
      if (result.success) {
        refetch();
        toast.success(`Reorder placed successfully! New order #${result.order.id} has been created for ${quantity}kg.`);
      } else {
        toast.error(result.error || 'Failed to place reorder');
      }
    } catch (error) {
      console.error('Error placing reorder:', error);
      toast.error('Error placing reorder. Please try again.');
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Package className="w-6 h-6 text-blue-600 mr-3" />
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
            <p className="text-gray-500 mb-4">{t('status.yourOrdersWillAppear')}</p>
            <button
              onClick={() => router.push('/dashboard/buyer/browse')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              {t('status.startShopping')}
            </button>
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
                        Ordered on {new Date(order.order_date).toLocaleDateString()}
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
                    <p className="text-sm text-gray-700">Seller</p>
                    <p className="font-medium text-gray-900">{order.seller?.name}</p>
                    <p className="text-sm text-gray-700">{order.seller?.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Quantity & Price</p>
                    {order.wasted_quantity && order.wasted_quantity > 0 ? (
                      <>
                        <p className="text-xs text-gray-500">Ordered: {order.ordered_quantity || order.quantity}kg</p>
                        <p className="font-medium text-green-600">Delivered: {order.delivered_quantity}kg × Rs {order.unit_price}</p>
                        <p className="text-xs text-red-500">Wasted: {order.wasted_quantity}kg</p>
                        <p className="text-lg font-semibold text-green-600">Rs {order.adjusted_amount || order.total_price}</p>
                        <p className="text-xs text-gray-500 line-through">Was: Rs {order.original_amount || order.total_price}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-red-400">{order.quantity}kg × Rs {order.unit_price}</p>
                        <p className="text-lg font-semibold text-blue-600">Rs {order.total_price}</p>
                      </>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Delivery Address</p>
                    <p className="text-sm text-gray-700">{order.delivery_address}</p>
                  </div>
                </div>

                {order.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Special Instructions</p>
                    <p className="text-sm text-gray-700">{order.notes}</p>
                  </div>
                )}

                {order.wasted_quantity && order.wasted_quantity > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-900">
                        Wastage Reported: {order.wasted_quantity}kg - 
                        You saved Rs {((order.original_amount || order.total_price) - (order.adjusted_amount || order.total_price)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
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

                  <ReceiptButton
                    orderId={order.id}
                    receiptUrl={order.receipt_url}
                    receiptGenerated={order.receipt_generated}
                    orderStatus={order.status}
                  />

                  <button 
                    onClick={() => handleRateOrder(order)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      orderRatings[order.id] 
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {orderRatings[order.id] ? 'Update Rating' : 'Rate & Review'}
                  </button>
                  
                  {order.status === 'shipped' && (
                    <button 
                      onClick={() => {
                        setSelectedOrderForWastage(order);
                        setShowWastageModal(true);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                    >
                      Verify & Mark as Delivered
                    </button>
                  )}
                  
                  {order.status === 'delivered' && (
                    <button 
                      onClick={() => handleReorder(order)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Reorder
                    </button>
                  )}
                  
                  {(order.status === 'pending' || order.status === 'confirmed') && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                    >
                      Cancel Order
                    </button>
                  )}
                  
                  <button 
                    onClick={() => {
                      if (order.seller?.phone_number) {
                        window.open(`tel:${order.seller.phone_number}`, '_self');
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center space-x-1"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Contact Seller</span>
                  </button>
                </div>

                {orderRatings[order.id] && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-yellow-800">Your Rating:</span>
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
                  const sellerRating = receivedRatings.find(r => r.order?.id === order.id);
                  return sellerRating ? (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-blue-800">Seller's Rating for You:</span>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= sellerRating.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-blue-700">
                          {sellerRating.rating}/5
                        </span>
                      </div>
                      {sellerRating.review && (
                        <p className="text-sm text-blue-700 mt-1">
                          "{sellerRating.review}"
                        </p>
                      )}
                    </div>
                  ) : null;
                })()}

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className={`flex items-center ${order.status === 'pending' || order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                      Order Placed
                    </div>
                    <div className={`flex items-center ${order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                      Confirmed
                    </div>
                    <div className={`flex items-center ${order.status === 'shipped' || order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                      Shipped
                    </div>
                    <div className={`flex items-center ${order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                      Delivered
                    </div>
                  </div>
                </div>
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

      {showReorderModal && selectedOrderForReorder && (
        <ReorderModal
          isOpen={showReorderModal}
          onClose={() => {
            setShowReorderModal(false);
            setSelectedOrderForReorder(null);
          }}
          onConfirm={handleConfirmReorder}
          order={selectedOrderForReorder}
        />
      )}

      {showWastageModal && selectedOrderForWastage && (
        <WastageReportModal
          isOpen={showWastageModal}
          onClose={() => {
            setShowWastageModal(false);
            setSelectedOrderForWastage(null);
          }}
          order={selectedOrderForWastage}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </>
  );
}
