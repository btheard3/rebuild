import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, TrendingUp, ChartBar as BarChart3 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { analyticsService } from '@/services/analyticsService';

const { width } = Dimensions.get('window');

interface MoodEntry {
  mood: string;
  date: string;
  timestamp: number;
}

interface MoodStats {
  totalEntries: number;
  mostCommonMood: string;
  currentStreak: number;
  weeklyAverage: number;
}

export default function MoodTrackingScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [isLoading, setIsLoading] = useState(true);

  const moodValues: { [key: string]: number } = {
    great: 5,
    good: 4,
    okay: 3,
    sad: 2,
    stressed: 1,
    anxious: 1
  };

  const moodColors: { [key: string]: string } = {
    great: '#10B981',
    good: '#3B82F6',
    okay: '#F59E0B',
    sad: '#8B5CF6',
    stressed: '#EF4444',
    anxious: '#F97316'
  };

  const moodEmojis: { [key: string]: string } = {
    great: '😊',
    good: '🙂',
    okay: '😐',
    sad: '😔',
    stressed: '😰',
    anxious: '😟'
  };

  useEffect(() => {
    analyticsService.trackScreen('mood_tracking');
    loadMoodHistory();
  }, []);

  useEffect(() => {
    if (moodHistory.length > 0) {
      calculateStats();
    } else {
      setStats(null);
    }
  }, [moodHistory, selectedPeriod]);

  const loadMoodHistory = async () => {
    setIsLoading(true);
    try {
      // First try to load from Supabase if user is logged in
      if (user) {
        const { data, error } = await supabase
          .from('wellness_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('entry_type', 'mood')
          .order('created_at', { ascending: false });
          
        if (!error && data && data.length > 0) {
          const formattedEntries = data.map(entry => ({
            mood: entry.mood || 'okay',
            date: entry.created_at,
            timestamp: new Date(entry.created_at).getTime()
          }));
          setMoodHistory(formattedEntries);
          setIsLoading(false);
          return;
        }
      }
      
      // Fallback to AsyncStorage
      const history = await AsyncStorage.getItem('mood_history');
      if (history) {
        const parsedHistory = JSON.parse(history);
        setMoodHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Error loading mood history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    let filteredHistory = moodHistory;

    // Filter based on selected period
    if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredHistory = moodHistory.filter(entry => new Date(entry.date) >= weekAgo);
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredHistory = moodHistory.filter(entry => new Date(entry.date) >= monthAgo);
    }

    if (filteredHistory.length === 0) {
      setStats(null);
      return;
    }

    // Calculate most common mood
    const moodCounts: { [key: string]: number } = {};
    filteredHistory.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });

    const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => 
      moodCounts[a] > moodCounts[b] ? a : b
    );

    // Calculate current streak
    let currentStreak = 0;
    const sortedHistory = [...filteredHistory].sort((a, b) => b.timestamp - a.timestamp);
    
    for (let i = 0; i < sortedHistory.length; i++) {
      const entryDate = new Date(sortedHistory[i].date).toDateString();
      const expectedDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toDateString();
      
      if (entryDate === expectedDate) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate weekly average mood value
    const totalMoodValue = filteredHistory.reduce((sum, entry) => 
      sum + (moodValues[entry.mood] || 3), 0
    );
    const weeklyAverage = totalMoodValue / filteredHistory.length;

    setStats({
      totalEntries: filteredHistory.length,
      mostCommonMood,
      currentStreak,
      weeklyAverage
    });
  };

  const getFilteredHistory = () => {
    const now = new Date();
    let filtered = moodHistory;

    if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = moodHistory.filter(entry => new Date(entry.date) >= weekAgo);
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = moodHistory.filter(entry => new Date(entry.date) >= monthAgo);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const renderMoodChart = () => {
    const filteredHistory = getFilteredHistory();
    const last7Days = [];
    const now = new Date();

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = date.toDateString();
      const entry = filteredHistory.find(h => new Date(h.date).toDateString() === dateString);
      
      last7Days.push({
        date: date,
        mood: entry?.mood || null,
        value: entry ? (moodValues[entry.mood] || 0) : 0
      });
    }

    const maxValue = 5;
    const chartHeight = 120;

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Last 7 Days</Text>
        <View style={styles.chart}>
          {last7Days.map((day, index) => (
            <View key={index} style={styles.chartBar}>
              <View
                style={[
                  styles.bar,
                  {
                    height: (day.value / maxValue) * chartHeight,
                    backgroundColor: day.mood ? moodColors[day.mood] : colors.disabled,
                  }
                ]}
              />
              <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>
                {day.date.getDate()}
              </Text>
              {day.mood && (
                <Text style={styles.chartEmoji}>
                  {moodEmojis[day.mood]}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mood Tracking</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your mood data...
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Period Selector */}
          <View style={[styles.periodSelector, { backgroundColor: colors.surface }]}>
            {(['week', 'month', 'all'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && [styles.periodButtonActive, { backgroundColor: colors.primary }]
                ]}
                onPress={() => {
                  setSelectedPeriod(period);
                  analyticsService.trackEvent('mood_period_changed', { period });
                }}
              >
                <Text style={[
                  styles.periodButtonText,
                  { color: colors.textSecondary },
                  selectedPeriod === period && { color: 'white' }
                ]}>
                  {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Stats Cards */}
          {stats && (
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: colors.success + '15' }]}>
                  <Calendar size={24} color={colors.success} />
                  <Text style={[styles.statNumber, { color: colors.text }]}>{stats.totalEntries}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Check-ins</Text>
                </View>
                
                <View style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
                  <TrendingUp size={24} color={colors.primary} />
                  <Text style={[styles.statNumber, { color: colors.text }]}>{stats.currentStreak}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
                </View>
              </View>

              <View style={[styles.moodCard, { backgroundColor: moodColors[stats.mostCommonMood] + '15' }]}>
                <Text style={styles.moodEmoji}>{moodEmojis[stats.mostCommonMood]}</Text>
                <View style={styles.moodInfo}>
                  <Text style={[styles.moodText, { color: moodColors[stats.mostCommonMood] }]}>
                    Most Common Mood
                  </Text>
                  <Text style={[styles.moodLabel, { color: colors.text }]}>
                    {stats.mostCommonMood.charAt(0).toUpperCase() + stats.mostCommonMood.slice(1)}
                  </Text>
                </View>
                <View style={styles.averageContainer}>
                  <Text style={[styles.averageNumber, { color: colors.text }]}>
                    {stats.weeklyAverage.toFixed(1)}
                  </Text>
                  <Text style={[styles.averageLabel, { color: colors.textSecondary }]}>avg</Text>
                </View>
              </View>
            </View>
          )}

          {/* Mood Chart */}
          {moodHistory.length > 0 && renderMoodChart()}

          {/* Recent Entries */}
          <View style={styles.historySection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Entries</Text>
            
            {getFilteredHistory().slice(0, 10).map((entry, index) => (
              <View key={index} style={[styles.historyItem, { backgroundColor: colors.surface }]}>
                <Text style={styles.historyEmoji}>
                  {moodEmojis[entry.mood]}
                </Text>
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyMood, { color: colors.text }]}>
                    {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                  </Text>
                  <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                    {formatDate(entry.date)}
                  </Text>
                </View>
                <View 
                  style={[
                    styles.moodIndicator, 
                    { backgroundColor: moodColors[entry.mood] }
                  ]} 
                />
              </View>
            ))}
            
            {getFilteredHistory().length === 0 && (
              <View style={styles.emptyState}>
                <BarChart3 size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No mood data yet</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Start tracking your mood daily to see patterns and insights over time.
                </Text>
              </View>
            )}
          </View>

          {/* Insights */}
          {stats && stats.totalEntries > 3 && (
            <View style={[styles.insightsCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
              <Text style={[styles.insightsTitle, { color: colors.primary }]}>💡 Insights</Text>
              <Text style={[styles.insightsText, { color: colors.text }]}>
                {stats.currentStreak > 0 && `You're on a ${stats.currentStreak}-day tracking streak! `}
                {stats.weeklyAverage >= 4 
                  ? "You've been feeling quite positive lately. Keep up the great work!"
                  : stats.weeklyAverage >= 3
                  ? "Your mood has been fairly balanced. Consider what activities make you feel your best."
                  : "It looks like you've been having some challenging days. Remember that it's okay to seek support when you need it."
                }
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#3B82F6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  moodEmoji: {
    fontSize: 32,
  },
  moodInfo: {
    flex: 1,
  },
  moodText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  averageContainer: {
    alignItems: 'center',
  },
  averageNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  averageLabel: {
    fontSize: 12,
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  chartEmoji: {
    fontSize: 16,
  },
  historySection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 16,
  },
  historyEmoji: {
    fontSize: 24,
  },
  historyInfo: {
    flex: 1,
  },
  historyMood: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 14,
  },
  moodIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  insightsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    borderWidth: 1,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  insightsText: {
    fontSize: 14,
    lineHeight: 20,
  },
});