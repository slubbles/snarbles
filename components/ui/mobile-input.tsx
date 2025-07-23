import React from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MobileOptimizedInputProps extends InputProps {
  mobileEnhanced?: boolean;
}

const MobileOptimizedInput = React.forwardRef<HTMLInputElement, MobileOptimizedInputProps>(
  ({ className, mobileEnhanced = true, ...props }, ref) => {
    return (
      <Input
        className={cn(
          mobileEnhanced && [
            // Mobile-specific optimizations
            "min-h-[48px] md:min-h-[44px]", // Larger touch targets on mobile
            "text-base md:text-sm", // Prevent zoom on iOS
            "px-4 md:px-3", // More padding on mobile
            "py-3 md:py-2", // More vertical padding on mobile
            "touch-manipulation", // Optimize touch interactions
            "transition-all duration-200", // Smooth interactions
            // Better mobile focus states
            "focus:scale-[1.02] md:focus:scale-100",
            "focus:shadow-lg md:focus:shadow-sm",
          ],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

MobileOptimizedInput.displayName = "MobileOptimizedInput";

export { MobileOptimizedInput };
export type { MobileOptimizedInputProps };
