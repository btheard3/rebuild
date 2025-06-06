import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

const defaultBreakpoints: ResponsiveBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
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
    } else {
      return 'desktop';
    }
  };

  const deviceType = getDeviceType();

  return {
    width: dimensions.width,
    height: dimensions.height,
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    breakpoints,
  };
}

export function getResponsiveValue<T>(
  mobile: T,
  tablet?: T,
  desktop?: T
): (deviceType: DeviceType) => T {
  return (deviceType: DeviceType) => {
    switch (deviceType) {
      case 'mobile':
        return mobile;
      case 'tablet':
        return tablet ?? mobile;
      case 'desktop':
        return desktop ?? tablet ?? mobile;
      default:
        return mobile;
    }
  };
}