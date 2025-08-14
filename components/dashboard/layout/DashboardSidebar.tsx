'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard,
  Coins,
  BarChart3,
  Settings,
  HelpCircle,
  History,
  Wallet,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  Activity,
  X,
  Home
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  description?: string;
}

interface DashboardSidebarProps {
  network: 'algorand' | 'solana';
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ 
  network, 
  isCollapsed = false, 
  onToggleCollapse,
  isMobile = false,
  onClose 
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const sidebarItems: SidebarItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      href: `/dashboard/${network}`,
      description: 'Portfolio summary and quick stats'
    },
    {
      id: 'tokens',
      label: 'Token Management',
      icon: Coins,
      href: `/dashboard/${network}/tokens`,
      description: 'Manage your created tokens'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      href: `/dashboard/${network}/analytics`,
      description: 'Token performance and insights'
    },
    {
      id: 'transactions',
      label: 'Transaction History',
      icon: History,
      href: `/dashboard/${network}/transactions`,
      description: 'View all token transactions'
    },
    {
      id: 'holders',
      label: 'Holder Analytics',
      icon: Users,
      href: `/dashboard/${network}/holders`,
      description: 'Analyze token holders'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: `/dashboard/${network}/settings`,
      description: 'Dashboard preferences'
    }
  ];

  const supportItems: SidebarItem[] = [
    {
      id: 'help',
      label: 'Help & Support',
      icon: HelpCircle,
      href: '/support',
      description: 'Get help and documentation'
    }
  ];

  const networkInfo = {
    algorand: {
      name: 'Algorand',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    solana: {
      name: 'Solana',
      color: 'text-purple-400', 
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    }
  };

  const info = networkInfo[network];

  return (
    <div className={cn(
      "h-full bg-card border-r border-border flex flex-col transition-all duration-300",
      isMobile ? "w-64" : (isCollapsed ? "w-16" : "w-64")
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", info.bgColor, info.borderColor, "border")} />
              <span className={cn("font-semibold", info.color)}>
                {info.name} Dashboard
              </span>
            </div>
          )}
          
          {/* Mobile close button */}
          {isMobile && onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}

          {/* Desktop collapse button */}
          {onToggleCollapse && !isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile-specific navigation */}
      {isMobile && (
        <div className="px-4 py-2 border-b border-border">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      )}

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== `/dashboard/${network}` && pathname.startsWith(item.href));

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={isMobile ? onClose : undefined}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  "hover:bg-muted/50 hover:text-foreground",
                  isActive 
                    ? `bg-primary/10 ${info.color} border-l-2 ${info.borderColor.replace('border-', 'border-l-')}`
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={isCollapsed && !isMobile ? item.label : undefined}
              >
                <Icon className={cn(
                  "flex-shrink-0 w-5 h-5 transition-colors",
                  isActive ? info.color : "text-muted-foreground group-hover:text-foreground"
                )} />
                
                {(!isCollapsed || isMobile) && (
                  <>
                    <span className="ml-3 truncate">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Separator */}
        <div className="mx-4 my-4 border-t border-border" />

        {/* Support Section */}
        <nav className="space-y-1 px-2">
          {supportItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={isMobile ? onClose : undefined}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  "hover:bg-muted/50 hover:text-foreground",
                  isActive 
                    ? `bg-primary/10 ${info.color}`
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={isCollapsed && !isMobile ? item.label : undefined}
              >
                <Icon className={cn(
                  "flex-shrink-0 w-5 h-5 transition-colors",
                  isActive ? info.color : "text-muted-foreground group-hover:text-foreground"
                )} />
                
                {(!isCollapsed || isMobile) && (
                  <span className="ml-3 truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer - Network Status */}
      {(!isCollapsed || isMobile) && (
        <div className="p-4 border-t border-border">
          <div className={cn("rounded-lg p-3", info.bgColor, info.borderColor, "border")}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className={cn("w-4 h-4", info.color)} />
              <span className="text-sm font-medium text-foreground">Network Status</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Status:</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Online
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
