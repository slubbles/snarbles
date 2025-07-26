import React from 'react';
import LiveAnalyticsDashboard from '@/components/dashboard/LiveAnalyticsDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics Dashboard | Snarbles',
  description: 'Real-time analytics and insights for the Snarbles token creation platform',
};

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      <LiveAnalyticsDashboard />
    </div>
  );
}
