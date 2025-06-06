import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { useResponsive, getResponsiveValue } from '@/hooks/useResponsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyticsService } from '@/services/analyticsService';
import { elevenLabsService } from '@/services/elevenLabsService';
import { BookOpen, Clock, VolumeX, Volume2, Pencil, ChartBar as BarChart, Crown, Lock } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';
import PaywallScreen from '@/components/PaywallScreen';

export default function WellnessScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { addPoints, completeAchievement } = useGamification();
  const { deviceType } = useResponsive();
  const [meditationTime, setMeditationTime] = useState(5);
  const [isMeditating, setIsMeditating] = useState(false);
  const [countdownValue, setCountdownValue] = useState(5 * 60);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [journalEntry, setJournalEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const getPadding = getResponsiveValue(16, 24, 32);
  const getMaxWidth = getResponsiveValue('100%', 600, 800);
  const getToolCardWidth = getResponsiveValue('100%', '48%', '32%');
  
  const padding = getPadding(deviceType);
  const maxWidth = getMaxWidth(deviceType);
  const toolCardWidth = getToolCardWidth(deviceType);

  useEffect(() => {
    analyticsService.trackScreen('wellness');
  }, []);

  const moodOptions = [
    { id: 'great', label: 'Great', emoji: '😁' },
    { id: 'good', label: 'Good', emoji: '🙂' },
    { id: 'okay', label: 'Okay', emoji: '😐' },
    { id: 'sad', label: 'Sad', emoji: '😔' },
    { id: 'stressed', label: 'Stressed', emoji: '😫' },
  ];

  const wellnessTools = [
    {
      id: '1',
      title: 'Journal',
      description: 'Record your thoughts and feelings',
      icon: BookOpen,
      route: '/wellness/journal',
      color: colors.success,
    },
    {
      id: '2',
      title: 'Meditation',
      description: 'Guided sessions for stress relief',
      icon: Clock,
      route: '/wellness/meditation',
      color: colors.accent,
    },
    {
      id: '3',
      title: 'Mood Tracking',
      description: 'Monitor your emotional wellbeing',
      icon: BarChart,
      route: '/wellness/mood-tracking',
      color: colors.secondary,
    },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleMoodSelection = (moodId: string) => {
    setSelectedMood(moodId);
    analyticsService.trackEvent('mood_selected', { mood: moodId });
    addPoints(5, 'Mood check-in');
  };

  const handleJournalSave = async () => {
    if (!journalEntry.trim()) return;

    analyticsService.trackEvent('journal_entry_saved', { 
      entry_length: journalEntry.length,
      mood: selectedMood 
    });
    
    addPoints(25, 'Journal entry saved');
    
    // Check for first journal achievement
    setTimeout(() => completeAchievement('first_journal'), 100);

    // Generate empathetic response based on mood and content
    if (selectedMood && user?.isPremium) {
      await generateEmpathicResponse();
    }

    Alert.alert('Journal Saved', 'Your thoughts have been recorded securely.');
    setJournalEntry('');
  };

  const generateEmpathicResponse = async () => {
    if (!selectedMood) return;

    setIsPlayingAudio(true);
    analyticsService.trackEvent('empathic_audio_generated', { mood: selectedMood });

    try {
      const affirmation = elevenLabsService.getAffirmationForMood(selectedMood);
      await elevenLabsService.generateAndPlaySpeech(affirmation);
      addPoints(10, 'Listened to AI affirmation');
    } catch (error) {
      console.error('Failed to generate empathic response:', error);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleReadJournalAloud = async () => {
    if (!journalEntry.trim()) {
      Alert.alert('No Content', 'Please write something in your journal first.');
      return;
    }

    if (!user?.isPremium) {
      setShowPaywall(true);
      analyticsService.trackEvent('wellness_paywall_shown', { feature: 'read_aloud' });
      return;
    }

    setIsPlayingAudio(true);
    analyticsService.trackEvent('journal_read_aloud', { entry_length: journalEntry.length });

    try {
      await elevenLabsService.generateAndPlaySpeech(journalEntry);
    } catch (error) {
      console.error('Failed to read journal aloud:', error);
      Alert.alert('Error', 'Could not read your journal entry aloud. Please try again.');
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleListenToAffirmation = async () => {
    if (!user?.isPremium) {
      setShowPaywall(true);
      analyticsService.trackEvent('wellness_paywall_shown', { feature: 'affirmation' });
      return;
    }

    const mood = selectedMood || 'default';
    setIsPlayingAudio(true);
    analyticsService.trackEvent('affirmation_played', { mood });

    try {
      const affirmation = elevenLabsService.getAffirmationForMood(mood);
      await elevenLabsService.generateAndPlaySpeech(affirmation);
      addPoints(15, 'Listened to daily affirmation');
    } catch (error) {
      console.error('Failed to play affirmation:', error);
      Alert.alert('Error', 'Could not play affirmation. Please try again.');
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const renderMoodOption = (option: { id: string; label: string; emoji: string }) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.moodOption, 
        { 
          borderColor: selectedMood === option.id ? colors.primary : colors.border,
          backgroundColor: selectedMood === option.id ? colors.primaryLight : colors.surface,
        }
      ]}
      onPress={() => handleMoodSelection(option.id)}
    >
      <Text style={styles.moodEmoji}>{option.emoji}</Text>
      <Text style={[styles.moodLabel, { color: colors.text }]}>{option.label}</Text>
    </TouchableOpacity>
  );

  const renderWellnessTool = (tool: typeof wellnessTools[0]) => (
    <TouchableOpacity
      key={tool.id}
      style={[
        styles.toolCard,
        { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
          width: toolCardWidth,
          marginBottom: deviceType === 'mobile' ? 12 : 16,
        }
      ]}
      onPress={() => {
        analyticsService.trackUserAction('wellness_tool_accessed', 'wellness', {
          tool: tool.title
        });
        console.log(`Navigate to ${tool.route}`);
      }}
    >
      <View style={[styles.toolIconContainer, { backgroundColor: tool.color + '20' }]}>
        <tool.icon size={24} color={tool.color} />
      </View>
      <Text style={[styles.toolTitle, { color: colors.text }]}>{tool.title}</Text>
      <Text style={[styles.toolDescription, { color: colors.textSecondary }]}>
        {tool.description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { padding, maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How are you feeling?</Text>
          <View style={[
            styles.moodContainer,
            deviceType === 'desktop' ? styles.moodContainerDesktop : null
          ]}>
            {moodOptions.map(renderMoodOption)}
          </View>
          
          {selectedMood && (
            <View style={styles.affirmationSection}>
              <TouchableOpacity
                style={[
                  styles.affirmationButton,
                  { 
                    backgroundColor: user?.isPremium ? colors.accent : colors.disabled,
                  }
                ]}
                onPress={handleListenToAffirmation}
                disabled={isPlayingAudio}
              >
                {!user?.isPremium && <Crown size={16} color="white" />}
                <Text style={[styles.affirmationButtonText, { marginLeft: !user?.isPremium ? 8 : 0 }]}>
                  {isPlayingAudio ? 'Playing...' : 'Listen to Affirmation'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Wellness Tools</Text>
          <View style={[
            styles.toolsContainer,
            deviceType !== 'mobile' ? styles.gridContainer : null
          ]}>
            {wellnessTools.map(renderWellnessTool)}
          </View>
        </View>

        <View style={[styles.meditationCard, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]}>
          <View style={styles.meditationHeader}>
            <Text style={[styles.meditationTitle, { color: colors.text }]}>Meditation Timer</Text>
            <TouchableOpacity onPress={() => setSoundEnabled(!soundEnabled)}>
              {soundEnabled ? (
                <Volume2 size={20} color={colors.accent} />
              ) : (
                <VolumeX size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          {isMeditating ? (
            <View style={styles.meditationTimerContainer}>
              <Text style={[styles.countdownText, { color: colors.accent }]}>
                {formatTime(countdownValue)}
              </Text>
              <TouchableOpacity
                style={[styles.meditationButton, { backgroundColor: colors.error }]}
                onPress={() => {
                  setIsMeditating(false);
                  analyticsService.trackEvent('meditation_stopped', { duration: meditationTime * 60 - countdownValue });
                }}
              >
                <Text style={styles.meditationButtonText}>Stop</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.meditationSetupContainer}>
              <Text style={[styles.meditationLabel, { color: colors.text }]}>
                Set meditation duration:
              </Text>
              <View style={styles.timePickerContainer}>
                {[5, 10, 15, 20].map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      { 
                        backgroundColor: meditationTime === time ? colors.accent : 'transparent',
                        borderColor: colors.accent,
                      }
                    ]}
                    onPress={() => {
                      setMeditationTime(time);
                      setCountdownValue(time * 60);
                    }}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        { color: meditationTime === time ? 'white' : colors.accent }
                      ]}
                    >
                      {time} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.meditationButton, { backgroundColor: colors.accent }]}
                onPress={() => {
                  setIsMeditating(true);
                  analyticsService.trackEvent('meditation_started', { duration: meditationTime });
                  addPoints(20, 'Started meditation session');
                }}
              >
                <Text style={styles.meditationButtonText}>Start Meditation</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.journalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.journalHeader}>
            <Text style={[styles.journalTitle, { color: colors.text }]}>Daily Journal</Text>
            <View style={styles.journalActions}>
              {user?.isPremium ? (
                <TouchableOpacity
                  onPress={handleReadJournalAloud}
                  disabled={isPlayingAudio || !journalEntry.trim()}
                  style={[styles.journalActionButton, { opacity: (!journalEntry.trim() || isPlayingAudio) ? 0.5 : 1 }]}
                >
                  <Volume2 size={16} color={colors.primary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowPaywall(true)}
                  style={styles.journalActionButton}
                >
                  <Lock size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              <Pencil size={20} color={colors.success} />
            </View>
          </View>
          
          <TextInput
            style={[styles.journalInput, { color: colors.text, borderColor: colors.border }]}
            placeholder="Write your thoughts for today..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            value={journalEntry}
            onChangeText={setJournalEntry}
          />
          
          <TouchableOpacity 
            style={[
              styles.journalButton, 
              { 
                backgroundColor: journalEntry.trim() ? colors.success : colors.disabled 
              }
            ]}
            onPress={handleJournalSave}
            disabled={!journalEntry.trim()}
          >
            <Text style={styles.journalButtonText}>Save Entry</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Affirmation</Text>
          <View style={[styles.affirmationCard, { backgroundColor: colors.primaryLight }]}>
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/5699398/pexels-photo-5699398.jpeg' }}
              style={styles.affirmationImage}
            />
            <View style={styles.affirmationOverlay} />
            <Text style={styles.affirmationText}>
              "You are resilient and capable of overcoming any challenge that comes your way."
            </Text>
          </View>
        </View>
      </ScrollView>

      <PaywallScreen 
        visible={showPaywall} 
        onClose={() => setShowPaywall(false)} 
      />
      
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  moodContainerDesktop: {
    justifyContent: 'center',
    gap: 16,
  },
  moodOption: {
    alignItems: 'center',
    width: '18%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  affirmationSection: {
    alignItems: 'center',
  },
  affirmationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  affirmationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  toolsContainer: {
    gap: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  toolIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  meditationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  meditationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  meditationTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  meditationTimerContainer: {
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  meditationSetupContainer: {
    alignItems: 'center',
  },
  meditationLabel: {
    fontSize: 16,
    marginBottom: 12,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  timeOptionText: {
    fontWeight: '500',
  },
  meditationButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  meditationButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  journalCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  journalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  journalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  journalActionButton: {
    padding: 4,
  },
  journalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  journalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  journalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  affirmationCard: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  affirmationImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  affirmationOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  affirmationText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 28,
  },
});