import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import Card from '@/components/Card';
import { supabase } from '@services/supabase';

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
      icon: require('lucide-react-native').AlertTriangle,
      color: colors.error,
      onPress: () => router.push('/recovery-wizard'),
      key: 'crisis',
    },
    {
      id: '2',
      title: 'Document Vault',
      description: 'Access important files',
      icon: require('lucide-react-native').FileText,
      color: colors.primary,
      onPress: () => router.push('/resources'),
      key: 'vault',
    },
    {
      id: '3',
      title: 'Find Help',
      description: 'Locate nearby resources',
      icon: require('lucide-react-native').MapPin,
      color: colors.success,
      onPress: () => router.push('/map'),
      key: 'map',
    },
    {
      id: '4',
      title: 'Mental Health',
      description: 'Tools for wellbeing',
      icon: require('lucide-react-native').Brain,
      color: colors.accent,
      onPress: () => router.push('/wellness'),
      key: 'wellness',
    },
  ];

  // 🔁 Supabase real-time alerts subscription
  useEffect(() => {
    const channel = supabase
      .channel('alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
        },
        (payload) => {
          const newAlert = payload.new as AlertPayload;
          setAlerts((prev) => [...prev, newAlert]);
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
          <Text style={[styles.greeting, { color: colors.text }]}>
            Hello, {user?.name?.split(' ')[0] || 'there'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Let's continue your recovery journey
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Actions
        </Text>
        <View style={styles.cardGroup}>
          {quickActions.map((action) => (
            <Card
              key={action.key}
              title={action.title}
              description={action.description}
              icon={action.icon}
              color={action.color}
              onPress={action.onPress}
            />
          ))}
        </View>

        {alerts.length > 0 && (
          <View style={styles.alertSection}>
            <Text style={[styles.alertTitle, { color: colors.error }]}>
              ⚠️ {alerts.length} new alert{alerts.length > 1 ? 's' : ''}
            </Text>
            {alerts.map((alert) => (
              <Text key={alert.id} style={{ color: colors.text }}>
                {alert.message}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  header: { marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardGroup: {
    gap: 12,
    marginBottom: 24,
  },
  alertSection: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#FFD6D6',
    borderRadius: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
});
