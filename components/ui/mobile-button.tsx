import React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileOptimizedButtonProps extends ButtonProps {
  mobileEnhanced?: boolean;
  touchTarget?: 'standard' | 'large' | 'extra-large';
}

const MobileOptimizedButton = React.forwardRef<HTMLButtonElement, MobileOptimizedButtonProps>(
  ({ className, mobileEnhanced = true, touchTarget = 'standard', size = 'default', ...props }, ref) => {
    // Determine the optimal size based on mobile requirements
    const getMobileSize = () => {
      if (!mobileEnhanced) return size;
      
      switch (touchTarget) {
        case 'large':
          return 'lg';
        case 'extra-large':
          return 'xl';
        default:
          return size;
      }
    };

    return (
      <Button
        size={getMobileSize()}
        className={cn(
          mobileEnhanced && [
            // Mobile-specific optimizations
            "touch-manipulation", // Optimize touch interactions
            "transition-all duration-200", // Smooth interactions
            "active:scale-95", // Touch feedback
            "md:active:scale-100", // No scale on desktop
            // Better mobile spacing
            "px-6 md:px-4", // More horizontal padding on mobile
            "py-4 md:py-2", // More vertical padding on mobile
            // Enhanced focus states for mobile
            "focus:ring-4 md:focus:ring-2",
            "focus:ring-offset-4 md:focus:ring-offset-2",
          ],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

MobileOptimizedButton.displayName = "MobileOptimizedButton";

export { MobileOptimizedButton };
export type { MobileOptimizedButtonProps };
