import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyticsService } from '@/services/analyticsService';

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: Date;
};

type GamificationData = {
  points: number;
  level: number;
  achievements: Achievement[];
  streakDays: number;
  lastActiveDate?: Date;
};

type GamificationContextType = {
  data: GamificationData;
  addPoints: (points: number, reason: string) => void;
  completeAchievement: (achievementId: string) => void;
  updateStreak: () => void;
  getPointsToNextLevel: () => number;
  getLevelProgress: () => number;
  resetProgress: () => void;
};

const defaultAchievements: Achievement[] = [
  {
    id: 'first_login',
    title: 'Welcome Aboard',
    description: 'Complete your first login to Rebuild',
    icon: '🎉',
    points: 10,
    unlocked: false
  },
  {
    id: 'complete_wizard',
    title: 'Recovery Planner',
    description: 'Complete the recovery wizard',
    icon: '📋',
    points: 50,
    unlocked: false
  },
  {
    id: 'first_journal',
    title: 'Mindful Moment',
    description: 'Write your first journal entry',
    icon: '📝',
    points: 25,
    unlocked: false
  },
  {
    id: 'upload_document',
    title: 'Document Keeper',
    description: 'Upload your first important document',
    icon: '📄',
    points: 30,
    unlocked: false
  },
  {
    id: 'week_streak',
    title: 'Consistent Progress',
    description: 'Use the app for 7 consecutive days',
    icon: '🔥',
    points: 100,
    unlocked: false
  },
  {
    id: 'meditation_master',
    title: 'Meditation Master',
    description: 'Complete 10 meditation sessions',
    icon: '🧘',
    points: 75,
    unlocked: false
  },
  {
    id: 'resource_explorer',
    title: 'Resource Explorer',
    description: 'View 5 different recovery resources',
    icon: '🔍',
    points: 40,
    unlocked: false
  },
  {
    id: 'community_helper',
    title: 'Community Helper',
    description: 'Share a resource with someone',
    icon: '🤝',
    points: 60,
    unlocked: false
  }
];

const initialData: GamificationData = {
  points: 0,
  level: 1,
  achievements: defaultAchievements,
  streakDays: 0
};

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<GamificationData>(initialData);

  useEffect(() => {
    loadGamificationData();
  }, []);

  useEffect(() => {
    saveGamificationData();
  }, [data]);

  const loadGamificationData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('gamification_data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Ensure we have all achievements, including new ones
        const mergedAchievements = defaultAchievements.map(defaultAch => {
          const savedAch = parsedData.achievements?.find((a: Achievement) => a.id === defaultAch.id);
          return savedAch || defaultAch;
        });
        
        setData({
          ...parsedData,
          achievements: mergedAchievements,
          lastActiveDate: parsedData.lastActiveDate ? new Date(parsedData.lastActiveDate) : undefined
        });
      }
    } catch (error) {
      console.error('Failed to load gamification data:', error);
    }
  };

  const saveGamificationData = async () => {
    try {
      await AsyncStorage.setItem('gamification_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save gamification data:', error);
    }
  };

  const calculateLevel = (points: number): number => {
    // Level formula: level = floor(sqrt(points / 100)) + 1
    return Math.floor(Math.sqrt(points / 100)) + 1;
  };

  const getPointsToNextLevel = (): number => {
    const currentLevel = data.level;
    const pointsForNextLevel = Math.pow(currentLevel, 2) * 100;
    return pointsForNextLevel - data.points;
  };

  const getLevelProgress = (): number => {
    const currentLevel = data.level;
    const pointsForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
    const pointsForNextLevel = Math.pow(currentLevel, 2) * 100;
    const progressPoints = data.points - pointsForCurrentLevel;
    const totalPointsNeeded = pointsForNextLevel - pointsForCurrentLevel;
    return Math.min(progressPoints / totalPointsNeeded, 1);
  };

  const addPoints = (points: number, reason: string) => {
    setData(prev => {
      const newPoints = prev.points + points;
      const newLevel = calculateLevel(newPoints);
      
      analyticsService.trackEvent('points_earned', {
        points,
        reason,
        total_points: newPoints,
        level: newLevel
      });

      if (newLevel > prev.level) {
        analyticsService.trackEvent('level_up', {
          old_level: prev.level,
          new_level: newLevel,
          total_points: newPoints
        });
      }

      return {
        ...prev,
        points: newPoints,
        level: newLevel
      };
    });
  };

  const completeAchievement = (achievementId: string) => {
    setData(prev => {
      const achievement = prev.achievements.find(a => a.id === achievementId);
      if (!achievement || achievement.unlocked) {
        return prev;
      }

      const updatedAchievements = prev.achievements.map(a =>
        a.id === achievementId
          ? { ...a, unlocked: true, unlockedAt: new Date() }
          : a
      );

      const newPoints = prev.points + achievement.points;
      const newLevel = calculateLevel(newPoints);

      analyticsService.trackEvent('achievement_unlocked', {
        achievement_id: achievementId,
        achievement_title: achievement.title,
        points_earned: achievement.points,
        total_points: newPoints
      });

      return {
        ...prev,
        achievements: updatedAchievements,
        points: newPoints,
        level: newLevel
      };
    });
  };

  const updateStreak = () => {
    setData(prev => {
      const today = new Date();
      const lastActive = prev.lastActiveDate;
      
      let newStreakDays = prev.streakDays;
      
      if (!lastActive) {
        newStreakDays = 1;
      } else {
        const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          newStreakDays = prev.streakDays + 1;
        } else if (daysDiff > 1) {
          // Streak broken
          newStreakDays = 1;
        }
        // If daysDiff === 0, it's the same day, so no change
      }

      // Check for streak achievements
      if (newStreakDays === 7 && prev.streakDays < 7) {
        setTimeout(() => completeAchievement('week_streak'), 100);
      }

      analyticsService.trackEvent('streak_updated', {
        streak_days: newStreakDays,
        previous_streak: prev.streakDays
      });

      return {
        ...prev,
        streakDays: newStreakDays,
        lastActiveDate: today
      };
    });
  };

  const resetProgress = () => {
    setData(initialData);
    AsyncStorage.removeItem('gamification_data');
    analyticsService.trackEvent('progress_reset');
  };

  return (
    <GamificationContext.Provider value={{
      data,
      addPoints,
      completeAchievement,
      updateStreak,
      getPointsToNextLevel,
      getLevelProgress,
      resetProgress
    }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};