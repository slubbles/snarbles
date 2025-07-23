import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface MobileOptimizedSelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  mobileEnhanced?: boolean;
}

const MobileOptimizedSelect = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  MobileOptimizedSelectProps
>(({ children, mobileEnhanced = true, className, ...props }, ref) => {
  return (
    <Select {...props}>
      <SelectTrigger
        ref={ref}
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
            "focus:ring-4 md:focus:ring-2",
          ],
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        className={cn(
          mobileEnhanced && [
            // Mobile-optimized dropdown
            "max-h-[300px] md:max-h-[200px]", // Larger on mobile
            "overflow-y-auto",
            "touch-manipulation",
          ]
        )}
      >
        {children}
      </SelectContent>
    </Select>
  );
});

const MobileOptimizedSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectItem>,
  React.ComponentPropsWithoutRef<typeof SelectItem> & { mobileEnhanced?: boolean }
>(({ className, mobileEnhanced = true, ...props }, ref) => (
  <SelectItem
    ref={ref}
    className={cn(
      mobileEnhanced && [
        // Mobile-specific optimizations
        "min-h-[48px] md:min-h-[36px]", // Larger touch targets on mobile
        "px-4 md:px-2", // More padding on mobile
        "py-3 md:py-2", // More vertical padding on mobile
        "text-base md:text-sm", // Larger text on mobile
        "touch-manipulation",
        "transition-all duration-150",
      ],
      className
    )}
    {...props}
  />
));

MobileOptimizedSelect.displayName = "MobileOptimizedSelect";
MobileOptimizedSelectItem.displayName = "MobileOptimizedSelectItem";

export { MobileOptimizedSelect, MobileOptimizedSelectItem };
export type { MobileOptimizedSelectProps };
