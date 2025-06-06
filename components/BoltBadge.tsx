import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import { Zap } from 'lucide-react-native';

interface BoltBadgeProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'small' | 'medium' | 'large';
}

export default function BoltBadge({ position = 'bottom-right', size = 'medium' }: BoltBadgeProps) {
  const { colors } = useTheme();
  const { deviceType } = useResponsive();

  const handlePress = () => {
    Linking.openURL('https://bolt.new');
  };

  const getPositionStyles = () => {
    const baseOffset = deviceType === 'mobile' ? 16 : 24;
    
    switch (position) {
      case 'bottom-right':
        return { bottom: baseOffset, right: baseOffset };
      case 'bottom-left':
        return { bottom: baseOffset, left: baseOffset };
      case 'top-right':
        return { top: baseOffset, right: baseOffset };
      case 'top-left':
        return { top: baseOffset, left: baseOffset };
      default:
        return { bottom: baseOffset, right: baseOffset };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          fontSize: 10,
          iconSize: 12,
        };
      case 'large':
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          fontSize: 14,
          iconSize: 16,
        };
      case 'medium':
      default:
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          fontSize: 12,
          iconSize: 14,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.badge,
        {
          backgroundColor: colors.primary,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
        },
        getPositionStyles(),
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Zap size={sizeStyles.iconSize} color="white" fill="white" />
      <Text style={[styles.text, { fontSize: sizeStyles.fontSize }]}>
        Built with Bolt
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  text: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
});