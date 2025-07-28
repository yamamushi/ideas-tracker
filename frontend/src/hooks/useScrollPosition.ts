import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface UseScrollPositionOptions {
  key?: string;
  enabled?: boolean;
}

export function useScrollPosition({ key = 'default', enabled = true }: UseScrollPositionOptions = {}) {
  const location = useLocation();
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const isRestoringRef = useRef(false);

  const saveScrollPosition = () => {
    if (!enabled) return;
    const scrollY = window.scrollY;
    const locationKey = `${location.pathname}-${key}`;
    scrollPositions.current.set(locationKey, scrollY);
  };

  const restoreScrollPosition = () => {
    if (!enabled) return;
    const locationKey = `${location.pathname}-${key}`;
    const savedPosition = scrollPositions.current.get(locationKey);
    
    if (savedPosition !== undefined) {
      isRestoringRef.current = true;
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo(0, savedPosition);
        // Reset flag after a short delay
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
      });
    }
  };

  useEffect(() => {
    // Save scroll position before navigation
    const handleBeforeUnload = () => saveScrollPosition();
    
    // Save scroll position on route change
    const unsubscribe = () => {
      saveScrollPosition();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Restore scroll position when component mounts
    restoreScrollPosition();

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsubscribe();
    };
  }, [location.pathname, key, enabled]);

  // Save scroll position periodically while scrolling
  useEffect(() => {
    if (!enabled) return;

    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      // Don't save position if we're currently restoring
      if (isRestoringRef.current) return;
      
      // Debounce scroll position saving
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveScrollPosition();
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [location.pathname, key, enabled]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    isRestoring: isRestoringRef.current
  };
}