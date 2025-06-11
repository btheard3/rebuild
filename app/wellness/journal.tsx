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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Save, Calendar, Heart } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface JournalEntry {
  id: string;
  content: string;
  mood?: string;
  date: string;
  timestamp: number;
}

export default function JournalScreen() {
  const [content, setContent] = useState('');
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
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
    try {
      const entries = await AsyncStorage.getItem('journal_entries');
      if (entries) {
        const parsedEntries = JSON.parse(entries);
        setRecentEntries(parsedEntries.slice(0, 3)); // Show last 3 entries
      }
    } catch (error) {
      console.error('Error loading recent entries:', error);
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

      // Load existing entries
      const existingEntries = await AsyncStorage.getItem('journal_entries');
      const entries = existingEntries ? JSON.parse(existingEntries) : [];
      
      // Add new entry to the beginning
      const updatedEntries = [newEntry, ...entries];
      
      // Save back to storage
      await AsyncStorage.setItem('journal_entries', JSON.stringify(updatedEntries));
      
      // TODO: In a real app, also save to Supabase
      // await saveEntryToSupabase(newEntry);
      
      Alert.alert(
        'Entry Saved',
        'Your journal entry has been saved successfully.',
        [
          { text: 'Write Another', onPress: () => setContent('') },
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
      stressed: '😰'
    };
    return moodMap[mood] || '😐';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#F8FAFC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Journal</Text>
          <TouchableOpacity 
            style={[styles.saveButton, { opacity: content.trim() ? 1 : 0.5 }]}
            onPress={saveEntry}
            disabled={!content.trim() || isSaving}
          >
            <Save size={20} color="#10B981" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Mood Display */}
          {currentMood && (
            <View style={styles.moodCard}>
              <Text style={styles.moodEmoji}>{getMoodEmoji(currentMood)}</Text>
              <Text style={styles.moodText}>
                Today you're feeling {currentMood}
              </Text>
            </View>
          )}

          {/* Writing Prompt */}
          <View style={styles.promptCard}>
            <Heart size={20} color="#EF4444" />
            <Text style={styles.promptText}>
              What's on your mind today? Write about your thoughts, feelings, or anything that matters to you.
            </Text>
          </View>

          {/* Text Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Your thoughts...</Text>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Start writing here..."
              placeholderTextColor="#64748B"
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {content.length} characters
            </Text>
          </View>

          {/* Recent Entries */}
          {recentEntries.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>Recent Entries</Text>
              {recentEntries.map((entry) => (
                <View key={entry.id} style={styles.recentEntry}>
                  <View style={styles.recentHeader}>
                    <View style={styles.recentDate}>
                      <Calendar size={14} color="#94A3B8" />
                      <Text style={styles.recentDateText}>
                        {formatDate(entry.date)}
                      </Text>
                    </View>
                    {entry.mood && (
                      <Text style={styles.recentMood}>
                        {getMoodEmoji(entry.mood)}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.recentContent} numberOfLines={2}>
                    {entry.content}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Writing Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>✨ Writing Tips</Text>
            <Text style={styles.tipsText}>
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
    backgroundColor: '#0F172A',
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
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
    gap: 12,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodText: {
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EF4444' + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: '#EF4444' + '30',
  },
  promptText: {
    flex: 1,
    fontSize: 14,
    color: '#F8FAFC',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F8FAFC',
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#334155',
  },
  characterCount: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 8,
  },
  recentSection: {
    marginBottom: 32,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  recentEntry: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
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
    color: '#94A3B8',
  },
  recentMood: {
    fontSize: 16,
  },
  recentContent: {
    fontSize: 14,
    color: '#F8FAFC',
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: '#3B82F6' + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#3B82F6' + '30',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: '#F8FAFC',
    lineHeight: 20,
  },
});