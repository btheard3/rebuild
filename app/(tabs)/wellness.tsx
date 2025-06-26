import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BookOpen, Clock, ChartBar as BarChart3, Heart } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BoltBadge from '@/components/BoltBadge';
import { analyticsService } from '@/services/analyticsService';

type Mood = 'great' | 'good' | 'okay' | 'sad' | 'stressed';

interface MoodOption {
  id: Mood;
  emoji: string;
  label: string;
  color: string;
  description: string;
}

interface WellnessTool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  route: string;
  about: string;
}

export default function WellnessScreen() {
  const { colors } = useTheme();
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    // Track screen view
    analyticsService.trackScreen('wellness');
    
    // Load saved mood
    loadSavedMood();
    
    // Animate screen entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const moodOptions: MoodOption[] = [
    {
      id: 'great',
      emoji: '😊',
      label: 'Great',
      color: '#10B981',
      description: 'Feeling amazing and energetic!'
    },
    {
      id: 'good',
      emoji: '🙂',
      label: 'Good',
      color: '#3B82F6',
      description: 'Having a positive day'
    },
    {
      id: 'okay',
      emoji: '😐',
      label: 'Okay',
      color: '#F59E0B',
      description: 'Feeling neutral or balanced'
    },
    {
      id: 'sad',
      emoji: '😔',
      label: 'Sad',
      color: '#8B5CF6',
      description: 'Feeling down or melancholy'
    },
    {
      id: 'stressed',
      emoji: '😰',
      label: 'Stressed',
      color: '#EF4444',
      description: 'Feeling overwhelmed or anxious'
    }
  ];

  const wellnessTools: WellnessTool[] = [
    {
      id: 'journal',
      title: 'Journal',
      description: 'Record your thoughts and feelings',
      icon: BookOpen,
      color: '#10B981',
      route: '/wellness/journal',
      about: 'Journaling helps process emotions and track your recovery journey. Write freely about your experiences, challenges, and victories.'
    },
    {
      id: 'meditation',
      title: 'Meditation',
      description: 'Guided sessions for stress relief',
      icon: Clock,
      color: '#8B5CF6',
      route: '/wellness/meditation',
      about: 'Meditation reduces stress and anxiety through guided breathing and mindfulness exercises. Even a few minutes daily can improve mental wellbeing.'
    },
    {
      id: 'mood-tracking',
      title: 'Mood Tracking',
      description: 'Monitor your emotional wellbeing',
      icon: BarChart3,
      color: '#3B82F6',
      route: '/wellness/mood-tracking',
      about: 'Tracking your mood helps identify patterns and triggers. Visualize your emotional journey and celebrate improvements over time.'
    }
  ];

  const loadSavedMood = async () => {
    try {
      const today = new Date().toDateString();
      const savedMood = await AsyncStorage.getItem(`mood_${today}`);
      if (savedMood) {
        setSelectedMood(savedMood as Mood);
      }
    } catch (error) {
      console.error('Error loading current mood:', error);
    }
  };

  const handleMoodSelection = async (mood: Mood) => {
    try {
      setSelectedMood(mood);
      
      // Save to AsyncStorage with today's date
      const today = new Date().toDateString();
      await AsyncStorage.setItem(`mood_${today}`, mood);
      
      // Save to mood history for tracking
      const moodHistory = await AsyncStorage.getItem('mood_history');
      const history = moodHistory ? JSON.parse(moodHistory) : [];
      
      const newEntry = {
        mood,
        date: new Date().toISOString(),
        timestamp: Date.now()
      };
      
      // Remove any existing entry for today and add new one
      const filteredHistory = history.filter((entry: any) => 
        new Date(entry.date).toDateString() !== today
      );
      
      await AsyncStorage.setItem('mood_history', JSON.stringify([newEntry, ...filteredHistory]));
      
      // Track mood selection in analytics
      analyticsService.trackEvent('mood_selected', {
        mood,
        screen: 'wellness'
      });
      
      // Show confirmation
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
      
    } catch (error) {
      console.error('Error saving mood:', error);
      Alert.alert('Error', 'Failed to save your mood. Please try again.');
    }
  };

  const handleToolPress = (tool: WellnessTool) => {
    analyticsService.trackEvent('wellness_tool_selected', {
      tool: tool.id
    });
    
    router.push(tool.route as any);
  };

  const selectedMoodData = selectedMood ? moodOptions.find(m => m.id === selectedMood) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Wellness</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>How are you feeling today?</Text>
        </View>

        {/* Mood Selection */}
        <Animated.View style={[styles.moodSection, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.moodGrid}>
            {moodOptions.map((mood, index) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodButton,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                  },
                  selectedMood === mood.id && { 
                    borderColor: mood.color,
                    borderWidth: 3,
                    backgroundColor: mood.color + '15'
                  }
                ]}
                onPress={() => handleMoodSelection(mood.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  { color: colors.text },
                  selectedMood === mood.id && { color: mood.color, fontWeight: '600' }
                ]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Mood Confirmation */}
          {showConfirmation && selectedMoodData && (
            <Animated.View style={[
              styles.confirmationCard,
              { backgroundColor: selectedMoodData.color + '15', borderColor: selectedMoodData.color }
            ]}>
              <Heart size={20} color={selectedMoodData.color} />
              <Text style={[styles.confirmationText, { color: selectedMoodData.color }]}>
                Thanks for checking in! You selected "{selectedMoodData.label}"
              </Text>
              <Text style={[styles.confirmationSubtext, { color: colors.textSecondary }]}>
                {selectedMoodData.description}
              </Text>
            </Animated.View>
          )}

          {/* Current Mood Display */}
          {selectedMood && !showConfirmation && selectedMoodData && (
            <View style={[
              styles.currentMoodCard,
              { backgroundColor: selectedMoodData.color + '10', borderColor: selectedMoodData.color + '30' }
            ]}>
              <Text style={styles.currentMoodEmoji}>{selectedMoodData.emoji}</Text>
              <View style={styles.currentMoodInfo}>
                <Text style={[styles.currentMoodLabel, { color: selectedMoodData.color }]}>
                  Today you're feeling {selectedMoodData.label.toLowerCase()}
                </Text>
                <Text style={[styles.currentMoodDescription, { color: colors.textSecondary }]}>
                  {selectedMoodData.description}
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Wellness Tools */}
        <View style={styles.toolsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Wellness Tools</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Explore tools to support your mental wellbeing
          </Text>

          <View style={styles.toolsGrid}>
            {wellnessTools.map((tool, index) => (
              <TouchableOpacity
                key={tool.id}
                style={[styles.toolCard, { backgroundColor: tool.color + '10' }]}
                onPress={() => handleToolPress(tool)}
                activeOpacity={0.8}
              >
                <View style={[styles.toolIconContainer, { backgroundColor: tool.color + '20' }]}>
                  <tool.icon size={28} color={tool.color} />
                </View>
                <Text style={[styles.toolTitle, { color: colors.text }]}>{tool.title}</Text>
                <Text style={[styles.toolDescription, { color: colors.textSecondary }]}>{tool.description}</Text>
                <Text style={[styles.toolAbout, { color: colors.text }]}>{tool.about}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Motivational Quote */}
        <View style={[styles.quoteSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Heart size={24} color="#EF4444" />
          <Text style={[styles.quote, { color: colors.text }]}>
            "Your mental health is a priority. Your happiness is essential. Your self-care is a necessity."
          </Text>
          <Text style={[styles.quoteAuthor, { color: colors.textSecondary }]}>— Anonymous</Text>
        </View>

        {/* Daily Tip */}
        <View style={[styles.tipSection, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <Text style={[styles.tipTitle, { color: colors.primary }]}>💡 Daily Wellness Tip</Text>
          <Text style={[styles.tipText, { color: colors.text }]}>
            Take 5 minutes today to practice deep breathing. Inhale for 4 counts, hold for 4, exhale for 6. This simple technique can help reduce stress and improve focus.
          </Text>
        </View>
      </Animated.ScrollView>
      <BoltBadge />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  moodSection: {
    marginBottom: 40,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  moodButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  confirmationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  confirmationText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  currentMoodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
    gap: 16,
  },
  currentMoodEmoji: {
    fontSize: 40,
  },
  currentMoodInfo: {
    flex: 1,
  },
  currentMoodLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentMoodDescription: {
    fontSize: 14,
  },
  toolsSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  toolsGrid: {
    gap: 16,
  },
  toolCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
  },
  toolIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  toolDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  toolAbout: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  quoteSection: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  quote: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
    marginVertical: 16,
  },
  quoteAuthor: {
    fontSize: 14,
    fontWeight: '500',
  },
  tipSection: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 40,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
  },
});