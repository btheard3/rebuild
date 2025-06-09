import React, { useState, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, Animated, PanGestureHandler, State } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { RefreshCw } from 'lucide-react-native';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
  enabled?: boolean;
  threshold?: number;
}

export default function PullToRefresh({
  children,
  onRefresh,
  refreshing = false,
  enabled = true,
  threshold = 80
}: PullToRefreshProps) {
  const { colors } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: false }
  );

  const handleStateChange = async (event: any) => {
    if (!enabled || isRefreshing || refreshing) return;

    const { state, translationY: gestureTranslationY } = event.nativeEvent;

    if (state === State.END) {
      if (gestureTranslationY > threshold) {
        setIsRefreshing(true);
        
        // Start rotation animation
        Animated.loop(
          Animated.timing(rotateValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ).start();

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          rotateValue.setValue(0);
          
          // Reset position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      } else {
        // Reset position if threshold not met
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  const rotation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pullDistance = translateY.interpolate({
    inputRange: [0, threshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const refreshOpacity = translateY.interpolate({
    inputRange: [0, threshold / 2, threshold],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  if (!enabled) {
    return <ScrollView ref={scrollViewRef}>{children}</ScrollView>;
  }

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleStateChange}
    >
      <Animated.View style={styles.container}>
        <Animated.View
          style={[
            styles.refreshIndicator,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: refreshOpacity,
              transform: [{ scale: pullDistance }],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <RefreshCw size={24} color={colors.primary} />
          </Animated.View>
          <Text style={[styles.refreshText, { color: colors.primary }]}>
            {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
          </Text>
        </Animated.View>

        <Animated.ScrollView
          ref={scrollViewRef}
          style={[styles.scrollView, { transform: [{ translateY }] }]}
          scrollEnabled={!isRefreshing}
        >
          {children}
        </Animated.ScrollView>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  refreshIndicator: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    zIndex: 1000,
    gap: 8,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
});