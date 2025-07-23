import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
  className?: string;
}

const MobileToast: React.FC<MobileToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Show animation
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-dismiss timer
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500 flex-shrink-0" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30';
      case 'error':
        return 'bg-red-500/10 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30';
      default:
        return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div
      className={cn(
        "fixed top-4 left-4 right-4 z-50",
        "p-4 rounded-lg border backdrop-blur-sm",
        "transition-all duration-300 ease-out",
        "shadow-lg",
        // Mobile-optimized positioning and sizing
        "max-w-sm mx-auto md:max-w-md",
        "min-h-[64px]", // Ensure adequate touch target height
        getBackgroundColor(),
        isVisible && !isExiting ? "transform translate-y-0 opacity-100" : "transform -translate-y-full opacity-0",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-semibold text-white mb-1">
              {title}
            </h4>
          )}
          <p className="text-sm text-gray-200 break-words">
            {message}
          </p>
        </div>

        <button
          onClick={handleClose}
          className={cn(
            "flex-shrink-0 p-1 rounded-full",
            "hover:bg-white/10 transition-colors",
            "touch-manipulation",
            "min-w-[32px] min-h-[32px]", // Adequate touch target
            "flex items-center justify-center"
          )}
          aria-label="Close notification"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

// Toast provider context and hook
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export const MobileToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Render toasts */}
      {toasts.map((toast) => (
        <MobileToast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </ToastContext.Provider>
  );
};

export const useMobileToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useMobileToast must be used within a MobileToastProvider');
  }
  return context;
};

export { MobileToast };
export type { MobileToastProps, Toast };
