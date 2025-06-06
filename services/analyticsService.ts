class AnalyticsService {
  private apiUrl: string;
  private events: Array<{ name: string; properties: any; timestamp: number }> = [];

  constructor() {
    this.apiUrl = process.env.EXPO_PUBLIC_ANALYTICS_API_URL || '';
  }

  trackEvent(eventName: string, properties: Record<string, any> = {}) {
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

    // In a real implementation, you would send this to your analytics service
    this.sendToAnalytics(event);
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
    if (!this.apiUrl) {
      // Just log to console if no analytics URL is configured
      return;
    }

    try {
      await fetch(`${this.apiUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  private getSessionId(): string {
    // Simple session ID generation
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let sessionId = window.sessionStorage.getItem('analytics_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        window.sessionStorage.setItem('analytics_session_id', sessionId);
      }
      return sessionId;
    }
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getEventHistory(): Array<{ name: string; properties: any; timestamp: number }> {
    return [...this.events];
  }

  clearEventHistory() {
    this.events = [];
  }
}

export const analyticsService = new AnalyticsService();