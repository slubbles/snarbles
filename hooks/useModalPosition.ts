import { useEffect } from 'react';

export function useModalPosition(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      // Prevent background scroll and maintain position
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = `-${scrollX}px`;
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.body.classList.add('modal-open');
      
      // Additional fixes for mobile wallet browsers
      if (window.innerWidth <= 768) {
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.height = '100%';
        
        // Prevent iOS Safari bounce scrolling
        const preventDefault = (e: TouchEvent) => {
          if (e.touches.length > 1) return;
          e.preventDefault();
        };
        
        document.addEventListener('touchmove', preventDefault, { passive: false });
        
        return () => {
          // Restore all styles
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.left = '';
          document.body.style.width = '';
          document.body.style.height = '';
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          document.body.classList.remove('modal-open');
          document.documentElement.style.overflow = '';
          document.documentElement.style.height = '';
          document.removeEventListener('touchmove', preventDefault);
          
          // Restore scroll position
          window.scrollTo(scrollX, scrollY);
        };
      }
      
      return () => {
        // Restore scroll position for desktop
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        document.body.classList.remove('modal-open');
        window.scrollTo(scrollX, scrollY);
      };
    }
  }, [isOpen]);
}
