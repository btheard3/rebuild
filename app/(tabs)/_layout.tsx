import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { analyticsService } from '@/services/analyticsService';
import { useEffect } from 'react';
import { Chrome as Home, Search, MapPin, Bell, User, Volume2, Trophy, Shield } from 'lucide-react-native';

export default function TabLayout() {
  const { theme, colors } = useTheme();
  
  useEffect(() => {
    // Track tab navigation
    const trackTabChange = (routeName: string) => {
      analyticsService.trackScreen(`tab_${routeName}`);
    };

    // This would be implemented with navigation state listener in a real app
    // For now, we'll track when the layout mounts
    analyticsService.trackEvent('tabs_layout_mounted');
  }, []);
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { 
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: 'Inter-Bold',
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: 'Resources',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="identity-vault"
        options={{
          title: 'ID Vault',
          tabBarIcon: ({ color, size }) => <Shield size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => <Trophy size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="voice-checkin"
        options={{
          title: 'AI Voice',
          tabBarIcon: ({ color, size }) => <Volume2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wellness"
        options={{
          href: null, // Hide from tab bar but keep accessible
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          href: null, // Hide from tab bar but keep accessible
        }}
      />
    </Tabs>
  );
}