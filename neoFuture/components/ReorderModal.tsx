'use client';

import { useState, useEffect } from 'react';
import { X, Package, User, MapPin, DollarSign } from 'lucide-react';

interface ReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onConfirm: (quantity: number) => void;
}

export default function ReorderModal({ isOpen, onClose, order, onConfirm }: ReorderModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      setQuantity(order.quantity); // Set original quantity as default
    }
  }, [isOpen, order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    setIsSubmitting(true);
    try {
      await onConfirm(quantity);
      onClose();
    } catch (error) {
      console.error('Error placing reorder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  const unitPrice = order.unit_price;
  const newTotalPrice = quantity * unitPrice;
  const originalTotal = order.total_price;
  const priceDifference = newTotalPrice - originalTotal;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Reorder Product</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Original Order Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
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
              <div>
                <h3 className="font-semibold text-gray-900">{order.product?.name}</h3>
                <p className="text-sm text-gray-600">Original Order #{order.id}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{order.seller?.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">₹{unitPrice}/kg</span>
              </div>
            </div>
            
            <div className="mt-2 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{order.delivery_address}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Quantity Adjustment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Adjust Quantity
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <span className="text-lg font-medium text-gray-600">−</span>
                </button>
                
                <div className="flex-1 text-center">
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center font-medium"
                  />
                  <div className="text-xs text-gray-700 mt-1">kg</div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <span className="text-lg font-medium text-gray-600">+</span>
                </button>
              </div>
              
              {/* Original vs New Comparison */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original:</span>
                    <span className="font-medium">{order.quantity}kg × ₹{unitPrice} = ₹{originalTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">New:</span>
                    <span className="font-medium">{quantity}kg × ₹{unitPrice} = ₹{newTotalPrice}</span>
                  </div>
                  {priceDifference !== 0 && (
                    <div className="flex justify-between border-t border-blue-300 pt-1 mt-2">
                      <span className="font-medium text-blue-800">Difference:</span>
                      <span className={`font-semibold ${priceDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {priceDifference > 0 ? '+' : ''}₹{priceDifference}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={quantity <= 0 || isSubmitting}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                  quantity <= 0 || isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Placing Order...' : `Reorder ${quantity}kg`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}