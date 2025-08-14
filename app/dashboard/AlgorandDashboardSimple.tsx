'use client';

import { Button } from '@/components/ui/button';

export default function AlgorandDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Algorand Dashboard</h1>
        <p className="text-muted-foreground">Dashboard temporarily simplified for testing</p>
        <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
          Test Button
        </Button>
      </div>
    </div>
  );
}
