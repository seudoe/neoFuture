'use client';

import { useDashboardData } from '@/lib/hooks/useDashboardData';
import OrderRequests from '@/components/OrderRequests';

export default function BuyerOrderRequestsPage() {
  const { user } = useDashboardData('buyer');

  if (!user) return null;

  return <OrderRequests userId={user.id} />;
}
