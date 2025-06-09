import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  enableMaxWidth?: boolean;
  enablePadding?: boolean;
}

export default function ResponsiveContainer({
  children,
  style,
  enableMaxWidth = true,
  enablePadding = true,
}: ResponsiveContainerProps) {
  const { maxWidth, padding } = useResponsive();

  const containerStyle: ViewStyle = {
    width: '100%',
    alignSelf: 'center',
    ...(enableMaxWidth && typeof maxWidth === 'number' ? { maxWidth } : {}),
    ...(enablePadding ? { paddingHorizontal: padding } : {}),
  };

  return <View style={[containerStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});