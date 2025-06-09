import { useState, useEffect, useCallback, useRef } from 'react';
import { refreshService, RefreshConfig } from '@/services/refreshService';
import { analyticsService } from '@/services/analyticsService';

export interface UseRefreshOptions {
  id: string;
  fetchFunction: () => Promise<any>;
  config: RefreshConfig;
  enableRealTime?: boolean;
  enablePullToRefresh?: boolean;
}

export interface UseRefreshReturn {
  data: any;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  isConnected: boolean;
  hasNewUpdates: boolean;
  markAsRead: () => void;
}

export function useRefresh({
  id,
  fetchFunction,
  config,
  enableRealTime = true,
  enablePullToRefresh = true
}: UseRefreshOptions): UseRefreshReturn {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  
  const lastReadTime = useRef<Date>(new Date());

  useEffect(() => {
    // Register with refresh service
    refreshService.registerRefreshable(id, fetchFunction, config);

    // Set up listeners
    const handleDataUpdate = (updateData: any) => {
      if (updateData.id === id) {
        setData(updateData.data);
        setLastUpdated(updateData.lastUpdated);
        setIsLoading(false);
        setError(null);
        
        // Check if this is a new update since last read
        if (updateData.lastUpdated > lastReadTime.current) {
          setHasNewUpdates(true);
        }
      }
    };

    const handleRealTimeUpdate = (updateData: any) => {
      if (updateData.id === id && enableRealTime) {
        setData(updateData.data);
        setLastUpdated(new Date());
        setHasNewUpdates(true);
        
        // Play notification sound for critical updates
        if (config.priority === 'critical') {
          playNotificationSound();
        }
        
        analyticsService.trackEvent('realtime_update_applied', {
          id,
          priority: config.priority
        });
      }
    };

    const handleRefreshError = (errorData: any) => {
      if (errorData.id === id) {
        setError(errorData.error.message);
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
    };

    const handleManualRefreshRequest = (requestData: any) => {
      if (requestData.id === id) {
        refresh();
      }
    };

    refreshService.on('data_updated', handleDataUpdate);
    refreshService.on('realtime_update', handleRealTimeUpdate);
    refreshService.on('refresh_error', handleRefreshError);
    refreshService.on('websocket_connected', () => handleConnectionChange(true));
    refreshService.on('websocket_disconnected', () => handleConnectionChange(false));
    refreshService.on('manual_refresh_requested', handleManualRefreshRequest);

    // Load cached data if available
    const cachedData = refreshService.getCachedData(id);
    if (cachedData) {
      setData(cachedData.data);
      setLastUpdated(cachedData.lastUpdated);
      setIsLoading(false);
    }

    return () => {
      refreshService.off('data_updated', handleDataUpdate);
      refreshService.off('realtime_update', handleRealTimeUpdate);
      refreshService.off('refresh_error', handleRefreshError);
      refreshService.off('websocket_connected', () => handleConnectionChange(true));
      refreshService.off('websocket_disconnected', () => handleConnectionChange(false));
      refreshService.off('manual_refresh_requested', handleManualRefreshRequest);
      refreshService.pauseRefresh(id);
    };
  }, [id, fetchFunction, config, enableRealTime]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      await refreshService.manualRefresh(id, fetchFunction);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  }, [id, fetchFunction]);

  const markAsRead = useCallback(() => {
    lastReadTime.current = new Date();
    setHasNewUpdates(false);
    
    analyticsService.trackEvent('updates_marked_as_read', { id });
  }, [id]);

  const playNotificationSound = () => {
    if (typeof window !== 'undefined' && 'Audio' in window) {
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(console.warn);
      } catch (error) {
        console.warn('Could not play notification sound:', error);
      }
    }
  };

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refresh,
    isConnected,
    hasNewUpdates,
    markAsRead
  };
}