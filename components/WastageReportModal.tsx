'use client';

import { useState } from 'react';
import { X, AlertTriangle, Package, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface WastageReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSuccess: () => void;
}

export default function WastageReportModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: WastageReportModalProps) {
  // Use ordered_quantity if available, otherwise fall back to quantity
  const orderedQty = order.ordered_quantity || order.quantity || 0;
  
  const [deliveredQuantity, setDeliveredQuantity] = useState(orderedQty);
  const [wastedQuantity, setWastedQuantity] = useState(0);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const unitPrice = parseFloat(order.unit_price);
  const originalAmount = orderedQty * unitPrice;
  const adjustedAmount = deliveredQuantity * unitPrice;
  const savings = originalAmount - adjustedAmount;

  const handleSubmit = async () => {
    // Validation
    if (deliveredQuantity < 0 || wastedQuantity < 0) {
      toast.error('Quantities cannot be negative');
      return;
    }

    if (deliveredQuantity + wastedQuantity > orderedQty) {
      toast.error(`Total quantity cannot exceed ordered quantity (${orderedQty})`);
      return;
    }

    if (wastedQuantity > 0 && !reason.trim()) {
      toast.error('Please provide a reason for wastage');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/report-wastage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          buyerId: order.buyer_id,
          deliveredQuantity,
          wastedQuantity,
          reason: reason.trim() || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Delivery verified successfully!');
        if (wastedQuantity > 0) {
          toast.success(`Payment adjusted: Saved Rs ${savings.toFixed(2)}`);
        }
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting wastage report:', error);
      toast.error('Error submitting report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeliveredChange = (value: number) => {
    const delivered = Math.max(0, Math.min(value, orderedQty));
    setDeliveredQuantity(delivered);
    setWastedQuantity(orderedQty - delivered);
  };

  const handleWastedChange = (value: number) => {
    const wasted = Math.max(0, Math.min(value, orderedQty));
    setWastedQuantity(wasted);
    setDeliveredQuantity(orderedQty - wasted);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Verify Delivery</h2>
            <p className="text-sm text-gray-600">Order #{order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Order Summary</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-700">Product</p>
                <p className="font-medium text-blue-900">{order.product?.name}</p>
              </div>
              <div>
                <p className="text-blue-700">Ordered Quantity</p>
                <p className="font-medium text-blue-900">{orderedQty} kg</p>
              </div>
              <div>
                <p className="text-blue-700">Unit Price</p>
                <p className="font-medium text-blue-900">Rs {unitPrice.toFixed(2)}/kg</p>
              </div>
              <div>
                <p className="text-blue-700">Expected Amount</p>
                <p className="font-medium text-blue-900">Rs {originalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Verification Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivered Quantity (Good Condition)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max={orderedQty}
                  value={deliveredQuantity}
                  onChange={(e) => handleDeliveredChange(parseInt(e.target.value) || 0)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter delivered quantity"
                />
                <span className="text-gray-600 font-medium">kg</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wasted/Damaged Quantity
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max={orderedQty}
                  value={wastedQuantity}
                  onChange={(e) => handleWastedChange(parseInt(e.target.value) || 0)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter wasted quantity"
                />
                <span className="text-gray-600 font-medium">kg</span>
              </div>
            </div>

            {wastedQuantity > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Wastage <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Items were rotten, damaged during transport, missing items..."
                />
              </div>
            )}
          </div>

          {/* Calculation Summary */}
          <div className={`rounded-xl p-4 ${wastedQuantity > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              {wastedQuantity > 0 ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-900">Payment Adjustment</h3>
                </>
              ) : (
                <>
                  <Package className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Full Delivery Confirmed</h3>
                </>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Delivered:</span>
                <span className="font-medium">{deliveredQuantity} kg × Rs {unitPrice.toFixed(2)}</span>
              </div>
              {wastedQuantity > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Wastage:</span>
                  <span className="font-medium">-{wastedQuantity} kg</span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-lg">
                <span>Final Amount:</span>
                <span className="text-green-600">Rs {adjustedAmount.toFixed(2)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-green-600 text-sm">
                  <span>You save:</span>
                  <span className="font-medium">Rs {savings.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Warning */}
          {wastedQuantity > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Important Notice</p>
                <p>
                  By reporting wastage, you confirm that {wastedQuantity} kg of the product was 
                  damaged, rotten, or missing. This report cannot be edited after submission.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || (wastedQuantity > 0 && !reason.trim())}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Submitting...' : 'Confirm & Mark as Delivered'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
