import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageTransition() {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);
    
    // Remove loading state after a minimal delay for smooth transition
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [location]);

  return isLoading;
} 