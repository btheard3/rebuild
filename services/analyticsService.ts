import { Platform } from 'react-native';

interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

interface AnalyticsConfig {
  enabled: boolean;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  retryDelay: number;
}

class AnalyticsService {
  private apiUrl: string;
  private events: AnalyticsEvent[] = [];
  private isInitialized = false;
  private sessionId: string;
  private userId?: string;
  private config: AnalyticsConfig;
  private flushTimer?: ReturnType<typeof setInterval>;
  private retryQueue: AnalyticsEvent[] = [];

  constructor() {
    this.apiUrl = process.env.EXPO_PUBLIC_ANALYTICS_API_URL || '';
    this.sessionId = this.generateSessionId();
    this.config = {
      enabled: true,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 1000,
    };
    this.initialize();
  }

  private initialize() {
    try {
      // Check if analytics should be enabled
      this.config.enabled = this.shouldEnableAnalytics();

      if (this.config.enabled) {
        this.startFlushTimer();
        console.log('Analytics service initialized');
      } else {
        console.log('Analytics service disabled');
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
      this.config.enabled = false;
      this.isInitialized = false;
    }
  }

  private shouldEnableAnalytics(): boolean {
    // Disable analytics if no URL is configured or it's a placeholder
    if (
      !this.apiUrl ||
      this.apiUrl.includes('your_analytics_api_url_here') ||
      this.apiUrl.includes('example.com') ||
      this.apiUrl.includes('localhost')
    ) {
      return false;
    }

    // Check for user consent (you might want to implement a consent mechanism)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const consent = localStorage.getItem('analytics_consent');
        return consent === 'true';
      }
    } catch (error) {
      console.warn('Failed to check analytics consent:', error);
    }

    return true;
  }

  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private generateSessionId(): string {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        let sessionId = window.sessionStorage.getItem('analytics_session_id');
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          window.sessionStorage.setItem('analytics_session_id', sessionId);
        }
        return sessionId;
      }
    } catch (error) {
      console.warn('Failed to get/set session ID:', error);
    }

    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  trackEvent(eventName: string, properties: Record<string, any> = {}) {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Sanitize properties to prevent sensitive data leakage
      const sanitizedProperties = this.sanitizeProperties(properties);

      const event: AnalyticsEvent = {
        name: eventName,
        properties: {
          ...sanitizedProperties,
          platform: 'mobile',
          timestamp: Date.now(),
          sessionId: this.sessionId,
          userId: this.userId,
        },
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
      };

      this.events.push(event);
      console.log('Analytics Event:', {
        name: eventName,
        properties: sanitizedProperties,
      });

      // Auto-flush if batch size is reached
      if (this.events.length >= this.config.batchSize) {
        this.flush();
      }
    } catch (error) {
      console.warn('Failed to track event:', error);
    }
  }

  private sanitizeProperties(
    properties: Record<string, any>
  ): Record<string, any> {
    const sanitized: Record<string, any> = {};
    const sensitiveKeys = [
      'password',
      'token',
      'key',
      'secret',
      'auth',
      'credential',
    ];

    for (const [key, value] of Object.entries(properties)) {
      // Skip sensitive keys
      if (
        sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))
      ) {
        continue;
      }

      // Limit string length to prevent large payloads
      if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '...';
      } else if (typeof value === 'object' && value !== null) {
        // Stringify objects but limit size
        const stringified = JSON.stringify(value);
        if (stringified.length > 1000) {
          sanitized[key] = '[Object too large]';
        } else {
          sanitized[key] = value;
        }
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  trackScreen(screenName: string, properties: Record<string, any> = {}) {
    this.trackEvent('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  trackUserAction(
    action: string,
    context: string,
    properties: Record<string, any> = {}
  ) {
    this.trackEvent('user_action', {
      action,
      context,
      ...properties,
    });
  }

  trackFeatureUsage(feature: string, properties: Record<string, any> = {}) {
    this.trackEvent('feature_usage', {
      feature,
      ...properties,
    });
  }

  trackError(
    error: string,
    context: string,
    properties: Record<string, any> = {}
  ) {
    this.trackEvent('error', {
      error,
      context,
      ...properties,
    });
  }

  trackPerformance(
    metric: string,
    value: number,
    properties: Record<string, any> = {}
  ) {
    this.trackEvent('performance', {
      metric,
      value,
      ...properties,
    });
  }

  async flush(): Promise<void> {
    if (!this.config.enabled || this.events.length === 0) {
      return;
    }

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await this.sendEvents(eventsToSend);
    } catch (error) {
      console.warn('Failed to send analytics events:', error);
      // Add failed events to retry queue
      this.retryQueue.push(...eventsToSend);
      this.scheduleRetry();
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    if (!this.apiUrl || !this.config.enabled) {
      return;
    }

    const response = await fetch(`${this.apiUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  private scheduleRetry() {
    if (this.retryQueue.length === 0) {
      return;
    }

    setTimeout(async () => {
      const eventsToRetry = [...this.retryQueue];
      this.retryQueue = [];

      try {
        await this.sendEvents(eventsToRetry);
      } catch (error) {
        console.warn('Retry failed for analytics events:', error);
        // Don't retry indefinitely - drop events after max retries
      }
    }, this.config.retryDelay);
  }

  // Consent management
  setAnalyticsConsent(consent: boolean) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('analytics_consent', consent.toString());
      }
      this.config.enabled = consent;

      if (consent && !this.flushTimer) {
        this.startFlushTimer();
      } else if (!consent && this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = undefined;
      }
    } catch (error) {
      console.warn('Failed to set analytics consent:', error);
    }
  }

  getAnalyticsConsent(): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('analytics_consent') === 'true';
      }
    } catch (error) {
      console.warn('Failed to get analytics consent:', error);
    }
    return false;
  }

  getEventHistory(): AnalyticsEvent[] {
    return [...this.events];
  }

  clearEventHistory() {
    this.events = [];
    this.retryQueue = [];
  }

  // Health check method
  isHealthy(): boolean {
    return this.isInitialized && this.config.enabled;
  }

  // Cleanup method
  cleanup() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    // Flush remaining events
    this.flush().catch(console.warn);
  }
}

export const analyticsService = new AnalyticsService();

// Cleanup on page unload
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analyticsService.cleanup();
  });
}
