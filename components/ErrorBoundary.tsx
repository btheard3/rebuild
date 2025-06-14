import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { RefreshCw, Chrome as Home, TriangleAlert as AlertTriangle, Bug, Send } from 'lucide-react-native';
import { analyticsService } from '@/services/analyticsService';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Track error for analytics with safe error handling
    try {
      analyticsService.trackError('error_boundary_triggered', 'ErrorBoundary', {
        error_message: error.message,
        error_stack: error.stack?.substring(0, 1000), // Limit stack trace size
        component_stack: errorInfo.componentStack?.substring(0, 1000),
        error_id: this.state.errorId,
        timestamp: Date.now(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      });
    } catch (analyticsError) {
      console.warn('Failed to track error in analytics:', analyticsError);
    }

    // Store error data for debugging (with safe error handling)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const errorData = {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: Date.now(),
          errorId: this.state.errorId,
          userAgent: navigator.userAgent,
          url: window.location.href,
        };
        localStorage.setItem('lastError', JSON.stringify(errorData));
      }
    } catch (storageError) {
      console.warn('Failed to store error data:', storageError);
    }
  }

  handleReload = () => {
    // Clear error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });

    // Track recovery attempt
    try {
      analyticsService.trackEvent('error_recovery_attempted', {
        method: 'reload',
        error_id: this.state.errorId,
      });
    } catch (error) {
      console.warn('Failed to track recovery attempt:', error);
    }

    // Force reload in development or web
    if (__DEV__ || typeof window !== 'undefined') {
      try {
        window.location.reload();
      } catch (error) {
        console.warn('Failed to reload page:', error);
      }
    }
  };

  handleGoHome = () => {
    // Track recovery attempt
    try {
      analyticsService.trackEvent('error_recovery_attempted', {
        method: 'navigate_home',
        error_id: this.state.errorId,
      });
    } catch (error) {
      console.warn('Failed to track recovery attempt:', error);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
    
    try {
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to navigate home:', error);
      // Fallback: force reload
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  handleReportError = () => {
    try {
      analyticsService.trackEvent('error_report_requested', {
        error_id: this.state.errorId,
      });

      // In a real app, you might open a support form or email client
      const errorReport = {
        errorId: this.state.errorId,
        message: this.state.error?.message,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      };

      console.log('Error report data:', errorReport);
      
      // For now, just show an alert
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`Error reported with ID: ${this.state.errorId}\n\nOur team has been notified and will investigate this issue.`);
      }
    } catch (error) {
      console.warn('Failed to report error:', error);
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error!} 
            retry={this.handleReload}
          />
        );
      }

      // Default error UI
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <AlertTriangle size={64} color="#EF4444" />
              </View>
              
              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.subtitle}>
                The app encountered an unexpected error. This has been automatically reported to our team.
              </Text>

              <View style={styles.errorIdContainer}>
                <Text style={styles.errorIdLabel}>Error ID:</Text>
                <Text style={styles.errorId}>{this.state.errorId}</Text>
              </View>

              {__DEV__ && this.state.error && (
                <View style={styles.errorDetails}>
                  <Text style={styles.errorTitle}>Development Error Details:</Text>
                  <ScrollView style={styles.errorScroll}>
                    <Text style={styles.errorMessage}>{this.state.error.message}</Text>
                    {this.state.error.stack && (
                      <Text style={styles.errorStack}>{this.state.error.stack}</Text>
                    )}
                  </ScrollView>
                </View>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.primaryButton} onPress={this.handleReload}>
                  <RefreshCw size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Reload App</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={this.handleGoHome}>
                  <Home size={20} color="#2563EB" />
                  <Text style={styles.secondaryButtonText}>Go Home</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.reportButton} onPress={this.handleReportError}>
                  <Send size={20} color="#64748B" />
                  <Text style={styles.reportButtonText}>Report Issue</Text>
                </TouchableOpacity>
              </View>

              {__DEV__ && (
                <View style={styles.devContainer}>
                  <Bug size={16} color="#64748B" />
                  <Text style={styles.devNote}>
                    Development mode: This error is only visible in development builds.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 400,
  },
  errorIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  errorIdLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginRight: 8,
  },
  errorId: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  errorDetails: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: 200,
  },
  errorScroll: {
    maxHeight: 150,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#7F1D1D',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 12,
    color: '#7F1D1D',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderColor: '#2563EB',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  reportButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  devContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    maxWidth: 400,
  },
  devNote: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
  },
});