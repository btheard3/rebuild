import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Sparkles,
  Heart,
  Volume2,
  TriangleAlert as AlertTriangle,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react-native';
import { openaiService } from '@/services/openaiService';
import { elevenLabsService } from '@/services/elevenLabsService';
import { supabaseService } from '@/services/supabaseService';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { analyticsService } from '@/services/analyticsService';
import BoltBadge from '@/components/BoltBadge';
import { router } from 'expo-router';

type MoodType = 'great' | 'good' | 'okay' | 'sad' | 'stressed' | 'anxious';

export default function VoiceCheckinScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [journalEntry, setJournalEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [script, setScript] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState<'input' | 'script' | 'audio'>('input');

  const moods: { id: MoodType; emoji: string; label: string; color: string }[] =
    [
      { id: 'great', emoji: '😊', label: 'Great', color: '#10B981' },
      { id: 'good', emoji: '🙂', label: 'Good', color: '#3B82F6' },
      { id: 'okay', emoji: '😐', label: 'Okay', color: '#F59E0B' },
      { id: 'sad', emoji: '😔', label: 'Sad', color: '#8B5CF6' },
      { id: 'stressed', emoji: '😰', label: 'Stressed', color: '#EF4444' },
      { id: 'anxious', emoji: '😟', label: 'Anxious', color: '#F97316' },
    ];

  useEffect(() => {
    analyticsService.trackScreen('voice_checkin');
  }, []);

  const generateScript = async () => {
    if (!journalEntry.trim()) {
      Alert.alert(
        'Please enter your thoughts',
        "Share what's on your mind to generate a personalized voice message."
      );
      return;
    }

    setIsGenerating(true);
    analyticsService.trackEvent('ai_script_generation_started', {
      mood: selectedMood,
      entry_length: journalEntry.length,
    });

    try {
      const generatedScript = await openaiService.generateScript(
        journalEntry,
        selectedMood || undefined
      );
      setScript(generatedScript);
      setStep('script');

      // Save wellness entry
      if (user) {
        await supabaseService.saveWellnessEntry({
          userId: user.id,
          entryType: 'journal',
          mood: selectedMood || undefined,
          content: journalEntry,
        });
      }

      analyticsService.trackEvent('ai_script_generated', {
        mood: selectedMood,
        script_length: generatedScript.length,
      });
    } catch (error) {
      console.error('Script generation failed:', error);
      Alert.alert('Error', 'Failed to generate script. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAudio = async () => {
    if (!script) return;

    // Check if we're on web platform
    if (Platform.OS === 'web') {
      Alert.alert(
        'Audio Not Supported on Web',
        'AI Voice Check-in requires a mobile device. Please use the Expo Go app on your phone or tablet to experience the full audio features.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsGenerating(true);
    analyticsService.trackEvent('ai_audio_generation_started', {
      mood: selectedMood,
      script_length: script.length,
    });

    try {
      const result = await elevenLabsService.generateSpeech(script);

      if (!result) throw new Error('No audio URL returned');

      setAudioUrl(result);
      setStep('audio');

      // Save voice interaction log to Supabase
      if (user) {
        await supabaseService.saveVoiceInteraction({
          userId: user.id,
          script,
          mood: selectedMood || undefined,
          audioUrl: result,
          journalEntry,
        });
      }

      analyticsService.trackEvent('ai_audio_generated', {
        mood: selectedMood,
        audio_url: result,
      });

      // Auto-play the generated audio
      setTimeout(() => {
        handlePlayPause();
      }, 500);

    } catch (error) {
      console.error('Audio generation failed:', error);
      Alert.alert('Error', 'Failed to generate audio. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Audio Playback Not Available',
        'Audio playback is only available on mobile devices. Please use the Expo Go app on your phone.'
      );
      return;
    }

    if (audioUrl) {
      if (isPlaying) {
        setIsPlaying(false);
        // Note: ElevenLabs service doesn't have pause functionality in current implementation
        // This would need to be enhanced for full play/pause control
      } else {
        setIsPlaying(true);
        try {
          await elevenLabsService.playAudio(audioUrl);
          setIsPlaying(false);
        } catch (error) {
          console.error('Audio playback failed:', error);
          setIsPlaying(false);
          Alert.alert('Playback Error', 'Unable to play audio. Please try again.');
        }
      }
    }
  };

  const resetFlow = () => {
    setJournalEntry('');
    setSelectedMood(null);
    setScript('');
    setAudioUrl(null);
    setStep('input');
    setIsPlaying(false);
  };

  const renderMoodSelector = () => (
    <View style={styles.moodSection}>
      <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter-SemiBold' }]}>
        How are you feeling today?
      </Text>
      <View style={styles.moodGrid}>
        {moods.map((mood) => (
          <TouchableOpacity
            key={mood.id}
            style={[
              styles.moodButton,
              {
                backgroundColor:
                  selectedMood === mood.id ? mood.color + '20' : colors.surface,
                borderColor:
                  selectedMood === mood.id ? mood.color : colors.border,
              },
            ]}
            onPress={() => setSelectedMood(mood.id)}
          >
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text
              style={[
                styles.moodLabel,
                { 
                  color: selectedMood === mood.id ? mood.color : colors.text,
                  fontFamily: 'Inter-Medium'
                },
              ]}
            >
              {mood.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderInputStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <Sparkles size={32} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter-Bold' }]}>
          AI Voice Check-in
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
          Share your thoughts and get a personalized voice message
        </Text>
      </View>

      {Platform.OS === 'web' && (
        <View style={[styles.warningCard, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
          <AlertTriangle size={20} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.warning, fontFamily: 'Inter-Medium' }]}>
            Audio features work best on mobile devices. Use Expo Go on your phone for the full experience.
          </Text>
        </View>
      )}

      {renderMoodSelector()}

      <View style={styles.inputSection}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter-SemiBold' }]}>
          What's on your mind?
        </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border,
              fontFamily: 'Inter-Regular'
            },
          ]}
          placeholder="Share your thoughts, feelings, or what happened today..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={6}
          value={journalEntry}
          onChangeText={setJournalEntry}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          {
            backgroundColor: journalEntry.trim()
              ? colors.primary
              : colors.disabled,
            opacity: isGenerating ? 0.7 : 1,
          },
        ]}
        onPress={generateScript}
        disabled={!journalEntry.trim() || isGenerating}
      >
        {isGenerating ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Sparkles size={20} color="white" />
            <Text style={[styles.buttonText, { fontFamily: 'Inter-SemiBold' }]}>Generate Personalized Script</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderScriptStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <Heart size={32} color={colors.success} />
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter-Bold' }]}>
          Your Personalized Script
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
          AI-generated based on your thoughts and mood
        </Text>
      </View>

      <View
        style={[
          styles.scriptContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.scriptText, { color: colors.text, fontFamily: 'Inter-Regular' }]}>
          {script}
        </Text>
      </View>

      {Platform.OS === 'web' && (
        <View style={[styles.warningCard, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
          <AlertTriangle size={20} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.warning, fontFamily: 'Inter-Medium' }]}>
            Voice generation requires a mobile device. Please use Expo Go on your phone for audio features.
          </Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={() => setStep('input')}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text, fontFamily: 'Inter-Medium' }]}>
            Edit Input
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              backgroundColor: colors.primary,
              opacity: isGenerating ? 0.7 : 1,
              flex: 1,
            },
          ]}
          onPress={generateAudio}
          disabled={isGenerating || Platform.OS === 'web'}
        >
          {isGenerating ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Volume2 size={20} color="white" />
              <Text style={[styles.buttonText, { fontFamily: 'Inter-SemiBold' }]}>Generate AI Voice Message</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAudioStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <Volume2 size={32} color={colors.accent} />
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter-Bold' }]}>
          Your AI Voice Message
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
          Personalized voice message just for you
        </Text>
      </View>

      {audioUrl && (
        <View style={styles.audioContainer}>
          <View style={[styles.audioPlayer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.audioTitle, { color: colors.text, fontFamily: 'Inter-SemiBold' }]}>
              Your Personalized Voice Message
            </Text>
            <Text style={[styles.audioDescription, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
              {isPlaying ? 'Now playing your AI-generated voice message...' : 'Your message is ready to play'}
            </Text>
            
            <View style={styles.audioControls}>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause size={24} color="white" />
                ) : (
                  <Play size={24} color="white" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => audioUrl && elevenLabsService.playAudio(audioUrl)}
              >
                <RotateCcw size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: colors.border }]}
        onPress={resetFlow}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.text, fontFamily: 'Inter-Medium' }]}>
          Create Another Voice Message
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter-Bold' }]}>
          AI Voice Check-in
        </Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'input' && renderInputStep()}
        {step === 'script' && renderScriptStep()}
        {step === 'audio' && renderAudioStep()}
      </ScrollView>
      <BoltBadge />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
  },
  placeholderButton: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  stepContainer: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  moodSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
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
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 32,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    lineHeight: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  scriptContainer: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  scriptText: {
    fontSize: 16,
    lineHeight: 24,
  },
  audioContainer: {
    marginBottom: 24,
  },
  audioPlayer: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  audioTitle: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  audioDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  audioControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});