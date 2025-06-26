import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function WellnessLayout() {
  const { colors } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontFamily: 'Inter-Bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Wellness',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="journal"
        options={{
          title: 'Journal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="meditation"
        options={{
          title: 'Meditation',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="mood-tracking"
        options={{
          title: 'Mood Tracking',
          headerShown: false,
        }}
      />
    </Stack>
  );
}