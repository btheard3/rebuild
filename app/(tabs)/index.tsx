import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { AlertTriangle, ArrowRight, FileText, Brain, MapPin, AlarmClock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const quickActions = [
    { 
      id: '1', 
      title: 'Crisis Wizard', 
      description: 'Start recovery planning', 
      icon: AlertTriangle, 
      color: colors.error,
      route: '/recovery-wizard',
    },
    { 
      id: '2', 
      title: 'Document Vault', 
      description: 'Access important files', 
      icon: FileText, 
      color: colors.primary,
      route: '/resources',
    },
    { 
      id: '3', 
      title: 'Find Help', 
      description: 'Locate nearby resources', 
      icon: MapPin, 
      color: colors.success,
      route: '/map',
    },
    { 
      id: '4', 
      title: 'Mental Health', 
      description: 'Tools for wellbeing', 
      icon: Brain, 
      color: colors.accent,
      route: '/wellness',
    },
  ];

  const resources = [
    {
      id: '1',
      title: 'Natural Disaster Preparation',
      category: 'Guide',
      image: 'https://images.pexels.com/photos/1694642/pexels-photo-1694642.jpeg',
      route: '/resources/disaster-preparation',
    },
    {
      id: '2',
      title: 'Financial Aid Programs',
      category: 'Resources',
      image: 'https://images.pexels.com/photos/47344/dollar-currency-money-us-dollar-47344.jpeg',
      route: '/resources/financial-aid',
    },
    {
      id: '3',
      title: 'Post-Disaster Coping',
      category: 'Mental Health',
      image: 'https://images.pexels.com/photos/5699398/pexels-photo-5699398.jpeg',
      route: '/resources/coping-strategies',
    },
  ];

  const renderQuickAction = (item: typeof quickActions[0]) => {
    return (
      <TouchableOpacity 
        key={item.id} 
        style={[
          styles.quickActionCard, 
          { 
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }
        ]}
        onPress={() => router.push(item.route)}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <item.icon size={24} color={item.color} />
        </View>
        <View style={styles.actionTextContainer}>
          <Text style={[styles.actionTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
        </View>
        <ArrowRight size={20} color={colors.primary} />
      </TouchableOpacity>
    );
  };

  const renderResourceCard = (item: typeof resources[0]) => {
    return (
      <TouchableOpacity 
        key={item.id}
        style={[
          styles.resourceCard, 
          { 
            backgroundColor: colors.surface,
            borderColor: colors.border 
          }
        ]}
        onPress={() => router.push(item.route)}
      >
        <Image 
          source={{ uri: item.image }}
          style={styles.resourceImage}
        />
        <View style={styles.resourceContent}>
          <Text style={[styles.resourceCategory, { color: colors.primary }]}>
            {item.category}
          </Text>
          <Text style={[styles.resourceTitle, { color: colors.text }]}>
            {item.title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Hello, {user?.name?.split(' ')[0] || 'there'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Let's continue your recovery journey
            </Text>
          </View>
          
          <View style={[styles.statusCard, { backgroundColor: colors.primaryLight }]}>
            <AlarmClock size={20} color={colors.primary} />
            <Text style={[styles.statusText, { color: colors.primary }]}>
              Recovery Day 3
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommended Resources</Text>
          <View style={styles.resourcesContainer}>
            {resources.map(renderResourceCard)}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.emergencyButton, { backgroundColor: colors.error }]}
          onPress={() => console.log('Emergency Contact')}
        >
          <Text style={styles.emergencyButtonText}>Emergency Contact</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
  },
  statusText: {
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsContainer: {
    gap: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
  },
  resourcesContainer: {
    gap: 12,
  },
  resourceCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  resourceImage: {
    width: '100%',
    height: 150,
  },
  resourceContent: {
    padding: 12,
  },
  resourceCategory: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emergencyButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});