import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
  rightIcon
}: ButtonProps) {
  const { colors } = useTheme();
  
  const getBackgroundColor = () => {
    if (disabled) return colors.disabled;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'outline':
        return 'transparent';
      case 'danger':
        return colors.error;
      default:
        return colors.primary;
    }
  };
  
  const getBorderColor = () => {
    if (disabled) return colors.disabled;
    switch (variant) {
      case 'outline':
        return colors.primary;
      default:
        return 'transparent';
    }
  };
  
  const getTextColor = () => {
    if (disabled) return colors.textSecondary;
    switch (variant) {
      case 'outline':
        return colors.primary;
      case 'primary':
      case 'secondary':
      case 'danger':
        return 'white';
      default:
        return 'white';
    }
  };
  
  const getSizeStyles = (): { 
    container: ViewStyle, 
    text: TextStyle 
  } => {
    switch (size) {
      case 'small':
        return {
          container: {
            height: 36,
            paddingHorizontal: 12,
          },
          text: {
            fontSize: 14,
          },
        };
      case 'large':
        return {
          container: {
            height: 56,
            paddingHorizontal: 24,
          },
          text: {
            fontSize: 18,
          },
        };
      case 'medium':
      default:
        return {
          container: {
            height: 48,
            paddingHorizontal: 16,
          },
          text: {
            fontSize: 16,
          },
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 2 : 0,
        },
        sizeStyles.container,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? colors.primary : 'white'} 
          size="small" 
        />
      ) : (
        <>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text 
            style={[
              styles.text, 
              { color: getTextColor() },
              sizeStyles.text,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});