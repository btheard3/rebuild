import { websocketService } from './websocketService';
import { analyticsService } from './analyticsService';

export type RefreshConfig = {
  interval: number; // in milliseconds
  priority: 'low' | 'medium' | 'high' | 'critical';
  retryAttempts: number;
  retryDelay: number;
};

export type RefreshableData = {
  id: string;
  lastUpdated: Date;
  data: any;
  config: RefreshConfig;
};

class RefreshService {
  private refreshIntervals: Map<string, ReturnType<typeof setInterval>> =
    new Map();
  private refreshConfigs: Map<string, RefreshConfig> = new Map();
  private dataCache: Map<string, RefreshableData> = new Map();
  private listeners: Map<string, Function[]> = new Map();
  private isOnline = true;

  constructor() {
    this.setupNetworkListeners();
    this.setupWebSocketListeners();
  }

  private setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.resumeAllRefresh();
        analyticsService.trackEvent('network_online');
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.pauseAllRefresh();
        analyticsService.trackEvent('network_offline');
      });
    }
  }

  private setupWebSocketListeners() {
    websocketService.on('connected', () => {
      this.emit('websocket_connected', {});
    });

    websocketService.on('disconnected', () => {
      this.emit('websocket_disconnected', {});
    });

    websocketService.on('alert_update', (data: any) => {
      this.handleRealTimeUpdate('alerts', data);
    });

    websocketService.on('resource_update', (data: any) => {
      this.handleRealTimeUpdate('resources', data);
    });
  }

  registerRefreshable(
    id: string,
    fetchFunction: () => Promise<any>,
    config: RefreshConfig
  ) {
    this.refreshConfigs.set(id, config);

    // Initial fetch
    this.performRefresh(id, fetchFunction);

    // Set up interval based on priority
    const interval = this.getIntervalForPriority(
      config.priority,
      config.interval
    );

    const intervalId = setInterval(() => {
      if (this.isOnline) {
        this.performRefresh(id, fetchFunction);
      }
    }, interval);

    this.refreshIntervals.set(id, intervalId);

    analyticsService.trackEvent('refresh_registered', {
      id,
      priority: config.priority,
      interval,
    });
  }

  private getIntervalForPriority(
    priority: string,
    baseInterval: number
  ): number {
    const multipliers = {
      critical: 0.5, // Refresh twice as fast
      high: 0.75, // Refresh 25% faster
      medium: 1, // Use base interval
      low: 2, // Refresh half as fast
    };

    return (
      baseInterval * (multipliers[priority as keyof typeof multipliers] || 1)
    );
  }

  private async performRefresh(id: string, fetchFunction: () => Promise<any>) {
    const config = this.refreshConfigs.get(id);
    if (!config) return;

    let attempts = 0;

    while (attempts < config.retryAttempts) {
      try {
        const startTime = Date.now();
        const data = await fetchFunction();
        const endTime = Date.now();

        const refreshableData: RefreshableData = {
          id,
          lastUpdated: new Date(),
          data,
          config,
        };

        this.dataCache.set(id, refreshableData);
        this.emit('data_updated', {
          id,
          data,
          lastUpdated: refreshableData.lastUpdated,
        });

        analyticsService.trackEvent('refresh_success', {
          id,
          duration: endTime - startTime,
          attempts: attempts + 1,
        });

        break;
      } catch (error: any) {
        attempts++;

        if (attempts >= config.retryAttempts) {
          analyticsService.trackError('refresh_failed', 'RefreshService', {
            id,
            attempts,
            error: error.message,
          });

          this.emit('refresh_error', { id, error, attempts });
        } else {
          // Wait before retry
          await new Promise((resolve) =>
            setTimeout(resolve, config.retryDelay * attempts)
          );
        }
      }
    }
  }

  manualRefresh(id: string, fetchFunction: () => Promise<any>) {
    analyticsService.trackEvent('manual_refresh_triggered', { id });
    return this.performRefresh(id, fetchFunction);
  }

  refreshAll() {
    analyticsService.trackEvent('refresh_all_triggered');
    this.refreshConfigs.forEach((config, id) => {
      // Trigger immediate refresh for all registered items
      this.emit('manual_refresh_requested', { id });
    });
  }

  private handleRealTimeUpdate(type: string, data: any) {
    const cached = this.dataCache.get(type);
    if (cached) {
      // Merge real-time update with cached data
      const updatedData = this.mergeRealTimeData(cached.data, data);

      const refreshableData: RefreshableData = {
        ...cached,
        data: updatedData,
        lastUpdated: new Date(),
      };

      this.dataCache.set(type, refreshableData);
      this.emit('realtime_update', {
        id: type,
        data: updatedData,
        update: data,
      });

      analyticsService.trackEvent('realtime_update_received', {
        type,
        updateType: data.type || 'unknown',
      });
    }
  }

  private mergeRealTimeData(existingData: any, update: any): any {
    if (Array.isArray(existingData)) {
      switch (update.action) {
        case 'insert':
          return [update.data, ...existingData];
        case 'update':
          return existingData.map((item: any) =>
            item.id === update.data.id ? { ...item, ...update.data } : item
          );
        case 'delete':
          return existingData.filter((item: any) => item.id !== update.data.id);
        default:
          return existingData;
      }
    }

    return { ...existingData, ...update.data };
  }

  pauseRefresh(id: string) {
    const intervalId = this.refreshIntervals.get(id);
    if (intervalId) {
      clearInterval(intervalId);
      this.refreshIntervals.delete(id);
    }
  }

  resumeRefresh(id: string, fetchFunction: () => Promise<any>) {
    const config = this.refreshConfigs.get(id);
    if (config) {
      this.registerRefreshable(id, fetchFunction, config);
    }
  }

  private pauseAllRefresh() {
    this.refreshIntervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.refreshIntervals.clear();
  }

  private resumeAllRefresh() {
    // This would need to be implemented with stored fetch functions
    // For now, emit event for components to re-register
    this.emit('resume_all_refresh', {});
  }

  getCachedData(id: string): RefreshableData | null {
    return this.dataCache.get(id) || null;
  }

  getLastUpdateTime(id: string): Date | null {
    const cached = this.dataCache.get(id);
    return cached ? cached.lastUpdated : null;
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data));
    }
  }

  cleanup() {
    this.pauseAllRefresh();
    this.listeners.clear();
    this.dataCache.clear();
    this.refreshConfigs.clear();
    websocketService.disconnect();
  }
}

export const refreshService = new RefreshService();
