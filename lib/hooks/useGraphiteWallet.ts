// lib/hooks/useGraphiteWallet.ts
import { useState, useEffect } from 'react';

export const useGraphiteWallet = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkGraphiteWallet = () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const graphiteAvailable = !!(window.graphite);
      setIsInstalled(graphiteAvailable);
      setIsLoading(false);
      
      console.log('Graphite wallet detected:', graphiteAvailable);
    };

    // Check immediately
    checkGraphiteWallet();
    
    // Also check after a short delay (in case extension loads later)
    const timeout = setTimeout(checkGraphiteWallet, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return { isInstalled, isLoading };
};