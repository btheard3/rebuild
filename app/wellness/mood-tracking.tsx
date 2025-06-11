import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, TrendingUp, BarChart3 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');

  const moodValues: { [key: string]: number } = {
    great: 5,
    good: 4,
    okay: 3,
    sad: 2,
    stressed: 1
  };

  const moodColors: { [key: string]: string } = {
    great: '#10B981',
    good: '#3B82F6',
    okay: '#F59E0B',
    sad: '#8B5CF6',
    stressed: '#EF4444'
  };

  const moodEmojis: { [key: string]: string } = {
    great: '😊',
    good: '🙂',
    okay: '😐',
    sad: '😔',
    stressed: '😰'
  };

  useEffect(() => {
    loadMoodHistory();
  }, []);

  useEffect(() => {
    if (moodHistory.length > 0) {
      calculateStats();
    }
  }, [moodHistory, selectedPeriod]);

  const loadMoodHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('mood_history');
      if (history) {
        const parsedHistory = JSON.parse(history);
        setMoodHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Error loading mood history:', error);
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
      sum + moodValues[entry.mood], 0
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
        value: entry ? moodValues[entry.mood] : 0
      });
    }

    const maxValue = 5;
    const chartHeight = 120;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Last 7 Days</Text>
        <View style={styles.chart}>
          {last7Days.map((day, index) => (
            <View key={index} style={styles.chartBar}>
              <View
                style={[
                  styles.bar,
                  {
                    height: (day.value / maxValue) * chartHeight,
                    backgroundColor: day.mood ? moodColors[day.mood] : '#334155',
                  }
                ]}
              />
              <Text style={styles.chartLabel}>
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mood Tracking</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'all'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
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
              <View style={[styles.statCard, { backgroundColor: '#10B981' + '15' }]}>
                <Calendar size={24} color="#10B981" />
                <Text style={styles.statNumber}>{stats.totalEntries}</Text>
                <Text style={styles.statLabel}>Check-ins</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: '#3B82F6' + '15' }]}>
                <TrendingUp size={24} color="#3B82F6" />
                <Text style={styles.statNumber}>{stats.currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>

            <View style={[styles.moodCard, { backgroundColor: moodColors[stats.mostCommonMood] + '15' }]}>
              <Text style={styles.moodEmoji}>{moodEmojis[stats.mostCommonMood]}</Text>
              <View style={styles.moodInfo}>
                <Text style={[styles.moodText, { color: moodColors[stats.mostCommonMood] }]}>
                  Most Common Mood
                </Text>
                <Text style={styles.moodLabel}>
                  {stats.mostCommonMood.charAt(0).toUpperCase() + stats.mostCommonMood.slice(1)}
                </Text>
              </View>
              <View style={styles.averageContainer}>
                <Text style={styles.averageNumber}>
                  {stats.weeklyAverage.toFixed(1)}
                </Text>
                <Text style={styles.averageLabel}>avg</Text>
              </View>
            </View>
          </View>
        )}

        {/* Mood Chart */}
        {moodHistory.length > 0 && renderMoodChart()}

        {/* Recent Entries */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          
          {getFilteredHistory().slice(0, 10).map((entry, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyEmoji}>
                {moodEmojis[entry.mood]}
              </Text>
              <View style={styles.historyInfo}>
                <Text style={styles.historyMood}>
                  {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                </Text>
                <Text style={styles.historyDate}>
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
              <BarChart3 size={48} color="#64748B" />
              <Text style={styles.emptyTitle}>No mood data yet</Text>
              <Text style={styles.emptyText}>
                Start tracking your mood daily to see patterns and insights over time.
              </Text>
            </View>
          )}
        </View>

        {/* Insights */}
        {stats && stats.totalEntries > 3 && (
          <View style={styles.insightsCard}>
            <Text style={styles.insightsTitle}>💡 Insights</Text>
            <Text style={styles.insightsText}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginTop: 20,
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
    color: '#94A3B8',
  },
  periodButtonTextActive: {
    color: 'white',
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
    color: '#F8FAFC',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
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
    color: '#F8FAFC',
  },
  averageContainer: {
    alignItems: 'center',
  },
  averageNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  averageLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  chartContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
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
    color: '#94A3B8',
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
    color: '#F8FAFC',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
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
    color: '#F8FAFC',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 14,
    color: '#94A3B8',
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
    color: '#F8FAFC',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  insightsCard: {
    backgroundColor: '#3B82F6' + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#3B82F6' + '30',
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 12,
  },
  insightsText: {
    fontSize: 14,
    color: '#F8FAFC',
    lineHeight: 20,
  },
});