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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header - Always on top for mobile */}
      <div className="lg:hidden">
        <DashboardHeader
          network={network}
          walletAddress={walletAddress}
          portfolioValue={stats.portfolioValue}
          totalTokens={stats.totalTokens}
          onRefresh={onRefresh}
          onMenuToggle={toggleSidebar}
          isMobile={true}
        />
      </div>

      <div className="flex lg:pt-0 pt-16">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-shrink-0">
          <DashboardSidebar
            network={network}
            isCollapsed={false}
            onToggleCollapse={() => {}}
          />
        </aside>

        {/* Mobile Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <DashboardSidebar
            network={network}
            isCollapsed={false}
            onToggleCollapse={closeSidebar}
            isMobile={true}
            onClose={closeSidebar}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop Header */}
          <div className="hidden lg:block">
            <DashboardHeader
              network={network}
              walletAddress={walletAddress}
              portfolioValue={stats.portfolioValue}
              totalTokens={stats.totalTokens}
              onRefresh={onRefresh}
              isMobile={false}
            />
          </div>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">
            <div className="container max-w-none p-3 sm:p-4 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
}
