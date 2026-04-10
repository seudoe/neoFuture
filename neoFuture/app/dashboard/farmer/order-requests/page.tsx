'use client';

import { useDashboardData } from '@/lib/hooks/useDashboardData';
import FarmerOrderRequests from '@/components/FarmerOrderRequests';

export default function FarmerOrderRequestsPage() {
  const { user } = useDashboardData('seller');

  if (!user) return null;

  return <FarmerOrderRequests userId={user.id} />;
}
