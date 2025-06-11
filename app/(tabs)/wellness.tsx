import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BookOpen, Clock, ChartBar as BarChart3, Heart, Sparkles } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

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
}

export default function WellnessScreen() {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

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
      route: '/wellness/journal'
    },
    {
      id: 'meditation',
      title: 'Meditation',
      description: 'Guided sessions for stress relief',
      icon: Clock,
      color: '#8B5CF6',
      route: '/wellness/meditation'
    },
    {
      id: 'mood-tracking',
      title: 'Mood Tracking',
      description: 'Monitor your emotional wellbeing',
      icon: BarChart3,
      color: '#3B82F6',
      route: '/wellness/mood-tracking'
    }
  ];

  useEffect(() => {
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

  const loadSavedMood = async () => {
    try {
      const today = new Date().toDateString();
      const savedMood = await AsyncStorage.getItem(`mood_${today}`);
      if (savedMood) {
        setSelectedMood(savedMood as Mood);
      }
    } catch (error) {
      console.error('Error loading saved mood:', error);
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
      
      // Show confirmation
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
      
      // TODO: In a real app, also save to Supabase
      // await saveMoodToSupabase(mood);
      
    } catch (error) {
      console.error('Error saving mood:', error);
      Alert.alert('Error', 'Failed to save your mood. Please try again.');
    }
  };

  const handleToolPress = (tool: WellnessTool) => {
    // For now, we'll show an alert since the routes don't exist yet
    // In a real implementation, you'd navigate to the actual screens
    
    switch (tool.id) {
      case 'journal':
        Alert.alert(
          'Journal',
          'Opening your personal journal where you can write about your thoughts and feelings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue', onPress: () => router.push('/wellness/journal' as any) }
          ]
        );
        break;
      case 'meditation':
        Alert.alert(
          'Meditation',
          'Access guided meditation sessions and breathing exercises.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue', onPress: () => router.push('/wellness/meditation' as any) }
          ]
        );
        break;
      case 'mood-tracking':
        Alert.alert(
          'Mood Tracking',
          'View your mood history and emotional patterns over time.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue', onPress: () => router.push('/wellness/mood-tracking' as any) }
          ]
        );
        break;
    }
  };

  const selectedMoodData = selectedMood ? moodOptions.find(m => m.id === selectedMood) : null;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Wellness</Text>
          <Text style={styles.subtitle}>How are you feeling today?</Text>
        </View>

        {/* Mood Selection */}
        <Animated.View style={[styles.moodSection, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.moodGrid}>
            {moodOptions.map((mood, index) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodButton,
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
              <Sparkles size={20} color={selectedMoodData.color} />
              <Text style={[styles.confirmationText, { color: selectedMoodData.color }]}>
                Thanks for checking in! You selected "{selectedMoodData.label}"
              </Text>
              <Text style={styles.confirmationSubtext}>
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
                <Text style={styles.currentMoodDescription}>
                  {selectedMoodData.description}
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Wellness Tools */}
        <View style={styles.toolsSection}>
          <Text style={styles.sectionTitle}>Wellness Tools</Text>
          <Text style={styles.sectionSubtitle}>
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
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Text style={styles.toolDescription}>{tool.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Motivational Quote */}
        <View style={styles.quoteSection}>
          <Heart size={24} color="#EF4444" />
          <Text style={styles.quote}>
            "Your mental health is a priority. Your happiness is essential. Your self-care is a necessity."
          </Text>
          <Text style={styles.quoteAuthor}>— Anonymous</Text>
        </View>

        {/* Daily Tip */}
        <View style={styles.tipSection}>
          <Text style={styles.tipTitle}>💡 Daily Wellness Tip</Text>
          <Text style={styles.tipText}>
            Take 5 minutes today to practice deep breathing. Inhale for 4 counts, hold for 4, exhale for 6. This simple technique can help reduce stress and improve focus.
          </Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
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
    color: '#F8FAFC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#94A3B8',
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
    width: (width - 80) / 3,
    aspectRatio: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#334155',
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
    color: '#F8FAFC',
    textAlign: 'center',
  },
  confirmationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
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
    color: '#64748B',
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
    color: '#94A3B8',
  },
  toolsSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
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
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  toolDescription: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  quoteSection: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quote: {
    fontSize: 16,
    color: '#F8FAFC',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
    marginVertical: 16,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  tipSection: {
    backgroundColor: '#3B82F6' + '15',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3B82F6' + '30',
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#F8FAFC',
    lineHeight: 22,
  },
});