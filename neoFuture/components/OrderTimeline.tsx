'use client';

import { CheckCircle, Circle, Package, Truck, Home, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TimelineEvent {
  status: string;
  timestamp: string;
  updated_by_type?: string;
  notes?: string;
  location?: string;
}

interface OrderTimelineProps {
  currentStatus: string;
  timeline: TimelineEvent[];
  compact?: boolean;
}

const statusConfig = {
  pending: {
    label: 'Order Placed',
    icon: Package,
    color: 'blue',
    description: 'Your order has been received'
  },
  confirmed: {
    label: 'Order Confirmed',
    icon: CheckCircle,
    color: 'green',
    description: 'Seller confirmed your order'
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'purple',
    description: 'Order is on the way'
  },
  delivered: {
    label: 'Delivered',
    icon: Home,
    color: 'green',
    description: 'Order delivered successfully'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'red',
    description: 'Order was cancelled'
  }
};

const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered'];

export default function OrderTimeline({ currentStatus, timeline, compact = false }: OrderTimelineProps) {
  const getStatusIndex = (status: string) => statusOrder.indexOf(status);
  const currentIndex = getStatusIndex(currentStatus);

  // Create a map of status to timeline event
  const timelineMap = new Map<string, TimelineEvent>();
  timeline.forEach(event => {
    if (!timelineMap.has(event.status)) {
      timelineMap.set(event.status, event);
    }
  });

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return {
        date: format(date, 'MMM dd, yyyy'),
        time: format(date, 'hh:mm a')
      };
    } catch {
      return { date: 'N/A', time: '' };
    }
  };

  const getStepStatus = (status: string, index: number) => {
    if (currentStatus === 'cancelled') {
      return status === 'cancelled' ? 'completed' : 'cancelled';
    }
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Order Tracking</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          currentStatus === 'delivered' ? 'bg-green-100 text-green-800' :
          currentStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
          currentStatus === 'shipped' ? 'bg-purple-100 text-purple-800' :
          currentStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {statusConfig[currentStatus as keyof typeof statusConfig]?.label || currentStatus}
        </div>
      </div>

      {/* Progress Bar */}
      {currentStatus !== 'cancelled' && (
        <div className="mb-8">
          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 transition-all duration-500"
              style={{ width: `${(currentIndex / (statusOrder.length - 1)) * 100}%` }}
            ></div>
            <div className="relative flex justify-between">
              {statusOrder.map((status, index) => {
                const stepStatus = getStepStatus(status, index);
                const config = statusConfig[status as keyof typeof statusConfig];
                const Icon = config.icon;
                
                return (
                  <div key={status} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      stepStatus === 'completed' ? 'bg-green-500 border-green-500' :
                      stepStatus === 'current' ? 'bg-white border-blue-500' :
                      'bg-white border-gray-300'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        stepStatus === 'completed' ? 'text-white' :
                        stepStatus === 'current' ? 'text-blue-500' :
                        'text-gray-400'
                      }`} />
                    </div>
                    <div className="text-xs font-medium text-gray-600 mt-2 text-center max-w-[80px]">
                      {config.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Timeline Events */}
      <div className="space-y-4">
        {statusOrder.map((status, index) => {
          const event = timelineMap.get(status);
          const config = statusConfig[status as keyof typeof statusConfig];
          const Icon = config.icon;
          const stepStatus = getStepStatus(status, index);
          
          if (!event && stepStatus === 'pending') {
            return (
              <div key={status} className="flex items-start opacity-50">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Circle className="w-5 h-5 text-gray-400" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-500">{config.label}</h4>
                    <span className="text-xs text-gray-400">Pending</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{config.description}</p>
                </div>
              </div>
            );
          }

          if (!event) return null;

          const { date, time } = formatTimestamp(event.timestamp);

          return (
            <div key={status} className="flex items-start">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                stepStatus === 'completed' ? 'bg-green-100' :
                stepStatus === 'current' ? 'bg-blue-100' :
                stepStatus === 'cancelled' ? 'bg-red-100' :
                'bg-gray-100'
              }`}>
                <Icon className={`w-5 h-5 ${
                  stepStatus === 'completed' ? 'text-green-600' :
                  stepStatus === 'current' ? 'text-blue-600' :
                  stepStatus === 'cancelled' ? 'text-red-600' :
                  'text-gray-400'
                }`} />
              </div>
              
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">{config.label}</h4>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-900">{time}</div>
                    <div className="text-xs text-gray-500">{date}</div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 mt-1">{config.description}</p>
                
                {event.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                    📝 {event.notes}
                  </div>
                )}
                
                {event.location && (
                  <div className="mt-1 text-xs text-gray-500">
                    📍 {event.location}
                  </div>
                )}
                
                {event.updated_by_type && (
                  <div className="mt-1 text-xs text-gray-400">
                    Updated by: {event.updated_by_type}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Cancelled Status */}
        {currentStatus === 'cancelled' && timelineMap.has('cancelled') && (
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Order Cancelled</h4>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-900">
                    {formatTimestamp(timelineMap.get('cancelled')!.timestamp).time}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTimestamp(timelineMap.get('cancelled')!.timestamp).date}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">This order has been cancelled</p>
              {timelineMap.get('cancelled')?.notes && (
                <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                  📝 {timelineMap.get('cancelled')!.notes}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Estimated Delivery (if not delivered/cancelled) */}
      {currentStatus !== 'delivered' && currentStatus !== 'cancelled' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <div className="text-sm font-medium text-blue-900">Estimated Delivery</div>
              <div className="text-xs text-blue-700">2-3 business days from confirmation</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
