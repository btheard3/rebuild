import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { router } from 'expo-router';
import Card from '@components/Card';
import { supabase } from '@services/supabase';
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

type AlertPayload = {
  id: string;
  message: string;
  created_at: string;
};

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertPayload[]>([]);

  const quickActions = [
    {
      id: '1',
      title: 'Crisis Wizard',
      description: 'Start recovery planning',
      icon: null, // Replace with a valid LucideIcon if needed
      color: colors.error,
      onPress: () => router.push('/recovery-wizard'),
    },
    {
      id: '2',
      title: 'Wellness',
      description: 'Track your mental state',
      icon: null,
      color: colors.primary,
      onPress: () => router.push('/wellness'),
    },
  ];

  // 🔔 Supabase real-time alerts subscription
  useEffect(() => {
    const channel = supabase
      .channel('alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        (payload: RealtimePostgresInsertPayload<any>) => {
          const newAlert = payload.new as AlertPayload;

          if (
            newAlert &&
            typeof newAlert.id === 'string' &&
            typeof newAlert.message === 'string' &&
            typeof newAlert.created_at === 'string'
          ) {
            setAlerts((prev) => [...prev, newAlert]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Hello, {user?.name?.split(' ')[0] || 'there'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Let's continue your recovery journey
            </Text>
          </View>
        </View>

        {/* Example: Display real-time alerts */}
        {alerts.map((alert) => (
          <Text key={alert.id} style={{ color: colors.primary }}>
            🔔 {alert.message}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
});
