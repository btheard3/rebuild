import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'large';

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  large: number;
}

const defaultBreakpoints: ResponsiveBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  large: 1920,
};

export function useResponsive(customBreakpoints?: Partial<ResponsiveBreakpoints>) {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const getDeviceType = (): DeviceType => {
    if (dimensions.width < breakpoints.mobile) {
      return 'mobile';
    } else if (dimensions.width < breakpoints.tablet) {
      return 'tablet';
    } else if (dimensions.width < breakpoints.desktop) {
      return 'desktop';
    } else {
      return 'large';
    }
  };

  const deviceType = getDeviceType();

  const getColumns = () => {
    switch (deviceType) {
      case 'mobile':
        return 1;
      case 'tablet':
        return 2;
      case 'desktop':
        return 3;
      case 'large':
        return 4;
      default:
        return 1;
    }
  };

  const getPadding = () => {
    switch (deviceType) {
      case 'mobile':
        return 16;
      case 'tablet':
        return 24;
      case 'desktop':
        return 32;
      case 'large':
        return 40;
      default:
        return 16;
    }
  };

  const getMaxWidth = () => {
    switch (deviceType) {
      case 'mobile':
        return '100%';
      case 'tablet':
        return 800;
      case 'desktop':
        return 1200;
      case 'large':
        return 1400;
      default:
        return '100%';
    }
  };

  return {
    width: dimensions.width,
    height: dimensions.height,
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isLarge: deviceType === 'large',
    breakpoints,
    columns: getColumns(),
    padding: getPadding(),
    maxWidth: getMaxWidth(),
  };
}

export function getResponsiveValue<T>(
  mobile: T,
  tablet?: T,
  desktop?: T,
  large?: T
): (deviceType: DeviceType) => T {
  return (deviceType: DeviceType) => {
    switch (deviceType) {
      case 'mobile':
        return mobile;
      case 'tablet':
        return tablet ?? mobile;
      case 'desktop':
        return desktop ?? tablet ?? mobile;
      case 'large':
        return large ?? desktop ?? tablet ?? mobile;
      default:
        return mobile;
    }
  };
}