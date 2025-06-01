import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Clock, VolumeX, Volume2, Pencil, BarChart } from 'lucide-react-native';

export default function WellnessScreen() {
  const { colors } = useTheme();
  const [meditationTime, setMeditationTime] = useState(5);
  const [isMeditating, setIsMeditating] = useState(false);
  const [countdownValue, setCountdownValue] = useState(5 * 60);
  const [soundEnabled, setSoundEnabled] = useState(true);

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

  const renderMoodOption = (option: { id: string; label: string; emoji: string }) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.moodOption, { borderColor: colors.border }]}
      onPress={() => console.log(`Mood selected: ${option.label}`)}
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
        { backgroundColor: colors.surface, borderColor: colors.border }
      ]}
      onPress={() => console.log(`Navigate to ${tool.route}`)}
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How are you feeling?</Text>
          <View style={styles.moodContainer}>
            {moodOptions.map(renderMoodOption)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Wellness Tools</Text>
          <View style={styles.toolsContainer}>
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
                onPress={() => setIsMeditating(false)}
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
                onPress={() => setIsMeditating(true)}
              >
                <Text style={styles.meditationButtonText}>Start Meditation</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.journalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.journalHeader}>
            <Text style={[styles.journalTitle, { color: colors.text }]}>Daily Journal</Text>
            <Pencil size={20} color={colors.success} />
          </View>
          
          <TextInput
            style={[styles.journalInput, { color: colors.text, borderColor: colors.border }]}
            placeholder="Write your thoughts for today..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
          
          <TouchableOpacity 
            style={[styles.journalButton, { backgroundColor: colors.success }]}
            onPress={() => console.log('Save journal entry')}
          >
            <Text style={styles.journalButtonText}>Save Entry</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Affirmation</Text>
          <View style={[styles.affirmationCard, { backgroundColor: colors.primaryLight }]}>
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/3560044/pexels-photo-3560044.jpeg' }}
              style={styles.affirmationImage}
            />
            <View style={styles.affirmationOverlay} />
            <Text style={styles.affirmationText}>
              "You are resilient and capable of overcoming any challenge that comes your way."
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
  },
  moodOption: {
    alignItems: 'center',
    width: '18%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  toolsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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