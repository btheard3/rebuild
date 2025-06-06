import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useGamification } from '@/context/GamificationContext';
import { useResponsive, getResponsiveValue } from '@/hooks/useResponsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyticsService } from '@/services/analyticsService';
import { Trophy, Star, Lock, Calendar, Target, TrendingUp } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';

export default function AchievementsScreen() {
  const { colors } = useTheme();
  const { data: gamificationData, getPointsToNextLevel, getLevelProgress } = useGamification();
  const { deviceType } = useResponsive();

  const getPadding = getResponsiveValue(16, 24, 32);
  const getMaxWidth = getResponsiveValue('100%', 800, 1000);
  const getCardWidth = getResponsiveValue('100%', '48%', '32%');
  
  const padding = getPadding(deviceType);
  const maxWidth = getMaxWidth(deviceType);
  const cardWidth = getCardWidth(deviceType);

  useEffect(() => {
    analyticsService.trackScreen('achievements');
  }, []);

  const unlockedAchievements = gamificationData.achievements.filter(a => a.unlocked);
  const lockedAchievements = gamificationData.achievements.filter(a => !a.unlocked);

  const renderProgressBar = () => {
    const progress = getLevelProgress();
    const pointsToNext = getPointsToNextLevel();

    return (
      <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.progressHeader}>
          <View style={styles.levelInfo}>
            <Text style={[styles.levelText, { color: colors.primary }]}>Level {gamificationData.level}</Text>
            <Text style={[styles.pointsText, { color: colors.text }]}>
              {gamificationData.points.toLocaleString()} points
            </Text>
          </View>
          <View style={[styles.trophyContainer, { backgroundColor: colors.primary + '20' }]}>
            <Trophy size={24} color={colors.primary} />
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarBackground, { backgroundColor: colors.disabled }]}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  backgroundColor: colors.primary,
                  width: `${progress * 100}%`
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {pointsToNext} points to level {gamificationData.level + 1}
          </Text>
        </View>
      </View>
    );
  };

  const renderAchievement = (achievement: any) => {
    const isUnlocked = achievement.unlocked;
    
    return (
      <TouchableOpacity
        key={achievement.id}
        style={[
          styles.achievementCard,
          { 
            backgroundColor: isUnlocked ? colors.surface : colors.surface + '80',
            borderColor: isUnlocked ? colors.success : colors.border,
            borderWidth: isUnlocked ? 2 : 1,
            width: cardWidth,
            marginBottom: deviceType === 'mobile' ? 12 : 16,
          }
        ]}
        onPress={() => {
          analyticsService.trackEvent('achievement_viewed', {
            achievement_id: achievement.id,
            unlocked: isUnlocked
          });
        }}
      >
        <View style={styles.achievementHeader}>
          <View style={[
            styles.achievementIcon,
            { 
              backgroundColor: isUnlocked ? colors.success + '20' : colors.disabled + '20'
            }
          ]}>
            {isUnlocked ? (
              <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
            ) : (
              <Lock size={24} color={colors.disabled} />
            )}
          </View>
          
          <View style={[styles.pointsBadge, { backgroundColor: colors.primary + '20' }]}>
            <Star size={12} color={colors.primary} />
            <Text style={[styles.pointsBadgeText, { color: colors.primary }]}>
              {achievement.points}
            </Text>
          </View>
        </View>

        <Text style={[
          styles.achievementTitle, 
          { color: isUnlocked ? colors.text : colors.textSecondary }
        ]}>
          {achievement.title}
        </Text>
        
        <Text style={[
          styles.achievementDescription, 
          { color: isUnlocked ? colors.textSecondary : colors.disabled }
        ]}>
          {achievement.description}
        </Text>

        {isUnlocked && achievement.unlockedAt && (
          <View style={styles.unlockedInfo}>
            <Calendar size={12} color={colors.success} />
            <Text style={[styles.unlockedText, { color: colors.success }]}>
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Target size={20} color={colors.primary} />
        <Text style={[styles.statNumber, { color: colors.text }]}>
          {unlockedAchievements.length}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          Unlocked
        </Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TrendingUp size={20} color={colors.success} />
        <Text style={[styles.statNumber, { color: colors.text }]}>
          {gamificationData.streakDays}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          Day Streak
        </Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Star size={20} color={colors.warning} />
        <Text style={[styles.statNumber, { color: colors.text }]}>
          {Math.round((unlockedAchievements.length / gamificationData.achievements.length) * 100)}%
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          Complete
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={[styles.content, { paddingHorizontal: padding, maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Achievements</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Track your recovery journey progress
          </Text>
        </View>

        {renderProgressBar()}
        {renderStats()}

        {unlockedAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Unlocked ({unlockedAchievements.length})
            </Text>
            <View style={[
              styles.achievementsGrid,
              deviceType !== 'mobile' ? styles.gridContainer : null
            ]}>
              {unlockedAchievements.map(renderAchievement)}
            </View>
          </View>
        )}

        {lockedAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Locked ({lockedAchievements.length})
            </Text>
            <View style={[
              styles.achievementsGrid,
              deviceType !== 'mobile' ? styles.gridContainer : null
            ]}>
              {lockedAchievements.map(renderAchievement)}
            </View>
          </View>
        )}

        <View style={[styles.motivationCard, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.motivationTitle, { color: colors.primary }]}>
            Keep Going!
          </Text>
          <Text style={[styles.motivationText, { color: colors.text }]}>
            Every step in your recovery journey matters. Complete daily tasks, explore resources, and engage with the app to unlock more achievements and earn points.
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
  content: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  progressCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelInfo: {
    flex: 1,
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pointsText: {
    fontSize: 16,
  },
  trophyContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    gap: 8,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  achievementsGrid: {
    gap: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementEmoji: {
    fontSize: 24,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  unlockedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  motivationCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    lineHeight: 20,
  },
});