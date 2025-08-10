'use client';

import { useState, ReactNode } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  network: 'algorand' | 'solana';
  walletAddress?: string;
  isConnected: boolean;
  isAdmin?: boolean;
  children: ReactNode;
  stats?: {
    portfolioValue?: number;
    totalTokens?: number;
    totalTransactions?: number;
  };
  onRefresh?: () => void;
}

export function DashboardLayout({
  network,
  walletAddress,
  isConnected,
  isAdmin = false,
  children,
  stats = {},
  onRefresh
}: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-transform",
        "lg:relative lg:translate-x-0"
      )}>
        <DashboardSidebar
          network={network}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <DashboardHeader
          network={network}
          walletAddress={walletAddress}
          portfolioValue={stats.portfolioValue}
          totalTokens={stats.totalTokens}
          onRefresh={onRefresh}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="container max-w-none p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
