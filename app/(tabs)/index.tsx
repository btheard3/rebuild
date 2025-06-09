import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import Card from '@/components/Card';
import { Heart, BookOpen, MapPin, Video, Trophy, Bell } from 'lucide-react-native';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);

  const quickActions = [
    {
      id: '1',
      title: 'Recovery Wizard',
      description: 'Start your personalized recovery plan',
      icon: MapPin,
      color: colors.primary,
      onPress: () => router.push('/recovery-wizard'),
    },
    {
      id: '2',
      title: 'Mental Wellness',
      description: 'Access mindfulness and coping tools',
      icon: Heart,
      color: colors.success,
      onPress: () => router.push('/(tabs)/wellness'),
    },
    {
      id: '3',
      title: 'AI Video Check-in',
      description: 'Get personalized support messages',
      icon: Video,
      color: colors.accent,
      onPress: () => router.push('/(tabs)/video-checkin'),
    },
    {
      id: '4',
      title: 'Recovery Resources',
      description: 'Find local aid and support services',
      icon: BookOpen,
      color: colors.secondary,
      onPress: () => router.push('/(tabs)/cases'),
    },
    {
      id: '5',
      title: 'Progress Tracking',
      description: 'View your recovery achievements',
      icon: Trophy,
      color: colors.warning,
      onPress: () => router.push('/(tabs)/achievements'),
    },
    {
      id: '6',
      title: 'Emergency Alerts',
      description: 'Stay informed about local updates',
      icon: Bell,
      color: colors.error,
      onPress: () => router.push('/(tabs)/alerts'),
    },
  ];

  // Initialize Supabase connection safely
  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        // Dynamically import supabase to avoid initialization errors
        const { supabase } = await import('@/services/supabase');
        
        const channel = supabase
          .channel('alerts')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'alerts',
            },
            (payload: any) => {
              const newAlert = payload.new;
              if (newAlert && newAlert.id && newAlert.message) {
                setAlerts((prev) => [...prev, newAlert]);
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.warn('Supabase initialization failed:', error);
        // Continue without real-time features
      }
    };

    initializeSupabase();
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

        {/* Real-time alerts display */}
        {alerts.map((alert) => (
          <View key={alert.id} style={[styles.alertBanner, { backgroundColor: colors.primaryLight }]}>
            <Bell size={16} color={colors.primary} />
            <Text style={[styles.alertText, { color: colors.primary }]}>
              {alert.message}
            </Text>
          </View>
        ))}

        {/* Quick Actions Section */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Access your most important recovery tools
          </Text>
          
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <Card
                key={action.id}
                title={action.title}
                description={action.description}
                icon={action.icon}
                color={action.color}
                onPress={action.onPress}
              />
            ))}
          </View>
        </View>

        {/* Welcome Message for New Users */}
        <View style={[styles.welcomeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            Welcome to Rebuild
          </Text>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
            Your comprehensive disaster recovery companion. We're here to help you navigate through challenging times with personalized support, resources, and tools designed specifically for your recovery journey.
          </Text>
        </View>
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
    marginTop: 12,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  quickActionsGrid: {
    gap: 12,
  },
  welcomeCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
  },
});