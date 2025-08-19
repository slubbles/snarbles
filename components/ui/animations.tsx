'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, Download, Share } from 'lucide-react';

interface SuccessAnimationProps {
  message: string;
  onComplete?: () => void;
  duration?: number;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ 
  message, 
  onComplete, 
  duration = 2000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-background border border-green-500/30 rounded-lg p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="flex items-center gap-3">
          <div className="relative">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="absolute inset-0 w-8 h-8 rounded-full bg-green-500/20 animate-ping" />
          </div>
          <div>
            <p className="font-medium text-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">Operation completed successfully</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);

export const ProgressBar: React.FC<{
  value: number;
  max: number;
  label?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}> = ({ value, max, label, color = 'blue' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{value.toFixed(1)}%</span>
        </div>
      )}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ease-out ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const PulseCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    {children}
  </div>
);

export const FloatingActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left';
}> = ({ icon, label, onClick, position = 'bottom-right' }) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6'
  };

  return (
    <button
      onClick={onClick}
      className={`fixed ${positionClasses[position]} w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center z-40 group`}
      title={label}
    >
      {icon}
      <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-background border rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {label}
      </span>
    </button>
  );
};
