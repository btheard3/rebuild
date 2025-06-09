import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    try {
      // Safely call frameworkReady if it exists
      if (typeof window !== 'undefined' && window.frameworkReady) {
        window.frameworkReady();
      }
    } catch (error) {
      console.warn('Framework ready callback failed:', error);
    }
  }, []);
}