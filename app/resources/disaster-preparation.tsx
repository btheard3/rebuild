import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useResponsive, getResponsiveValue } from '@/hooks/useResponsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Download, Share } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';

export default function DisasterPreparationScreen() {
  const { colors } = useTheme();
  const { deviceType } = useResponsive();

  const getPadding = getResponsiveValue(16, 24, 32);
  const getMaxWidth = getResponsiveValue('100%', 800, 1000);
  
  const padding = getPadding(deviceType);
  const maxWidth = getMaxWidth(deviceType);

  const preparationSteps = [
    {
      id: '1',
      title: 'Create an Emergency Kit',
      description: 'Assemble supplies for at least 72 hours including water, food, medications, and important documents.',
      completed: false,
    },
    {
      id: '2',
      title: 'Develop a Family Communication Plan',
      description: 'Establish how family members will contact each other and where you will meet if separated.',
      completed: false,
    },
    {
      id: '3',
      title: 'Know Your Evacuation Routes',
      description: 'Identify multiple ways to leave your area and practice your evacuation plan.',
      completed: false,
    },
    {
      id: '4',
      title: 'Secure Important Documents',
      description: 'Keep copies of insurance policies, identification, bank records, and other critical documents in a waterproof container.',
      completed: false,
    },
    {
      id: '5',
      title: 'Stay Informed',
      description: 'Sign up for local emergency alerts and know how to receive emergency information.',
      completed: false,
    },
  ];

  const emergencyKitItems = [
    'Water (1 gallon per person per day)',
    'Non-perishable food (3-day supply)',
    'Battery-powered or hand crank radio',
    'Flashlight and extra batteries',
    'First aid kit',
    'Whistle for signaling help',
    'Dust masks and plastic sheeting',
    'Moist towelettes and garbage bags',
    'Wrench or pliers to turn off utilities',
    'Manual can opener',
    'Local maps',
    'Cell phone with chargers',
  ];

  const renderStep = (step: typeof preparationSteps[0], index: number) => (
    <View key={step.id} style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}>
          <Text style={[styles.stepNumberText, { color: colors.primary }]}>{index + 1}</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
          <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>{step.description}</Text>
        </View>
        <TouchableOpacity style={styles.checkButton}>
          <CheckCircle 
            size={24} 
            color={step.completed ? colors.success : colors.disabled}
            fill={step.completed ? colors.success : 'transparent'}
          />
        </TouchableOpacity>
      </View>
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
          Disaster Preparation
        </Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView style={[styles.content, { paddingHorizontal: padding, maxWidth, alignSelf: 'center', width: '100%' }]}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg' }}
          style={styles.heroImage}
        />

        <View style={styles.introSection}>
          <Text style={[styles.title, { color: colors.text }]}>
            Natural Disaster Preparation Guide
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Being prepared can make all the difference when disaster strikes. Follow these essential steps to protect yourself and your family.
          </Text>
        </View>

        <View style={[styles.alertBox, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
          <AlertTriangle size={20} color={colors.warning} />
          <Text style={[styles.alertText, { color: colors.text }]}>
            The best time to prepare for a disaster is before it happens. Don't wait until it's too late.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preparation Checklist</Text>
          <View style={styles.stepsContainer}>
            {preparationSteps.map(renderStep)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Kit Essentials</Text>
          <View style={[styles.kitContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {emergencyKitItems.map((item, index) => (
              <View key={index} style={styles.kitItem}>
                <CheckCircle size={16} color={colors.success} />
                <Text style={[styles.kitItemText, { color: colors.text }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => console.log('Download checklist')}
          >
            <Download size={20} color="white" />
            <Text style={styles.actionButtonText}>Download Checklist</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={() => console.log('Share guide')}
          >
            <Share size={20} color="white" />
            <Text style={styles.actionButtonText}>Share Guide</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tipBox, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.tipTitle, { color: colors.primary }]}>Pro Tip</Text>
          <Text style={[styles.tipText, { color: colors.text }]}>
            Review and update your emergency plan every six months. Check expiration dates on food, water, and medications in your emergency kit.
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
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  alertText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stepsContainer: {
    gap: 12,
  },
  stepCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  checkButton: {
    marginLeft: 12,
  },
  kitContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  kitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  kitItemText: {
    marginLeft: 12,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
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