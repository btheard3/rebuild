import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { analyticsService } from '@/services/analyticsService';
import { openaiService } from '@/services/openaiService';
import { tavusService } from '@/services/tavusService';
import { supabase } from '@/services/supabaseClient';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Sparkles,
  Heart,
  Video as VideoIcon,
  Pencil,
  Play,
  Pause,
  RotateCcw,
  Share2,
  Download,
  TriangleAlert as AlertTriangle,
  Clock,
  Save,
} from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';

type MoodType = 'supportive' | 'hopeful' | 'encouraging' | 'empathetic' | 'motivational';

interface VideoCheckInState {
  journalEntry: string;
  selectedMood: MoodType;
  script: string;
  videoUrl: string | null;
  isGeneratingScript: boolean;
  isGeneratingVideo: boolean;
  isPlaying: boolean;
  step: 'input' | 'script' | 'video';
  videoHistory: VideoHistoryItem[];
  isLoadingHistory: boolean;
}

interface VideoHistoryItem {
  id: string;
  video_id: string;
  script: string;
  mood: string;
  video_url: string;
  created_at: string;
  thumbnail?: string;
}

export default function VideoCheckinScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { deviceType } = useResponsive();
  const videoRef = useRef<Video>(null);
  const [state, setState] = useState<VideoCheckInState>({
    journalEntry: '',
    selectedMood: 'supportive',
    script: '',
    videoUrl: null,
    isGeneratingScript: false,
    isGeneratingVideo: false,
    isPlaying: false,
    step: 'input',
    videoHistory: [],
    isLoadingHistory: false,
  });

  const moods: { id: MoodType; label: string; description: string; color: string }[] = [
    {
      id: 'supportive',
      label: 'Supportive',
      description: 'Gentle encouragement and understanding',
      color: colors.primary,
    },
    {
      id: 'hopeful',
      label: 'Hopeful',
      description: 'Optimistic outlook for the future',
      color: colors.success,
    },
    {
      id: 'encouraging',
      label: 'Encouraging',
      description: 'Motivating and uplifting',
      color: colors.warning,
    },
    {
      id: 'empathetic',
      label: 'Empathetic',
      description: 'Understanding and compassionate',
      color: colors.accent,
    },
    {
      id: 'motivational',
      label: 'Motivational',
      description: 'Energetic and action-oriented',
      color: colors.error,
    },
  ];

  useEffect(() => {
    analyticsService.trackScreen('video_checkin');
    loadVideoHistory();
  }, []);

  const loadVideoHistory = async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoadingHistory: true }));

    try {
      const { data, error } = await supabase
        .from('ai_video_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Failed to load video history:', error);
      } else if (data) {
        setState(prev => ({
          ...prev,
          videoHistory: data as VideoHistoryItem[],
        }));
      }
    } catch (error) {
      console.error('Error loading video history:', error);
    } finally {
      setState(prev => ({ ...prev, isLoadingHistory: false }));
    }
  };

  const generateScript = async () => {
    if (!state.journalEntry.trim()) {
      Alert.alert(
        'Please enter your thoughts',
        "Share what's on your mind to generate a personalized video message."
      );
      return;
    }

    setState(prev => ({ ...prev, isGeneratingScript: true }));
    analyticsService.trackEvent('ai_script_generation_started', {
      mood: state.selectedMood,
      entry_length: state.journalEntry.length,
    });

    try {
      const generatedScript = await openaiService.generateScript(
        state.journalEntry,
        state.selectedMood
      );
      
      setState(prev => ({
        ...prev,
        script: generatedScript,
        step: 'script',
        isGeneratingScript: false,
      }));

      analyticsService.trackEvent('ai_script_generated', {
        mood: state.selectedMood,
        script_length: generatedScript.length,
      });
    } catch (error) {
      console.error('Script generation failed:', error);
      Alert.alert('Error', 'Failed to generate script. Please try again.');
      setState(prev => ({ ...prev, isGeneratingScript: false }));
    }
  };

  const generateVideo = async () => {
    if (!state.script || !user) return;

    // Check if we're on web platform
    if (Platform.OS === 'web') {
      Alert.alert(
        'Video Generation Not Supported on Web',
        'AI Video Check-in requires a mobile device. Please use the Expo Go app on your phone or tablet to experience the full video features.',
        [{ text: 'OK' }]
      );
      return;
    }

    setState(prev => ({ ...prev, isGeneratingVideo: true }));
    analyticsService.trackEvent('ai_video_generation_started', {
      mood: state.selectedMood,
      script_length: state.script.length,
    });

    try {
      // Generate a unique video ID
      const videoId = `video_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Save initial record to Supabase
      await supabase.from('ai_video_checkins').insert([
        {
          user_id: user.id,
          video_id: videoId,
          script: state.script,
          mood: state.selectedMood,
          status: 'generating',
          journal_entry: state.journalEntry,
        },
      ]);

      // Generate video with Tavus
      const videoUrl = await tavusService.generateVideo(
        state.script,
        state.selectedMood,
        {
          userName: user.name,
          // Add more personalization options here
        }
      );

      if (!videoUrl) throw new Error('No video URL returned');

      // Update record in Supabase with video URL
      await supabase
        .from('ai_video_checkins')
        .update({
          video_url: videoUrl,
          status: 'completed',
        })
        .eq('video_id', videoId);

      setState(prev => ({
        ...prev,
        videoUrl,
        step: 'video',
        isGeneratingVideo: false,
      }));

      // Refresh video history
      loadVideoHistory();

      analyticsService.trackEvent('ai_video_generated', {
        mood: state.selectedMood,
        video_id: videoId,
      });
    } catch (error) {
      console.error('Video generation failed:', error);
      Alert.alert('Error', 'Failed to generate video. Please try again.');
      setState(prev => ({ ...prev, isGeneratingVideo: false }));
    }
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;

    if (state.isPlaying) {
      await videoRef.current.pauseAsync();
      setState(prev => ({ ...prev, isPlaying: false }));
    } else {
      await videoRef.current.playAsync();
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  };

  const handleReplay = async () => {
    if (!videoRef.current) return;

    await videoRef.current.replayAsync();
    setState(prev => ({ ...prev, isPlaying: true }));
  };

  const handleVideoFinish = () => {
    setState(prev => ({ ...prev, isPlaying: false }));
  };

  const handleShare = () => {
    Alert.alert(
      'Share Video',
      'This would share your personalized video with others.',
      [{ text: 'OK' }]
    );
    analyticsService.trackEvent('video_share_attempted');
  };

  const handleSaveToGallery = () => {
    Alert.alert(
      'Save to Gallery',
      'This would save your personalized video to your device gallery.',
      [{ text: 'OK' }]
    );
    analyticsService.trackEvent('video_save_attempted');
  };

  const resetFlow = () => {
    setState(prev => ({
      ...prev,
      journalEntry: '',
      script: '',
      videoUrl: null,
      step: 'input',
      isPlaying: false,
    }));
  };

  const playHistoryVideo = (videoUrl: string) => {
    setState(prev => ({
      ...prev,
      videoUrl,
      step: 'video',
      isPlaying: false,
    }));
  };

  const renderMoodSelector = () => (
    <View style={styles.moodSection}>
      <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter-SemiBold' }]}>
        What tone would you like for your video?
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moodScrollContent}
      >
        {moods.map((mood) => (
          <TouchableOpacity
            key={mood.id}
            style={[
              styles.moodButton,
              {
                backgroundColor:
                  state.selectedMood === mood.id ? mood.color + '20' : colors.surface,
                borderColor:
                  state.selectedMood === mood.id ? mood.color : colors.border,
              },
            ]}
            onPress={() => setState(prev => ({ ...prev, selectedMood: mood.id }))}
          >
            <Text style={[
              styles.moodLabel,
              { 
                color: state.selectedMood === mood.id ? mood.color : colors.text,
                fontFamily: 'Inter-Medium'
              },
            ]}>
              {mood.label}
            </Text>
            <Text style={[
              styles.moodDescription,
              { 
                color: state.selectedMood === mood.id ? mood.color : colors.textSecondary,
                fontFamily: 'Inter-Regular'
              },
            ]}>
              {mood.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderInputStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <Sparkles size={32} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter-Bold' }]}>
          AI Video Check-in
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
          Share your thoughts and get a personalized video message
        </Text>
      </View>

      {Platform.OS === 'web' && (
        <View style={[styles.warningCard, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
          <AlertTriangle size={20} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.warning, fontFamily: 'Inter-Medium' }]}>
            Video features work best on mobile devices. Use Expo Go on your phone for the full experience.
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
          value={state.journalEntry}
          onChangeText={(text) => setState(prev => ({ ...prev, journalEntry: text }))}
          textAlignVertical="top"
        />
      </View>

      {state.videoHistory.length > 0 && (
        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter-SemiBold' }]}>
            Recent Videos
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.historyScrollContent}
          >
            {state.videoHistory.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => playHistoryVideo(item.video_url)}
              >
                <View style={styles.historyThumbnail}>
                  {item.thumbnail ? (
                    <Image source={{ uri: item.thumbnail }} style={styles.thumbnailImage} />
                  ) : (
                    <VideoIcon size={24} color={colors.primary} />
                  )}
                </View>
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyDate, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.historyMood, { color: colors.primary, fontFamily: 'Inter-Medium' }]}>
                    {item.mood.charAt(0).toUpperCase() + item.mood.slice(1)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          {
            backgroundColor: state.journalEntry.trim()
              ? colors.primary
              : colors.disabled,
            opacity: state.isGeneratingScript ? 0.7 : 1,
          },
        ]}
        onPress={generateScript}
        disabled={!state.journalEntry.trim() || state.isGeneratingScript}
      >
        {state.isGeneratingScript ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Sparkles size={20} color="white" />
            <Text style={[styles.buttonText, { fontFamily: 'Inter-SemiBold' }]}>Generate Personalized Video</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderScriptStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <Pencil size={32} color={colors.success} />
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter-Bold' }]}>
          Your Video Script
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
          AI-generated script based on your thoughts
        </Text>
      </View>

      <View
        style={[
          styles.scriptContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.scriptText, { color: colors.text, fontFamily: 'Inter-Regular' }]}>
          {state.script}
        </Text>
      </View>

      {Platform.OS === 'web' && (
        <View style={[styles.warningCard, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
          <AlertTriangle size={20} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.warning, fontFamily: 'Inter-Medium' }]}>
            Video generation requires a mobile device. Please use Expo Go on your phone for video features.
          </Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={() => setState(prev => ({ ...prev, step: 'input' }))}
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
              opacity: state.isGeneratingVideo ? 0.7 : 1,
              flex: 1,
            },
          ]}
          onPress={generateVideo}
          disabled={state.isGeneratingVideo || Platform.OS === 'web'}
        >
          {state.isGeneratingVideo ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <VideoIcon size={20} color="white" />
              <Text style={[styles.buttonText, { fontFamily: 'Inter-SemiBold' }]}>Generate AI Video</Text>
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
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter-Bold' }]}>
          Your AI Video Message
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
          Personalized video message just for you
        </Text>
      </View>

      {state.videoUrl && (
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            style={styles.video}
            source={{ uri: state.videoUrl }}
            useNativeControls={false}
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded && status.didJustFinish) {
                handleVideoFinish();
              }
            }}
          />
          
          <View style={styles.videoControls}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.primary }]}
              onPress={handlePlayPause}
            >
              {state.isPlaying ? (
                <Pause size={24} color="white" />
              ) : (
                <Play size={24} color="white" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleReplay}
            >
              <RotateCcw size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.videoActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
              onPress={handleShare}
            >
              <Share2 size={20} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary, fontFamily: 'Inter-Medium' }]}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
              onPress={handleSaveToGallery}
            >
              <Save size={20} color={colors.success} />
              <Text style={[styles.actionButtonText, { color: colors.success, fontFamily: 'Inter-Medium' }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[styles.scriptPreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.scriptPreviewTitle, { color: colors.text, fontFamily: 'Inter-SemiBold' }]}>Video Script</Text>
        <Text style={[styles.scriptPreviewText, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
          {state.script}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: colors.border }]}
        onPress={resetFlow}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.text, fontFamily: 'Inter-Medium' }]}>
          Create Another Video
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
          AI Video Check-in
        </Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {state.step === 'input' && renderInputStep()}
        {state.step === 'script' && renderScriptStep()}
        {state.step === 'video' && renderVideoStep()}
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
    marginBottom: 24,
  },
  moodScrollContent: {
    paddingVertical: 8,
    paddingRight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  moodButton: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginRight: 12,
    minWidth: 150,
  },
  moodLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  moodDescription: {
    fontSize: 12,
  },
  inputSection: {
    marginBottom: 24,
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
  videoContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  videoActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
  },
  scriptPreview: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  scriptPreviewTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  scriptPreviewText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  historySection: {
    marginBottom: 24,
  },
  historyScrollContent: {
    paddingVertical: 8,
  },
  historyItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginRight: 12,
    width: 120,
  },
  historyThumbnail: {
    width: '100%',
    height: 70,
    borderRadius: 8,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  historyInfo: {
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  historyMood: {
    fontSize: 12,
    fontWeight: '600',
  },
});