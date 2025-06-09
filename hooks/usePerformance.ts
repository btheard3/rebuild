import { useEffect, useRef, useState } from 'react';
import { performanceService } from '@/services/performanceService';

export function usePerformanceTracking(componentName: string) {
  const renderStart = useRef<number>(0);
  const mountTime = useRef<number>(0);
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    mountTime.current = performance.now();
    return () => {
      const unmountTime = performance.now();
      const totalMountTime = unmountTime - mountTime.current;
      performanceService.trackRenderTime(`${componentName}_mount`, totalMountTime);
    };
  }, [componentName]);

  useEffect(() => {
    renderStart.current = performance.now();
    setRenderCount(prev => prev + 1);
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStart.current;
    performanceService.trackRenderTime(`${componentName}_render`, renderTime);
  });

  const startTiming = (operationName: string) => {
    return performanceService.startTiming(`${componentName}_${operationName}`);
  };

  return {
    renderCount,
    startTiming,
    trackOperation: (name: string, operation: () => Promise<any>) => {
      const endTiming = startTiming(name);
      return operation().finally(endTiming);
    }
  };
}

export function useNetworkPerformance() {
  const trackRequest = async (
    url: string,
    requestFn: () => Promise<any>
  ) => {
    const startTime = performance.now();
    let success = true;
    
    try {
      const result = await requestFn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      performanceService.trackNetworkRequest(url, duration, success);
    }
  };

  return { trackRequest };
}