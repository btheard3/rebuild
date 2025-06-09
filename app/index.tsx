import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    // Clear any stale error states on app start
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const lastError = localStorage.getItem('lastError');
        if (lastError) {
          console.log('Previous error cleared:', JSON.parse(lastError));
          localStorage.removeItem('lastError');
        }
      } catch (error) {
        console.warn('Failed to clear error state:', error);
      }
    }
  }, []);
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }
  
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/(onboarding)" />;
  }
}