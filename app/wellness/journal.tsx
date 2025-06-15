import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Save, Calendar, Heart } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabaseClient';
import { analyticsService } from '@/services/analyticsService';

interface JournalEntry {
  id: string;
  content: string;
  mood?: string;
  date: string;
  timestamp: number;
}

export default function JournalScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyticsService.trackScreen('journal');
    loadCurrentMood();
    loadRecentEntries();
  }, []);

  const loadCurrentMood = async () => {
    try {
      const today = new Date().toDateString();
      const savedMood = await AsyncStorage.getItem(`mood_${today}`);
      if (savedMood) {
        setCurrentMood(savedMood);
      }
    } catch (error) {
      console.error('Error loading current mood:', error);
    }
  };

  const loadRecentEntries = async () => {
    setIsLoading(true);
    try {
      // First try to load from Supabase if user is logged in
      if (user) {
        const { data, error } = await supabase
          .from('wellness_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('entry_type', 'journal')
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (!error && data && data.length > 0) {
          const formattedEntries = data.map(entry => ({
            id: entry.id,
            content: entry.content || '',
            mood: entry.mood,
            date: entry.created_at,
            timestamp: new Date(entry.created_at).getTime()
          }));
          setRecentEntries(formattedEntries);
          setIsLoading(false);
          return;
        }
      }
      
      // Fallback to AsyncStorage
      const entries = await AsyncStorage.getItem('journal_entries');
      if (entries) {
        const parsedEntries = JSON.parse(entries);
        setRecentEntries(parsedEntries.slice(0, 3)); // Show last 3 entries
      }
    } catch (error) {
      console.error('Error loading recent entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEntry = async () => {
    if (!content.trim()) {
      Alert.alert('Empty Entry', 'Please write something before saving.');
      return;
    }

    setIsSaving(true);
    
    try {
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        content: content.trim(),
        mood: currentMood || undefined,
        date: new Date().toISOString(),
        timestamp: Date.now(),
      };

      // Save to Supabase if user is logged in
      if (user) {
        const { data, error } = await supabase
          .from('wellness_entries')
          .insert([{
            user_id: user.id,
            entry_type: 'journal',
            mood: currentMood,
            content: content.trim(),
            created_at: new Date().toISOString()
          }]);
          
        if (error) {
          console.error('Error saving to Supabase:', error);
          // Continue with local storage as fallback
        } else {
          analyticsService.trackEvent('journal_entry_saved_to_supabase');
        }
      }

      // Always save to AsyncStorage as backup
      const existingEntries = await AsyncStorage.getItem('journal_entries');
      const entries = existingEntries ? JSON.parse(existingEntries) : [];
      
      // Add new entry to the beginning
      const updatedEntries = [newEntry, ...entries];
      
      // Save back to storage
      await AsyncStorage.setItem('journal_entries', JSON.stringify(updatedEntries));
      
      analyticsService.trackEvent('journal_entry_saved', {
        character_count: content.length,
        has_mood: !!currentMood
      });
      
      Alert.alert(
        'Entry Saved',
        'Your journal entry has been saved successfully.',
        [
          { text: 'Write Another', onPress: () => {
            setContent('');
            loadRecentEntries(); // Refresh the list
          }},
          { text: 'Done', onPress: () => router.back() }
        ]
      );
      
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save your entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMoodEmoji = (mood: string) => {
    const moodMap: { [key: string]: string } = {
      great: '😊',
      good: '🙂',
      okay: '😐',
      sad: '😔',
      stressed: '😰',
      anxious: '😟'
    };
    return moodMap[mood] || '😐';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Journal</Text>
          <TouchableOpacity 
            style={[styles.saveButton, { opacity: content.trim() ? 1 : 0.5 }]}
            onPress={saveEntry}
            disabled={!content.trim() || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.success} />
            ) : (
              <Save size={20} color={colors.success} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Current Mood Display */}
          {currentMood && (
            <View style={[styles.moodCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.moodEmoji}>{getMoodEmoji(currentMood)}</Text>
              <Text style={[styles.moodText, { color: colors.text }]}>
                Today you're feeling {currentMood}
              </Text>
            </View>
          )}

          {/* Writing Prompt */}
          <View style={[styles.promptCard, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
            <Heart size={20} color={colors.error} />
            <Text style={[styles.promptText, { color: colors.text }]}>
              What's on your mind today? Write about your thoughts, feelings, or anything that matters to you.
            </Text>
          </View>

          {/* Text Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Your thoughts...</Text>
            <TextInput
              style={[
                styles.textInput, 
                { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border
                }
              ]}
              multiline
              placeholder="Start writing here..."
              placeholderTextColor={colors.textSecondary}
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
            />
            <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
              {content.length} characters
            </Text>
          </View>

          {/* Recent Entries */}
          <View style={styles.recentSection}>
            <Text style={[styles.recentTitle, { color: colors.text }]}>Recent Entries</Text>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading recent entries...
                </Text>
              </View>
            ) : recentEntries.length > 0 ? (
              recentEntries.map((entry) => (
                <View key={entry.id} style={[styles.recentEntry, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.recentHeader}>
                    <View style={styles.recentDate}>
                      <Calendar size={14} color={colors.textSecondary} />
                      <Text style={[styles.recentDateText, { color: colors.textSecondary }]}>
                        {formatDate(entry.date)}
                      </Text>
                    </View>
                    {entry.mood && (
                      <Text style={styles.recentMood}>
                        {getMoodEmoji(entry.mood)}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.recentContent, { color: colors.text }]} numberOfLines={2}>
                    {entry.content}
                  </Text>
                </View>
              ))
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No journal entries yet. Start writing to see your entries here.
                </Text>
              </View>
            )}
          </View>

          {/* Writing Tips */}
          <View style={[styles.tipsCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
            <Text style={[styles.tipsTitle, { color: colors.primary }]}>✨ Writing Tips</Text>
            <Text style={[styles.tipsText, { color: colors.text }]}>
              • Write freely without worrying about grammar or structure{'\n'}
              • Focus on your emotions and how events made you feel{'\n'}
              • Be honest and authentic with yourself{'\n'}
              • Try to write regularly, even if just a few sentences
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
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
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodText: {
    fontSize: 16,
    fontWeight: '500',
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
  },
  promptText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 200,
    textAlignVertical: 'top',
    borderWidth: 1,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
  recentSection: {
    marginBottom: 32,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyState: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  recentEntry: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentDateText: {
    fontSize: 12,
  },
  recentMood: {
    fontSize: 16,
  },
  recentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  tipsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    borderWidth: 1,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 20,
  },
});