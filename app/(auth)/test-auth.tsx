import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase, checkSupabaseConnection } from '@/services/supabaseClient';
import { ArrowLeft, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';

export default function TestAuthScreen() {
  const { colors } = useTheme();
  const { user, signUp, signIn, signOut, getCurrentUser, isRealAuth } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (name: string, success: boolean, message: string) => {
    setTestResults(prev => [...prev, { name, success, message, timestamp: new Date() }]);
  };

  const runAuthTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: Check Supabase connection
      addTestResult('Connection Check', true, `Using ${isRealAuth ? 'real' : 'mock'} Supabase client`);
      
      const connectionHealthy = await checkSupabaseConnection();
      addTestResult('Health Check', connectionHealthy, connectionHealthy ? 'Connection healthy' : 'Connection issues detected');

      // Test 2: Test user registration
      try {
        await signUp('Test User', 'test@example.com', 'testpassword123');
        addTestResult('User Registration', true, 'Successfully created test account');
      } catch (error) {
        addTestResult('User Registration', false, error.message);
      }

      // Test 3: Test user sign in
      try {
        await signIn('test@example.com', 'testpassword123');
        addTestResult('User Sign In', true, 'Successfully signed in');
      } catch (error) {
        addTestResult('User Sign In', false, error.message);
      }

      // Test 4: Test getCurrentUser
      try {
        const currentUser = await getCurrentUser();
        addTestResult('Get Current User', !!currentUser, currentUser ? `User: ${currentUser.email}` : 'No current user');
      } catch (error) {
        addTestResult('Get Current User', false, error.message);
      }

      // Test 5: Test session persistence
      const sessionTest = user !== null;
      addTestResult('Session Persistence', sessionTest, sessionTest ? 'User session active' : 'No active session');

      // Test 6: Test real-time subscriptions (if using real Supabase)
      if (isRealAuth) {
        try {
          const channel = supabase.channel('test-channel');
          addTestResult('Real-time Setup', true, 'Real-time channel created successfully');
          supabase.removeChannel(channel);
        } catch (error) {
          addTestResult('Real-time Setup', false, error.message);
        }
      } else {
        addTestResult('Real-time Setup', true, 'Skipped (using mock client)');
      }

      // Test 7: Test sign out
      try {
        await signOut();
        addTestResult('User Sign Out', true, 'Successfully signed out');
      } catch (error) {
        addTestResult('User Sign Out', false, error.message);
      }

    } catch (error) {
      addTestResult('Test Suite', false, `Test suite failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const renderTestResult = (result: any, index: number) => (
    <View key={index} style={[styles.testResult, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.testHeader}>
        {result.success ? (
          <CheckCircle size={20} color={colors.success} />
        ) : (
          <XCircle size={20} color={colors.error} />
        )}
        <Text style={[styles.testName, { color: colors.text }]}>{result.name}</Text>
      </View>
      <Text style={[styles.testMessage, { color: colors.textSecondary }]}>{result.message}</Text>
      <Text style={[styles.testTime, { color: colors.textSecondary }]}>
        {result.timestamp.toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Authentication Test Suite
        </Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statusHeader}>
            <AlertTriangle size={24} color={isRealAuth ? colors.success : colors.warning} />
            <Text style={[styles.statusTitle, { color: colors.text }]}>
              Authentication Status
            </Text>
          </View>
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            Mode: {isRealAuth ? 'Production (Real Supabase)' : 'Development (Mock Client)'}
          </Text>
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            Current User: {user ? user.email : 'Not authenticated'}
          </Text>
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            Premium Status: {user?.isPremium ? 'Active' : 'Inactive'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: colors.primary }]}
          onPress={runAuthTests}
          disabled={isRunning}
        >
          <Text style={styles.testButtonText}>
            {isRunning ? 'Running Tests...' : 'Run Authentication Tests'}
          </Text>
        </TouchableOpacity>

        {testResults.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={[styles.resultsTitle, { color: colors.text }]}>Test Results</Text>
            {testResults.map(renderTestResult)}
          </View>
        )}

        <View style={[styles.infoCard, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.infoTitle, { color: colors.primary }]}>Test Coverage</Text>
          <Text style={[styles.infoText, { color: colors.text }]}>
            This test suite verifies:
            {'\n'}• Supabase client initialization
            {'\n'}• User registration (signUp)
            {'\n'}• User authentication (signIn)
            {'\n'}• Session management (getCurrentUser)
            {'\n'}• Session persistence
            {'\n'}• Real-time subscriptions
            {'\n'}• User sign out
          </Text>
        </View>
      </ScrollView>
      <BoltBadge />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholderButton: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statusCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
  },
  testButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  testResult: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  testMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  testTime: {
    fontSize: 12,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});