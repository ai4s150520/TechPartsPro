import { useState, useRef, useCallback } from 'react';

export const useHoverMenu = (delay: number = 200) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const openMenu = useCallback(() => {
    // If there is a pending close action, cancel it
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    // Delay the closing action
    timeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, delay);
  }, [delay]);

  return {
    isOpen,
    openMenu,
    closeMenu
  };
};