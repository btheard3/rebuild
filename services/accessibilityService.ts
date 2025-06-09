import { Platform } from 'react-native';
import { analyticsService } from './analyticsService';

export interface AccessibilityFeatures {
  screenReader: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  voiceOver: boolean;
  talkBack: boolean;
}

class AccessibilityService {
  private features: AccessibilityFeatures = {
    screenReader: false,
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    voiceOver: false,
    talkBack: false,
  };

  private listeners: Function[] = [];

  constructor() {
    this.detectAccessibilityFeatures();
  }

  private async detectAccessibilityFeatures() {
    if (Platform.OS === 'web') {
      this.detectWebAccessibility();
    } else {
      // For React Native, we would use accessibility APIs
      // This is a simplified version for web compatibility
      this.features = {
        screenReader: false,
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        voiceOver: false,
        talkBack: false,
      };
    }

    this.notifyListeners();
    analyticsService.trackEvent('accessibility_features_detected', this.features);
  }

  private detectWebAccessibility() {
    if (typeof window === 'undefined') return;

    // Detect high contrast mode
    const highContrastMedia = window.matchMedia('(prefers-contrast: high)');
    this.features.highContrast = highContrastMedia.matches;

    // Detect reduced motion preference
    const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.features.reducedMotion = reducedMotionMedia.matches;

    // Detect large text/zoom
    const fontSize = window.getComputedStyle(document.documentElement).fontSize;
    this.features.largeText = parseInt(fontSize) > 16;

    // Listen for changes
    highContrastMedia.addEventListener('change', (e) => {
      this.features.highContrast = e.matches;
      this.notifyListeners();
    });

    reducedMotionMedia.addEventListener('change', (e) => {
      this.features.reducedMotion = e.matches;
      this.notifyListeners();
    });

    // Detect screen reader (basic detection)
    this.features.screenReader = this.detectScreenReader();
  }

  private detectScreenReader(): boolean {
    if (typeof window === 'undefined') return false;

    // Basic screen reader detection
    const userAgent = navigator.userAgent.toLowerCase();
    const screenReaders = ['nvda', 'jaws', 'dragon', 'zoomtext', 'fusion'];
    
    return screenReaders.some(sr => userAgent.includes(sr)) ||
           // Check for screen reader specific properties
           'speechSynthesis' in window ||
           navigator.userAgent.includes('Accessibility');
  }

  getFeatures(): AccessibilityFeatures {
    return { ...this.features };
  }

  isFeatureEnabled(feature: keyof AccessibilityFeatures): boolean {
    return this.features[feature];
  }

  // WCAG 2.1 compliance helpers
  getContrastRatio(foreground: string, background: string): number {
    // Simplified contrast ratio calculation
    // In a real implementation, you'd use a proper color contrast library
    const fgLuminance = this.getLuminance(foreground);
    const bgLuminance = this.getLuminance(background);
    
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  private getLuminance(color: string): number {
    // Simplified luminance calculation
    // This is a basic implementation - use a proper color library in production
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  isContrastCompliant(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  }

  // Focus management
  announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', priority);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.style.width = '1px';
      announcement.style.height = '1px';
      announcement.style.overflow = 'hidden';
      
      document.body.appendChild(announcement);
      announcement.textContent = message;
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
    
    analyticsService.trackEvent('screen_reader_announcement', { message, priority });
  }

  // Keyboard navigation helpers
  trapFocus(container: HTMLElement) {
    if (Platform.OS !== 'web') return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  // Motion preferences
  shouldReduceMotion(): boolean {
    return this.features.reducedMotion;
  }

  getAnimationDuration(defaultDuration: number): number {
    return this.shouldReduceMotion() ? 0 : defaultDuration;
  }

  // Text scaling
  getScaledFontSize(baseFontSize: number): number {
    if (this.features.largeText) {
      return baseFontSize * 1.2;
    }
    return baseFontSize;
  }

  // Color adjustments
  getAccessibleColors(colors: any) {
    if (this.features.highContrast) {
      return {
        ...colors,
        text: '#000000',
        background: '#FFFFFF',
        primary: '#0000FF',
        error: '#FF0000',
        success: '#008000',
        warning: '#FF8000',
      };
    }
    return colors;
  }

  // Event listeners
  onFeaturesChange(callback: (features: AccessibilityFeatures) => void) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.features));
  }

  // Validation helpers
  validateAccessibility(element: any): string[] {
    const issues: string[] = [];

    // Check for missing alt text on images
    if (element.type === 'Image' && !element.props.accessibilityLabel) {
      issues.push('Image missing accessibilityLabel');
    }

    // Check for missing labels on interactive elements
    if (['TouchableOpacity', 'Button'].includes(element.type) && 
        !element.props.accessibilityLabel && !element.props.accessibilityHint) {
      issues.push('Interactive element missing accessibility label');
    }

    // Check for proper heading hierarchy
    if (element.type === 'Text' && element.props.accessibilityRole === 'header') {
      // This would need more context to validate properly
    }

    return issues;
  }

  // Performance monitoring
  trackAccessibilityUsage() {
    analyticsService.trackEvent('accessibility_service_usage', {
      features_enabled: Object.keys(this.features).filter(key => this.features[key as keyof AccessibilityFeatures]),
      platform: Platform.OS,
    });
  }
}

export const accessibilityService = new AccessibilityService();