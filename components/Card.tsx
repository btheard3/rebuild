import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';

export type CardProps = {
  title: string;
  description: string;
  icon?: React.ComponentType<{ size: number; color: string }>;
  color: string;
  onPress: () => void;
};

export default function Card({
  title,
  description,
  icon: Icon,
  color,
  onPress,
}: CardProps) {
  const { colors } = useTheme();
  const { deviceType } = useResponsive();

  const getCardPadding = () => {
    switch (deviceType) {
      case 'mobile':
        return 16;
      case 'tablet':
        return 20;
      case 'desktop':
        return 24;
      case 'large':
        return 28;
      default:
        return 16;
    }
  };

  const getIconSize = () => {
    switch (deviceType) {
      case 'mobile':
        return 24;
      case 'tablet':
        return 28;
      case 'desktop':
        return 32;
      case 'large':
        return 36;
      default:
        return 24;
    }
  };

  const getTitleSize = () => {
    switch (deviceType) {
      case 'mobile':
        return 16;
      case 'tablet':
        return 18;
      case 'desktop':
        return 20;
      case 'large':
        return 22;
      default:
        return 16;
    }
  };

  const getDescriptionSize = () => {
    switch (deviceType) {
      case 'mobile':
        return 14;
      case 'tablet':
        return 15;
      case 'desktop':
        return 16;
      case 'large':
        return 17;
      default:
        return 14;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          padding: getCardPadding(),
          minHeight: deviceType === 'mobile' ? 120 : 140,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${description}`}
    >
      {Icon && (
        <View style={[
          styles.iconContainer, 
          { 
            backgroundColor: color + '20',
            width: getIconSize() + 24,
            height: getIconSize() + 24,
            borderRadius: (getIconSize() + 24) / 2,
          }
        ]}>
          <Icon size={getIconSize()} color={color} />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={[
          styles.title, 
          { 
            color: colors.text,
            fontSize: getTitleSize(),
          }
        ]}>
          {title}
        </Text>
        <Text style={[
          styles.description, 
          { 
            color: colors.textSecondary,
            fontSize: getDescriptionSize(),
            lineHeight: getDescriptionSize() * 1.4,
          }
        ]}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  textContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
});