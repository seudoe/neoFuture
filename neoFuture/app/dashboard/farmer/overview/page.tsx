'use client';

import { useDashboardData } from '@/lib/hooks/useDashboardData';
import Dashboard from '@/components/Dashboard';

export default function FarmerOverviewPage() {
  const { user, loading } = useDashboardData('seller');

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return <Dashboard userType="farmer" userId={user.id} userLocation={null} />;
}
