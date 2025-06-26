import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function IdentityVaultLayout() {
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
          title: 'Identity Vault',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="document-upload"
        options={{
          title: 'Upload Document',
        }}
      />
      <Stack.Screen
        name="document-details"
        options={{
          title: 'Document Details',
        }}
      />
      <Stack.Screen
        name="emergency-mode"
        options={{
          title: 'Emergency Mode',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="verification-history"
        options={{
          title: 'Verification History',
        }}
      />
    </Stack>
  );
}