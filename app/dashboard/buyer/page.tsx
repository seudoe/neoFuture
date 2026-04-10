'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BuyerDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard overview page
    router.replace('/dashboard/buyer/overview');
  }, [router]);

  return null;
}
