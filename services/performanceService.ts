import { Platform } from 'react-native';
import { analyticsService } from './analyticsService';
import React from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  errorRate: number;
  crashRate: number;
}

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  type: string;
}

class PerformanceService {
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    errorRate: 0,
    crashRate: 0,
  };

  private performanceEntries: PerformanceEntry[] = [];
  private observers: any[] = [];

  constructor() {
    this.initializePerformanceMonitoring();
  }

  private initializePerformanceMonitoring() {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'performance' in window) {
      this.setupWebPerformanceMonitoring();
    }
  }

  private setupWebPerformanceMonitoring() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    try {
      // Monitor navigation timing
      if ('PerformanceObserver' in window) {
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.metrics.loadTime = navEntry.loadEventEnd - navEntry.navigationStart;
              this.trackMetric('page_load_time', this.metrics.loadTime);
            }
          });
        });

        try {
          navigationObserver.observe({ entryTypes: ['navigation'] });
          this.observers.push(navigationObserver);
        } catch (error) {
          console.warn('Navigation timing not supported:', error);
        }

        // Monitor resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              this.trackResourcePerformance(resourceEntry);
            }
          });
        });

        try {
          resourceObserver.observe({ entryTypes: ['resource'] });
          this.observers.push(resourceObserver);
        } catch (error) {
          console.warn('Resource timing not supported:', error);
        }

        // Monitor long tasks
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.trackMetric('long_task', entry.duration);
              analyticsService.trackEvent('performance_long_task', {
                duration: entry.duration,
                name: entry.name,
              });
            }
          });
        });

        try {
          longTaskObserver.observe({ entryTypes: ['longtask'] });
          this.observers.push(longTaskObserver);
        } catch (error) {
          console.warn('Long task monitoring not supported:', error);
        }
      }

      // Monitor memory usage
      this.monitorMemoryUsage();

      // Monitor frame rate
      this.monitorFrameRate();
    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  private trackResourcePerformance(entry: PerformanceResourceTiming) {
    const latency = entry.responseEnd - entry.requestStart;
    
    if (entry.name.includes('/api/')) {
      this.metrics.networkLatency = latency;
      this.trackMetric('api_latency', latency);
    }

    // Track slow resources
    if (latency > 1000) {
      analyticsService.trackEvent('performance_slow_resource', {
        resource: entry.name,
        latency,
        size: entry.transferSize,
      });
    }
  }

  private monitorMemoryUsage() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    try {
      if ('memory' in performance) {
        const memoryInfo = (performance as any).memory;
        this.metrics.memoryUsage = memoryInfo.usedJSHeapSize;
        
        // Check for memory leaks
        if (memoryInfo.usedJSHeapSize > memoryInfo.totalJSHeapSize * 0.9) {
          analyticsService.trackEvent('performance_high_memory_usage', {
            used: memoryInfo.usedJSHeapSize,
            total: memoryInfo.totalJSHeapSize,
          });
        }
      }
    } catch (error) {
      console.warn('Memory monitoring failed:', error);
    }
  }

  private monitorFrameRate() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    try {
      let lastTime = performance.now();
      let frameCount = 0;
      
      const measureFrameRate = (currentTime: number) => {
        frameCount++;
        
        if (currentTime - lastTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
          
          if (fps < 30) {
            analyticsService.trackEvent('performance_low_fps', { fps });
          }
          
          frameCount = 0;
          lastTime = currentTime;
        }
        
        requestAnimationFrame(measureFrameRate);
      };
      
      requestAnimationFrame(measureFrameRate);
    } catch (error) {
      console.warn('Frame rate monitoring failed:', error);
    }
  }

  // Public API
  startTiming(name: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.addPerformanceEntry({
        name,
        startTime,
        duration,
        type: 'measure',
      });
      
      this.trackMetric(name, duration);
    };
  }

  markStart(name: string) {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'performance' in window) {
      try {
        performance.mark(`${name}-start`);
      } catch (error) {
        console.warn('Performance mark failed:', error);
      }
    }
  }

  markEnd(name: string) {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'performance' in window) {
      try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        if (measure) {
          this.trackMetric(name, measure.duration);
        }
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
  }

  trackRenderTime(componentName: string, renderTime: number) {
    this.metrics.renderTime = renderTime;
    this.trackMetric(`render_${componentName}`, renderTime);
    
    if (renderTime > 100) {
      analyticsService.trackEvent('performance_slow_render', {
        component: componentName,
        renderTime,
      });
    }
  }

  trackNetworkRequest(url: string, duration: number, success: boolean) {
    this.trackMetric('network_request', duration);
    
    if (!success) {
      this.metrics.errorRate++;
    }
    
    analyticsService.trackEvent('performance_network_request', {
      url,
      duration,
      success,
    });
  }

  trackError(error: Error, context: string) {
    this.metrics.errorRate++;
    
    analyticsService.trackError('performance_error', context, {
      message: error.message,
      stack: error.stack,
    });
  }

  trackCrash(error: Error) {
    this.metrics.crashRate++;
    
    analyticsService.trackError('performance_crash', 'app', {
      message: error.message,
      stack: error.stack,
    });
  }

  // Bundle size analysis
  analyzeBundleSize() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

    try {
      if ('performance' in window) {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const jsResources = resources.filter(r => r.name.endsWith('.js'));
        const cssResources = resources.filter(r => r.name.endsWith('.css'));
        
        const totalJSSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
        const totalCSSSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
        
        analyticsService.trackEvent('performance_bundle_analysis', {
          totalJSSize,
          totalCSSSize,
          jsFileCount: jsResources.length,
          cssFileCount: cssResources.length,
        });
        
        return {
          totalJSSize,
          totalCSSSize,
          jsFileCount: jsResources.length,
          cssFileCount: cssResources.length,
        };
      }
    } catch (error) {
      console.warn('Bundle analysis failed:', error);
    }
    
    return null;
  }

  // Core Web Vitals
  measureCoreWebVitals() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    try {
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          analyticsService.trackEvent('performance_lcp', {
            value: lastEntry.startTime,
            rating: lastEntry.startTime <= 2500 ? 'good' : lastEntry.startTime <= 4000 ? 'needs-improvement' : 'poor',
          });
        });

        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          this.observers.push(lcpObserver);
        } catch (error) {
          console.warn('LCP monitoring not supported:', error);
        }

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const fid = entry.processingStart - entry.startTime;
            
            analyticsService.trackEvent('performance_fid', {
              value: fid,
              rating: fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor',
            });
          });
        });

        try {
          fidObserver.observe({ entryTypes: ['first-input'] });
          this.observers.push(fidObserver);
        } catch (error) {
          console.warn('FID monitoring not supported:', error);
        }

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          
          analyticsService.trackEvent('performance_cls', {
            value: clsValue,
            rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor',
          });
        });

        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] });
          this.observers.push(clsObserver);
        } catch (error) {
          console.warn('CLS monitoring not supported:', error);
        }
      }
    } catch (error) {
      console.warn('Core Web Vitals monitoring failed:', error);
    }
  }

  private addPerformanceEntry(entry: PerformanceEntry) {
    this.performanceEntries.push(entry);
    
    // Keep only last 100 entries to prevent memory leaks
    if (this.performanceEntries.length > 100) {
      this.performanceEntries = this.performanceEntries.slice(-100);
    }
  }

  private trackMetric(name: string, value: number) {
    analyticsService.trackEvent('performance_metric', {
      metric: name,
      value,
      timestamp: Date.now(),
    });
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getPerformanceEntries(): PerformanceEntry[] {
    return [...this.performanceEntries];
  }

  generatePerformanceReport() {
    const report = {
      metrics: this.getMetrics(),
      entries: this.getPerformanceEntries(),
      bundleAnalysis: this.analyzeBundleSize(),
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    };
    
    analyticsService.trackEvent('performance_report_generated', {
      entryCount: report.entries.length,
      platform: Platform.OS,
    });
    
    return report;
  }

  cleanup() {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Observer cleanup failed:', error);
      }
    });
    this.observers = [];
    this.performanceEntries = [];
  }
}

export const performanceService = new PerformanceService();

// React component performance wrapper
export function withPerformanceTracking<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentName: string
) {
  return React.forwardRef<any, T>((props, ref) => {
    const renderStart = React.useRef<number>(0);
    
    React.useLayoutEffect(() => {
      renderStart.current = Date.now();
    });
    
    React.useEffect(() => {
      const renderTime = Date.now() - renderStart.current;
      performanceService.trackRenderTime(componentName, renderTime);
    });
    
    return <WrappedComponent {...props} ref={ref} />;
  });
}