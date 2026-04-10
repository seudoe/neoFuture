'use client';

import { AlertTriangle, Package, CheckCircle } from 'lucide-react';

interface WastageInfoProps {
  order: any;
}

export default function WastageInfo({ order }: WastageInfoProps) {
  const hasWastage = order.wasted_quantity && order.wasted_quantity > 0;
  const orderedQty = order.ordered_quantity || order.quantity;
  const deliveredQty = order.delivered_quantity || orderedQty;
  const wastedQty = order.wasted_quantity || 0;

  if (!order.verification_status || order.verification_status === 'pending') {
    return null;
  }

  if (!hasWastage) {
    return (
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-green-900">Full Delivery Confirmed</p>
          <p className="text-green-700">
            Buyer confirmed receipt of all {orderedQty} kg in good condition.
          </p>
        </div>
      </div>
    );
  }

  const unitPrice = parseFloat(order.unit_price);
  const originalAmount = orderedQty * unitPrice;
  const adjustedAmount = deliveredQty * unitPrice;
  const deduction = originalAmount - adjustedAmount;

  return (
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-900">Wastage Reported by Buyer</p>
          <p className="text-sm text-yellow-700 mt-1">
            The buyer reported quality issues with this delivery.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
        <div className="bg-white rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-gray-600">Ordered</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{orderedQty} kg</p>
        </div>

        <div className="bg-white rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-gray-600">Delivered</span>
          </div>
          <p className="text-lg font-bold text-green-600">{deliveredQty} kg</p>
        </div>

        <div className="bg-white rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-gray-600">Wasted</span>
          </div>
          <p className="text-lg font-bold text-red-600">{wastedQty} kg</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-yellow-300">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-gray-700">Original Amount:</span>
          <span className="text-gray-500 line-through">Rs {originalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center font-bold">
          <span className="text-gray-900">Adjusted Payment:</span>
          <span className="text-green-600">Rs {adjustedAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-1">
          <span className="text-red-600">Deduction:</span>
          <span className="text-red-600">-Rs {deduction.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
