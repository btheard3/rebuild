import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useResponsive, getResponsiveValue } from '@/hooks/useResponsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Heart, Phone, MessageCircle, Users, BookOpen, Play } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';

type CopingStrategy = {
  id: string;
  title: string;
  description: string;
  category: 'immediate' | 'ongoing' | 'professional';
  icon: React.ComponentType<any>;
  color: string;
};

type Resource = {
  id: string;
  name: string;
  description: string;
  type: 'hotline' | 'app' | 'website' | 'support-group';
  contact: string;
  available: string;
};

export default function CopingStrategiesScreen() {
  const { colors } = useTheme();
  const { deviceType } = useResponsive();

  const getPadding = getResponsiveValue(16, 24, 32);
  const getMaxWidth = getResponsiveValue('100%', 800, 1000);
  
  const padding = getPadding(deviceType);
  const maxWidth = getMaxWidth(deviceType);

  const copingStrategies: CopingStrategy[] = [
    {
      id: '1',
      title: 'Deep Breathing',
      description: 'Practice slow, deep breathing to reduce anxiety and stress in the moment.',
      category: 'immediate',
      icon: Heart,
      color: colors.success,
    },
    {
      id: '2',
      title: 'Grounding Techniques',
      description: 'Use the 5-4-3-2-1 technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.',
      category: 'immediate',
      icon: Heart,
      color: colors.success,
    },
    {
      id: '3',
      title: 'Stay Connected',
      description: 'Maintain contact with family, friends, and support networks. Share your feelings and experiences.',
      category: 'ongoing',
      icon: Users,
      color: colors.primary,
    },
    {
      id: '4',
      title: 'Maintain Routines',
      description: 'Try to keep regular sleep, meal, and activity schedules to provide stability and normalcy.',
      category: 'ongoing',
      icon: BookOpen,
      color: colors.primary,
    },
    {
      id: '5',
      title: 'Professional Counseling',
      description: 'Seek help from mental health professionals who specialize in trauma and disaster recovery.',
      category: 'professional',
      icon: MessageCircle,
      color: colors.accent,
    },
    {
      id: '6',
      title: 'Support Groups',
      description: 'Join groups with others who have experienced similar disasters to share experiences and coping strategies.',
      category: 'professional',
      icon: Users,
      color: colors.accent,
    },
  ];

  const mentalHealthResources: Resource[] = [
    {
      id: '1',
      name: 'Crisis Text Line',
      description: 'Free, 24/7 crisis support via text message',
      type: 'hotline',
      contact: 'Text HOME to 741741',
      available: '24/7',
    },
    {
      id: '2',
      name: 'National Suicide Prevention Lifeline',
      description: 'Free and confidential emotional support',
      type: 'hotline',
      contact: '988',
      available: '24/7',
    },
    {
      id: '3',
      name: 'SAMHSA Disaster Distress Helpline',
      description: 'Crisis counseling and support for disaster survivors',
      type: 'hotline',
      contact: '1-800-985-5990',
      available: '24/7',
    },
    {
      id: '4',
      name: 'Headspace',
      description: 'Meditation and mindfulness app with disaster-specific content',
      type: 'app',
      contact: 'Download from app store',
      available: 'Always',
    },
  ];

  const getCategoryColor = (category: CopingStrategy['category']) => {
    switch (category) {
      case 'immediate':
        return colors.success;
      case 'ongoing':
        return colors.primary;
      case 'professional':
        return colors.accent;
      default:
        return colors.textSecondary;
    }
  };

  const renderStrategy = (strategy: CopingStrategy) => (
    <View key={strategy.id} style={[styles.strategyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.strategyIcon, { backgroundColor: strategy.color + '20' }]}>
        <strategy.icon size={24} color={strategy.color} />
      </View>
      <View style={styles.strategyContent}>
        <View style={styles.strategyHeader}>
          <Text style={[styles.strategyTitle, { color: colors.text }]}>{strategy.title}</Text>
          <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(strategy.category) + '20' }]}>
            <Text style={[styles.categoryTagText, { color: getCategoryColor(strategy.category) }]}>
              {strategy.category.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.strategyDescription, { color: colors.textSecondary }]}>
          {strategy.description}
        </Text>
      </View>
    </View>
  );

  const renderResource = (resource: Resource) => (
    <View key={resource.id} style={[styles.resourceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.resourceContent}>
        <Text style={[styles.resourceName, { color: colors.text }]}>{resource.name}</Text>
        <Text style={[styles.resourceDescription, { color: colors.textSecondary }]}>
          {resource.description}
        </Text>
        <View style={styles.resourceDetails}>
          <Text style={[styles.resourceContact, { color: colors.primary }]}>{resource.contact}</Text>
          <Text style={[styles.resourceAvailable, { color: colors.textSecondary }]}>
            Available: {resource.available}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.contactButton, { backgroundColor: colors.primary }]}
        onPress={() => console.log(`Contacting ${resource.name}`)}
      >
        <Phone size={16} color="white" />
      </TouchableOpacity>
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
          Coping Strategies
        </Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView style={[styles.content, { paddingHorizontal: padding, maxWidth, alignSelf: 'center', width: '100%' }]}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/5699398/pexels-photo-5699398.jpeg' }}
          style={styles.heroImage}
        />

        <View style={styles.introSection}>
          <Text style={[styles.title, { color: colors.text }]}>
            Post-Disaster Coping Strategies
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            It's normal to feel overwhelmed, anxious, or sad after a disaster. These strategies can help you cope with stress and begin the healing process.
          </Text>
        </View>

        <View style={[styles.emergencyBox, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
          <Text style={[styles.emergencyTitle, { color: colors.error }]}>Crisis Support</Text>
          <Text style={[styles.emergencyText, { color: colors.text }]}>
            If you're having thoughts of self-harm, call 988 (Suicide & Crisis Lifeline) immediately.
          </Text>
          <TouchableOpacity 
            style={[styles.emergencyButton, { backgroundColor: colors.error }]}
            onPress={() => console.log('Calling crisis line')}
          >
            <Phone size={16} color="white" />
            <Text style={styles.emergencyButtonText}>Call 988</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Coping Strategies</Text>
          <View style={styles.strategiesContainer}>
            {copingStrategies.map(renderStrategy)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mental Health Resources</Text>
          <View style={styles.resourcesContainer}>
            {mentalHealthResources.map(renderResource)}
          </View>
        </View>

        <View style={[styles.guidedExerciseBox, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.exerciseTitle, { color: colors.primary }]}>Guided Breathing Exercise</Text>
          <Text style={[styles.exerciseDescription, { color: colors.text }]}>
            Take a moment to practice this simple breathing technique to help reduce stress and anxiety.
          </Text>
          <TouchableOpacity 
            style={[styles.exerciseButton, { backgroundColor: colors.primary }]}
            onPress={() => console.log('Starting breathing exercise')}
          >
            <Play size={16} color="white" />
            <Text style={styles.exerciseButtonText}>Start Exercise</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tipBox, { backgroundColor: colors.success + '20' }]}>
          <Text style={[styles.tipTitle, { color: colors.success }]}>Remember</Text>
          <Text style={[styles.tipText, { color: colors.text }]}>
            Recovery is a process, not a destination. Be patient with yourself and don't hesitate to ask for help when you need it.
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
    paddingBottom: 80,
  },
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  introSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  emergencyBox: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emergencyText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  emergencyButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  strategiesContainer: {
    gap: 12,
  },
  strategyCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  strategyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  strategyContent: {
    flex: 1,
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  strategyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 8,
  },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  strategyDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  resourcesContainer: {
    gap: 12,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  resourceContent: {
    flex: 1,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  resourceDetails: {
    gap: 2,
  },
  resourceContact: {
    fontSize: 14,
    fontWeight: '600',
  },
  resourceAvailable: {
    fontSize: 12,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  guidedExerciseBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  exerciseDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  exerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  exerciseButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  tipBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});