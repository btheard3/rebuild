import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Chrome as Home } from 'lucide-react-native';

interface HomeButtonProps {
  style?: any;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function HomeButton({ style, showLabel = true, size = 'medium' }: HomeButtonProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    try {
      router.push('/(tabs)');
    } catch (error) {
      // Fallback navigation
      console.warn('Primary navigation failed, using fallback');
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { minHeight: 40, minWidth: 40, paddingHorizontal: 12, paddingVertical: 8 },
          icon: 16,
          text: 12,
        };
      case 'large':
        return {
          container: { minHeight: 56, minWidth: 56, paddingHorizontal: 20, paddingVertical: 14 },
          icon: 24,
          text: 16,
        };
      case 'medium':
      default:
        return {
          container: { minHeight: 48, minWidth: 48, paddingHorizontal: 16, paddingVertical: 12 },
          icon: 20,
          text: 14,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.homeButton,
        {
          backgroundColor: colors.primary,
          shadowColor: colors.text,
          ...sizeStyles.container,
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityLabel="Go to Home"
      accessibilityRole="button"
      accessibilityHint="Navigate to the main dashboard"
    >
      <View style={[styles.buttonContent, !showLabel && styles.iconOnly]}>
        <Home size={sizeStyles.icon} color="white" />
        {showLabel && (
          <Text style={[styles.buttonText, { fontSize: sizeStyles.text }]}>Home</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  homeButton: {
    position: 'absolute',
    top: 12,
    left: 16,
    zIndex: 1000,
    borderRadius: 24,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconOnly: {
    gap: 0,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});