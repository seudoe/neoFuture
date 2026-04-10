'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FarmerDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard overview page
    router.replace('/dashboard/farmer/overview');
  }, [router]);

  return null;
}
