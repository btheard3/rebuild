import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

// Define color palette
const lightColors = {
  primary: '#2563EB', // Blue
  primaryLight: '#DBEAFE',
  secondary: '#0EA5E9', // Sky blue
  accent: '#7C3AED', // Purple
  success: '#10B981', // Green
  warning: '#F59E0B', // Amber
  error: '#EF4444', // Red
  background: '#FFFFFF',
  surface: '#F8FAFC',
  border: '#E2E8F0',
  text: '#1E293B',
  textSecondary: '#64748B',
  disabled: '#CBD5E1',
};

const darkColors = {
  primary: '#3B82F6', // Blue
  primaryLight: '#1E3A8A',
  secondary: '#0EA5E9', // Sky blue
  accent: '#8B5CF6', // Purple
  success: '#10B981', // Green
  warning: '#F59E0B', // Amber
  error: '#EF4444', // Red
  background: '#0F172A',
  surface: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  disabled: '#475569',
};

// High contrast colors for accessibility
const highContrastColors = {
  primary: '#0000FF', // Pure blue
  primaryLight: '#E6F3FF',
  secondary: '#0080FF', // Bright blue
  accent: '#8000FF', // Purple
  success: '#008000', // Pure green
  warning: '#FF8000', // Orange
  error: '#FF0000', // Pure red
  background: '#FFFFFF',
  surface: '#F0F0F0',
  border: '#000000',
  text: '#000000',
  textSecondary: '#333333',
  disabled: '#808080',
};

const highContrastDarkColors = {
  primary: '#00FFFF', // Cyan
  primaryLight: '#003333',
  secondary: '#00AAFF', // Light blue
  accent: '#FF00FF', // Magenta
  success: '#00FF00', // Pure green
  warning: '#FFAA00', // Orange
  error: '#FF0000', // Pure red
  background: '#000000',
  surface: '#1A1A1A',
  border: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  disabled: '#666666',
};

type ThemeContextType = {
  theme: 'light' | 'dark';
  colors: typeof lightColors;
  highContrastMode: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  toggleHighContrastMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark'>(colorScheme === 'dark' ? 'dark' : 'light');
  const [highContrastMode, setHighContrastMode] = useState(false);

  useEffect(() => {
    // Update theme when system theme changes
    if (colorScheme === 'dark' || colorScheme === 'light') {
      setTheme(colorScheme);
    }
  }, [colorScheme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleHighContrastMode = () => {
    setHighContrastMode(!highContrastMode);
  };

  const getColors = () => {
    if (highContrastMode) {
      return theme === 'light' ? highContrastColors : highContrastDarkColors;
    }
    return theme === 'light' ? lightColors : darkColors;
  };

  const colors = getColors();

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      colors, 
      highContrastMode,
      setTheme, 
      toggleTheme,
      toggleHighContrastMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};