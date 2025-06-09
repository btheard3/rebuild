class AnalyticsService {
  private apiUrl: string;
  private events: Array<{ name: string; properties: any; timestamp: number }> = [];
  private isInitialized = false;

  constructor() {
    this.apiUrl = process.env.EXPO_PUBLIC_ANALYTICS_API_URL || '';
    this.initialize();
  }

  private initialize() {
    try {
      // Safely initialize analytics
      this.isInitialized = true;
      console.log('Analytics service initialized');
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
      this.isInitialized = false;
    }
  }

  trackEvent(eventName: string, properties: Record<string, any> = {}) {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized, skipping event:', eventName);
      return;
    }

    try {
      const event = {
        name: eventName,
        properties: {
          ...properties,
          platform: 'mobile',
          timestamp: Date.now(),
          sessionId: this.getSessionId()
        },
        timestamp: Date.now()
      };

      this.events.push(event);
      console.log('Analytics Event:', event);

      // Send to analytics service with error handling
      this.sendToAnalytics(event).catch(error => {
        console.warn('Failed to send analytics event:', error);
      });
    } catch (error) {
      console.warn('Failed to track event:', error);
    }
  }

  trackScreen(screenName: string, properties: Record<string, any> = {}) {
    this.trackEvent('screen_view', {
      screen_name: screenName,
      ...properties
    });
  }

  trackUserAction(action: string, context: string, properties: Record<string, any> = {}) {
    this.trackEvent('user_action', {
      action,
      context,
      ...properties
    });
  }

  trackFeatureUsage(feature: string, properties: Record<string, any> = {}) {
    this.trackEvent('feature_usage', {
      feature,
      ...properties
    });
  }

  trackError(error: string, context: string, properties: Record<string, any> = {}) {
    this.trackEvent('error', {
      error,
      context,
      ...properties
    });
  }

  private async sendToAnalytics(event: any) {
    // Check if analytics URL is properly configured (not empty and not a placeholder)
    if (!this.apiUrl || this.apiUrl.includes('your_analytics_api_url_here') || this.apiUrl.includes('example.com')) {
      // Just log to console if no analytics URL is configured or it's a placeholder
      console.log('Analytics URL not configured, skipping network request');
      return;
    }

    try {
      const response = await fetch(`${this.apiUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Don't throw the error, just log it to prevent app crashes
      console.warn('Analytics request failed:', error);
    }
  }

  private getSessionId(): string {
    try {
      // Simple session ID generation with error handling
      if (typeof window !== 'undefined' && window.sessionStorage) {
        let sessionId = window.sessionStorage.getItem('analytics_session_id');
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          window.sessionStorage.setItem('analytics_session_id', sessionId);
        }
        return sessionId;
      }
    } catch (error) {
      console.warn('Failed to get/set session ID:', error);
    }
    
    // Fallback session ID
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getEventHistory(): Array<{ name: string; properties: any; timestamp: number }> {
    return [...this.events];
  }

  clearEventHistory() {
    this.events = [];
  }

  // Health check method
  isHealthy(): boolean {
    return this.isInitialized;
  }
}

export const analyticsService = new AnalyticsService();