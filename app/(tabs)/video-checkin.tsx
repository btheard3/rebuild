// Fully functional and type-safe video-checkin.tsx with Tavus integration + TypeScript fixes
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatusSuccess } from 'expo-av';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Heart,
  Video as VideoIcon,
} from 'lucide-react-native';
import { tavusService } from '@/services/tavusService';
import { openaiService } from '@/services/openaiService';
import { supabaseService } from '@/services/supabaseService';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { analyticsService } from '@/services/analyticsService';
import BoltBadge from '@/components/BoltBadge';

type MoodType = 'great' | 'good' | 'okay' | 'sad' | 'stressed' | 'anxious';

export default function VideoCheckinScreen() {
  const videoRef = useRef<Video>(null);
  const { user } = useAuth();
  const { colors } = useTheme();

  const [journalEntry, setJournalEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [script, setScript] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState<'input' | 'script' | 'video'>('input');

  const moods: { id: MoodType; emoji: string; label: string; color: string }[] =
    [
      { id: 'great', emoji: '😊', label: 'Great', color: '#10B981' },
      { id: 'good', emoji: '🙂', label: 'Good', color: '#3B82F6' },
      { id: 'okay', emoji: '😐', label: 'Okay', color: '#F59E0B' },
      { id: 'sad', emoji: '😔', label: 'Sad', color: '#8B5CF6' },
      { id: 'stressed', emoji: '😰', label: 'Stressed', color: '#EF4444' },
      { id: 'anxious', emoji: '😟', label: 'Anxious', color: '#F97316' },
    ];

  const generateScript = async () => {
    if (!journalEntry.trim()) {
      Alert.alert(
        'Please enter your thoughts',
        "Share what's on your mind to generate a personalized video."
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

  const generateVideo = async () => {
    if (!script) return;

    setIsGenerating(true);
    analyticsService.trackEvent('ai_video_generation_started', {
      mood: selectedMood,
      script_length: script.length,
    });

    try {
      const result = await tavusService.generateVideo(script, user?.id);

      if (!result.videoUrl) throw new Error('No video URL returned');

      setVideoUrl(result.videoUrl);
      setStep('video');

      // Save video log to Supabase
      if (user) {
        await supabaseService.saveVideoLog({
          userId: user.id,
          videoUrl: result.videoUrl,
          script,
          mood: selectedMood || undefined,
          journalEntry,
        });
      }

      analyticsService.trackEvent('ai_video_generated', {
        mood: selectedMood,
        video_url: result.videoUrl,
      });
    } catch (error) {
      console.error('Video generation failed:', error);
      Alert.alert('Error', 'Failed to generate video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = async () => {
    if (videoRef.current) {
      const status = await videoRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      const loadedStatus = status as AVPlaybackStatusSuccess;

      if (loadedStatus.isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const resetFlow = () => {
    setJournalEntry('');
    setSelectedMood(null);
    setScript('');
    setVideoUrl(null);
    setStep('input');
    setIsPlaying(false);
  };

  const renderMoodSelector = () => (
    <View style={styles.moodSection}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
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
                { color: selectedMood === mood.id ? mood.color : colors.text },
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
        <Text style={[styles.title, { color: colors.text }]}>
          AI Video Check-in
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Share your thoughts and get a personalized video message
        </Text>
      </View>

      {renderMoodSelector()}

      <View style={styles.inputSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          What's on your mind?
        </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border,
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
            <Text style={styles.buttonText}>Generate Personalized Script</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderScriptStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <Heart size={32} color={colors.success} />
        <Text style={[styles.title, { color: colors.text }]}>
          Your Personalized Script
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          AI-generated based on your thoughts and mood
        </Text>
      </View>

      <View
        style={[
          styles.scriptContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.scriptText, { color: colors.text }]}>
          {script}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={() => setStep('input')}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
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
          onPress={generateVideo}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <VideoIcon size={20} color="white" />
              <Text style={styles.buttonText}>Generate AI Video</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVideoStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <VideoIcon size={32} color={colors.accent} />
        <Text style={[styles.title, { color: colors.text }]}>
          Your AI Video
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Personalized message just for you
        </Text>
      </View>

      {videoUrl && (
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={styles.video}
            useNativeControls={false}
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay={false}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded) {
                setIsPlaying(status.isPlaying);
              }
            }}
          />
          <View style={styles.videoControls}>
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
              onPress={() => videoRef.current?.replayAsync()}
            >
              <RotateCcw size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: colors.border }]}
        onPress={resetFlow}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
          Create Another Video
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'input' && renderInputStep()}
        {step === 'script' && renderScriptStep()}
        {step === 'video' && renderVideoStep()}
      </ScrollView>
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
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  moodSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
  videoContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
