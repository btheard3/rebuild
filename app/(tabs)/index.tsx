import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { useResponsive, getResponsiveValue } from '@/hooks/useResponsive';
import { router } from 'expo-router';
import { analyticsService } from '@/services/analyticsService';
import { TriangleAlert as AlertTriangle, ArrowRight, FileText, Brain, MapPin, AlarmClock, Star, Crown, Zap } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BoltBadge from '@/components/BoltBadge';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { data: gamificationData, addPoints, updateStreak, completeAchievement } = useGamification();
  const { deviceType, width } = useResponsive();

  const getColumns = getResponsiveValue(1, 2, 2);
  const getPadding = getResponsiveValue(16, 24, 32);
  const getCardWidth = getResponsiveValue('100%', '48%', '48%');
  const getResourceCardWidth = getResponsiveValue('100%', '48%', '32%');
  
  const columns = getColumns(deviceType);
  const padding = getPadding(deviceType);
  const cardWidth = getCardWidth(deviceType);
  const resourceCardWidth = getResourceCardWidth(deviceType);

  useEffect(() => {
    analyticsService.trackScreen('dashboard');
    updateStreak();
    
    // Complete first login achievement if not already done
    const firstLoginAchievement = gamificationData.achievements.find(a => a.id === 'first_login');
    if (firstLoginAchievement && !firstLoginAchievement.unlocked) {
      setTimeout(() => completeAchievement('first_login'), 1000);
    }
  }, []);

  const quickActions = [
    { 
      id: '1', 
      title: 'Crisis Wizard', 
      description: 'Start recovery planning', 
      icon: AlertTriangle, 
      color: colors.error,
      route: '/recovery-wizard',
      premium: false,
    },
    { 
      id: '2', 
      title: 'Document Vault', 
      description: 'Access important files', 
      icon: FileText, 
      color: colors.primary,
      route: '/(tabs)/resources',
      premium: false,
    },
    { 
      id: '3', 
      title: 'Find Help', 
      description: 'Locate nearby resources', 
      icon: MapPin, 
      color: colors.success,
      route: '/(tabs)/map',
      premium: false,
    },
    { 
      id: '4', 
      title: 'Mental Health', 
      description: 'Tools for wellbeing', 
      icon: Brain, 
      color: colors.accent,
      route: '/(tabs)/wellness',
      premium: false,
    },
  ];

  const resources = [
    {
      id: '1',
      title: 'Natural Disaster Preparation',
      category: 'Guide',
      image: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg',
      route: '/resources/disaster-preparation',
    },
    {
      id: '2',
      title: 'Financial Aid Programs',
      category: 'Resources',
      image: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
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

  const handleQuickAction = (item: typeof quickActions[0]) => {
    analyticsService.trackUserAction('quick_action_pressed', 'dashboard', {
      action_id: item.id,
      action_title: item.title,
      premium_required: item.premium
    });

    if (item.premium && !user?.isPremium) {
      // Handle premium feature access
      analyticsService.trackEvent('premium_feature_attempted', {
        feature: item.title,
        user_premium: false
      });
    }

    router.push(item.route as any);
  };

  const handleDailyTask = () => {
    addPoints(10, 'Completed daily task');
    analyticsService.trackUserAction('daily_task_completed', 'dashboard');
  };

  const renderQuickAction = (item: typeof quickActions[0]) => {
    return (
      <TouchableOpacity 
        key={item.id} 
        style={[
          styles.quickActionCard, 
          { 
            backgroundColor: colors.surface,
            borderColor: colors.border,
            width: cardWidth,
            marginBottom: deviceType === 'mobile' ? 12 : 16,
          }
        ]}
        onPress={() => handleQuickAction(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <item.icon size={24} color={item.color} />
        </View>
        <View style={styles.actionTextContainer}>
          <View style={styles.actionTitleRow}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>{item.title}</Text>
            {item.premium && (
              <Crown size={16} color={colors.warning} />
            )}
          </View>
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
            borderColor: colors.border,
            width: resourceCardWidth,
            marginBottom: deviceType === 'mobile' ? 12 : 16,
          }
        ]}
        onPress={() => {
          analyticsService.trackUserAction('resource_viewed', 'dashboard', {
            resource_id: item.id,
            resource_title: item.title
          });
          router.push(item.route as any);
        }}
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

  const renderGamificationCard = () => (
    <TouchableOpacity
      style={[styles.gamificationCard, { backgroundColor: colors.primaryLight }]}
      onPress={() => {
        analyticsService.trackUserAction('gamification_card_pressed', 'dashboard');
        router.push('/(tabs)/achievements');
      }}
    >
      <View style={styles.gamificationHeader}>
        <View style={styles.gamificationInfo}>
          <Text style={[styles.gamificationLevel, { color: colors.primary }]}>
            Level {gamificationData.level}
          </Text>
          <Text style={[styles.gamificationPoints, { color: colors.text }]}>
            {gamificationData.points.toLocaleString()} points
          </Text>
        </View>
        <View style={[styles.gamificationIcon, { backgroundColor: colors.primary + '20' }]}>
          <Star size={24} color={colors.primary} />
        </View>
      </View>
      
      {gamificationData.streakDays > 0 && (
        <View style={styles.streakContainer}>
          <Zap size={16} color={colors.warning} />
          <Text style={[styles.streakText, { color: colors.text }]}>
            {gamificationData.streakDays} day streak!
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { padding }]}>
        <View style={[
          styles.header,
          deviceType === 'desktop' ? styles.headerDesktop : null
        ]}>
          <View style={styles.headerText}>
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
              Recovery Day {gamificationData.streakDays || 1}
            </Text>
          </View>
        </View>

        {renderGamificationCard()}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={[
            styles.quickActionsContainer,
            deviceType !== 'mobile' ? styles.gridContainer : null
          ]}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommended Resources</Text>
            <TouchableOpacity 
              onPress={() => {
                analyticsService.trackUserAction('view_all_resources', 'dashboard');
                router.push('/(tabs)/cases');
              }}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={[
            styles.resourcesContainer,
            deviceType !== 'mobile' ? styles.gridContainer : null
          ]}>
            {resources.map(renderResourceCard)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Progress</Text>
          <TouchableOpacity 
            style={[styles.dailyTaskCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleDailyTask}
          >
            <View style={styles.dailyTaskContent}>
              <Text style={[styles.dailyTaskTitle, { color: colors.text }]}>Complete Daily Check-in</Text>
              <Text style={[styles.dailyTaskDescription, { color: colors.textSecondary }]}>
                Earn 10 points by checking in today
              </Text>
            </View>
            <View style={[styles.dailyTaskPoints, { backgroundColor: colors.success + '20' }]}>
              <Text style={[styles.dailyTaskPointsText, { color: colors.success }]}>+10</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.emergencyButton, { backgroundColor: colors.error }]}
          onPress={() => {
            analyticsService.trackUserAction('emergency_contact_pressed', 'dashboard');
            console.log('Emergency Contact');
          }}
        >
          <Text style={styles.emergencyButtonText}>Emergency Contact</Text>
        </TouchableOpacity>
      </ScrollView>
      <BoltBadge />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerDesktop: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  headerText: {
    flex: 1,
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
  gamificationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  gamificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gamificationInfo: {
    flex: 1,
  },
  gamificationLevel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gamificationPoints: {
    fontSize: 14,
  },
  gamificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  streakText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionsContainer: {
    gap: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  dailyTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dailyTaskContent: {
    flex: 1,
  },
  dailyTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dailyTaskDescription: {
    fontSize: 14,
  },
  dailyTaskPoints: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dailyTaskPointsText: {
    fontSize: 14,
    fontWeight: 'bold',
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