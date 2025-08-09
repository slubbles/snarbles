'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalyticsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin page with analytics tab selected
    router.replace('/admin?tab=analytics');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to Analytics...</p>
      </div>
    </div>
  );
}
