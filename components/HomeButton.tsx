import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Home } from 'lucide-react-native';

interface HomeButtonProps {
  style?: any;
}

export default function HomeButton({ style }: HomeButtonProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    router.push('/(tabs)');
  };

  return (
    <TouchableOpacity
      style={[
        styles.homeButton,
        {
          backgroundColor: colors.primary,
          shadowColor: colors.text,
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityLabel="Go to Home"
      accessibilityRole="button"
    >
      <View style={styles.buttonContent}>
        <Home size={20} color="white" />
        <Text style={styles.buttonText}>Home</Text>
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
    minHeight: 48,
    minWidth: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});