import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { useResponsive, getResponsiveValue } from '@/hooks/useResponsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tavusService } from '@/services/tavusService';
import { elevenLabsService } from '@/services/elevenLabsService';
import { analyticsService } from '@/services/analyticsService';
import { Video, ResizeMode } from 'expo-av';
import { Play, Pause, RotateCcw, Crown, Lock, Calendar, MessageCircle, Sparkles, AlertTriangle, Volume2 } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';
import PaywallScreen from '@/components/PaywallScreen';

interface VideoCheckIn {
  id: string;
  videoId: string;
  videoUrl?: string;
  status: 'generating' | 'completed' | 'failed';
  createdAt: Date;
  script: string;
  mood?: string;
  progress?: string[];
  isEmergencyAlert?: boolean;
}

export default function VideoCheckinScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { data: gamificationData, addPoints } = useGamification();
  const { deviceType } = useResponsive();
  
  const [videoCheckIns, setVideoCheckIns] = useState<VideoCheckIn[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoCheckIn | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [videoStatus, setVideoStatus] = useState<any>({});
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  const getPadding = getResponsiveValue(16, 24, 32);
  const getMaxWidth = getResponsiveValue('100%', 600, 800);
  
  const padding = getPadding(deviceType);
  const maxWidth = getMaxWidth(deviceType);

  const moodOptions = [
    { id: 'hopeful', label: 'Hopeful', emoji: '🌟', color: colors.success },
    { id: 'overwhelmed', label: 'Overwhelmed', emoji: '😰', color: colors.warning },
    { id: 'grateful', label: 'Grateful', emoji: '🙏', color: colors.primary },
    { id: 'anxious', label: 'Anxious', emoji: '😟', color: colors.error },
    { id: 'determined', label: 'Determined', emoji: '💪', color: colors.accent },
  ];

  useEffect(() => {
    analyticsService.trackScreen('video_checkin');
    loadVideoHistory();
    checkServiceHealth();
  }, []);

  const checkServiceHealth = async () => {
    try {
      const tavusHealthy = await tavusService.healthCheck();
      if (!tavusHealthy) {
        console.warn('Tavus service health check failed');
      }
    } catch (error) {
      console.warn('Service health check error:', error);
    }
  };

  const loadVideoHistory = async () => {
    // In a real app, this would load from storage or API
    // For now, we'll check if there's a recent video
    const mockHistory: VideoCheckIn[] = [
      {
        id: '1',
        videoId: 'mock_video_1',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        status: 'completed',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        script: 'Welcome back! I can see you\'ve been making great progress...',
        mood: 'hopeful',
        progress: ['Completed recovery wizard', 'Uploaded documents']
      }
    ];
    
    setVideoCheckIns(mockHistory);
    if (mockHistory.length > 0) {
      setCurrentVideo(mockHistory[0]);
    }
  };

  const generatePersonalizedVideo = async () => {
    if (!user?.isPremium) {
      setShowPaywall(true);
      analyticsService.trackEvent('video_checkin_paywall_shown', { reason: 'not_premium' });
      return;
    }

    if (!selectedMood) {
      Alert.alert('Select Your Mood', 'Please select how you\'re feeling today to personalize your video message.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setFallbackMode(false);
    analyticsService.trackEvent('video_checkin_generation_started', { mood: selectedMood });

    try {
      // Generate personalized script based on user data and mood
      const recentProgress = [
        'Completed your recovery assessment',
        'Uploaded important documents',
        'Connected with local resources',
        `Maintained a ${gamificationData.streakDays}-day streak`
      ].filter(Boolean);

      const script = tavusService.generatePersonalizedScript({
        name: user.name?.split(' ')[0],
        disasterType: 'hurricane', // This would come from user's recovery wizard data
        daysSinceDisaster: 7, // This would be calculated from actual disaster date
        immediateNeeds: ['shelter', 'insurance'], // From user's needs assessment
        recentProgress,
        mood: selectedMood,
        currentLevel: gamificationData.level,
        totalPoints: gamificationData.points
      });

      const result = await tavusService.generateVideo(script, user.id);
      
      if (result) {
        const newVideoCheckIn: VideoCheckIn = {
          id: Date.now().toString(),
          videoId: result.videoId,
          status: result.status as any,
          createdAt: new Date(),
          script,
          mood: selectedMood,
          progress: recentProgress
        };

        setVideoCheckIns(prev => [newVideoCheckIn, ...prev]);
        setCurrentVideo(newVideoCheckIn);
        
        // Poll for completion
        pollVideoStatus(result.videoId, newVideoCheckIn.id);
        
        // Award points for using AI video feature
        addPoints(25, 'Generated AI video check-in');
        
        analyticsService.trackEvent('video_checkin_generation_completed', {
          videoId: result.videoId,
          mood: selectedMood
        });
      } else {
        throw new Error('Video generation service returned null result');
      }
    } catch (error) {
      console.error('Failed to generate video:', error);
      setError('Video generation failed. Showing fallback content.');
      setFallbackMode(true);
      
      // Create fallback content
      const fallbackCheckIn: VideoCheckIn = {
        id: Date.now().toString(),
        videoId: 'fallback_' + Date.now(),
        status: 'failed',
        createdAt: new Date(),
        script: `Hello ${user.name?.split(' ')[0]}, I understand you're feeling ${selectedMood} today. While I can't create a video right now, I want you to know that your feelings are valid and you're making progress in your recovery journey.`,
        mood: selectedMood,
        progress: []
      };
      
      setVideoCheckIns(prev => [fallbackCheckIn, ...prev]);
      setCurrentVideo(fallbackCheckIn);
      
      analyticsService.trackError('video_checkin_generation_failed', 'VideoCheckinScreen', {
        error: error.message,
        mood: selectedMood
      });
      
      // Generate audio fallback
      try {
        await elevenLabsService.generateAndPlaySpeech(fallbackCheckIn.script);
      } catch (audioError) {
        console.error('Audio fallback also failed:', audioError);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generateEmergencyAlert = async (alertText: string) => {
    if (!user?.isPremium) {
      setShowPaywall(true);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Generate emergency alert script
      const script = tavusService.generateEmergencyAlertScript({
        alertText,
        severity: 'high',
        location: 'Your Area',
        timestamp: new Date(),
        instructions: [
          'Stay indoors and avoid unnecessary travel',
          'Monitor official emergency channels',
          'Keep emergency supplies ready'
        ]
      });

      // Generate both video and audio for emergency alerts
      const [videoResult, audioUrl] = await Promise.all([
        tavusService.generateVideo(script, user.id),
        elevenLabsService.generateEmergencyAlert(script)
      ]);

      if (videoResult || audioUrl) {
        const emergencyCheckIn: VideoCheckIn = {
          id: Date.now().toString(),
          videoId: videoResult?.videoId || 'emergency_audio_' + Date.now(),
          status: videoResult ? 'generating' : 'completed',
          createdAt: new Date(),
          script,
          isEmergencyAlert: true
        };

        setVideoCheckIns(prev => [emergencyCheckIn, ...prev]);
        setCurrentVideo(emergencyCheckIn);

        // Play audio immediately for emergency alerts
        if (audioUrl) {
          await elevenLabsService.playAudio(audioUrl);
        }

        if (videoResult) {
          pollVideoStatus(videoResult.videoId, emergencyCheckIn.id);
        }

        analyticsService.trackEvent('emergency_alert_generated', {
          videoId: videoResult?.videoId,
          hasAudio: !!audioUrl
        });
      }
    } catch (error) {
      console.error('Emergency alert generation failed:', error);
      setError('Emergency alert generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const pollVideoStatus = async (videoId: string, checkInId: string) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const poll = async () => {
      attempts++;
      
      try {
        const status = await tavusService.getVideoStatus(videoId);
        
        if (status) {
          setVideoCheckIns(prev => prev.map(checkIn => 
            checkIn.id === checkInId 
              ? { ...checkIn, status: status.status as any, videoUrl: status.videoUrl }
              : checkIn
          ));

          if (currentVideo?.id === checkInId) {
            setCurrentVideo(prev => prev ? { ...prev, status: status.status as any, videoUrl: status.videoUrl } : null);
          }
          
          if (status.status === 'completed' && status.videoUrl) {
            analyticsService.trackEvent('video_checkin_ready', { videoId });
            return;
          }
          
          if (status.status === 'failed') {
            setError('Video generation failed. Please try again.');
            setFallbackMode(true);
            analyticsService.trackError('video_checkin_generation_failed', 'VideoCheckinScreen', {
              videoId,
              status: status.status
            });
            return;
          }
        } else {
          throw new Error('Failed to get video status');
        }
      } catch (error) {
        console.error('Video status polling error:', error);
        if (attempts >= maxAttempts) {
          setError('Video generation timed out. Please try again.');
          setFallbackMode(true);
          return;
        }
      }

      if (attempts < maxAttempts && status?.status === 'generating') {
        setTimeout(poll, 10000); // Poll every 10 seconds
      }
    };

    poll();
  };

  const handlePlayPause = () => {
    if (videoStatus.isPlaying) {
      setVideoStatus(prev => ({ ...prev, isPlaying: false }));
      analyticsService.trackEvent('video_checkin_paused');
    } else {
      setVideoStatus(prev => ({ ...prev, isPlaying: true }));
      analyticsService.trackEvent('video_checkin_played');
    }
  };

  const handleRegenerate = () => {
    Alert.alert(
      'Generate New Video',
      'This will create a new personalized video check-in based on your current mood and progress. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Generate', onPress: () => {
          setSelectedMood('');
          setCurrentVideo(null);
          setError(null);
          setFallbackMode(false);
        }}
      ]
    );
  };

  const selectVideoCheckIn = (checkIn: VideoCheckIn) => {
    setCurrentVideo(checkIn);
    setError(null);
    setFallbackMode(checkIn.status === 'failed');
    analyticsService.trackEvent('video_checkin_selected', { 
      videoId: checkIn.videoId,
      age: Date.now() - checkIn.createdAt.getTime()
    });
  };

  const renderMoodSelector = () => (
    <View style={styles.moodSection}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>How are you feeling today?</Text>
      <View style={styles.moodOptions}>
        {moodOptions.map((mood) => (
          <TouchableOpacity
            key={mood.id}
            style={[
              styles.moodOption,
              {
                backgroundColor: selectedMood === mood.id ? mood.color + '20' : colors.surface,
                borderColor: selectedMood === mood.id ? mood.color : colors.border,
              }
            ]}
            onPress={() => setSelectedMood(mood.id)}
          >
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text style={[
              styles.moodLabel,
              { color: selectedMood === mood.id ? mood.color : colors.text }
            ]}>
              {mood.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFallbackContent = () => (
    <View style={[styles.fallbackContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.fallbackIcon, { backgroundColor: colors.warning + '20' }]}>
        <AlertTriangle size={32} color={colors.warning} />
      </View>
      <Text style={[styles.fallbackTitle, { color: colors.text }]}>
        Video Unavailable
      </Text>
      <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>
        {currentVideo?.script || 'We encountered an issue generating your video, but your message is still here for you.'}
      </Text>
      
      <TouchableOpacity
        style={[styles.audioButton, { backgroundColor: colors.primary }]}
        onPress={async () => {
          if (currentVideo?.script) {
            try {
              await elevenLabsService.generateAndPlaySpeech(currentVideo.script);
            } catch (error) {
              console.error('Audio playback failed:', error);
            }
          }
        }}
      >
        <Volume2 size={20} color="white" />
        <Text style={styles.audioButtonText}>Listen to Message</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVideoPlayer = () => {
    if (!currentVideo?.videoUrl) return null;

    return (
      <View style={[styles.videoContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Video
          style={styles.video}
          source={{ uri: currentVideo.videoUrl }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
          onPlaybackStatusUpdate={(status) => setVideoStatus(status)}
        />
        
        <View style={styles.videoOverlay}>
          <View style={styles.videoInfo}>
            <Text style={[styles.videoDate, { color: colors.text }]}>
              {currentVideo.createdAt.toLocaleDateString()}
            </Text>
            {currentVideo.mood && (
              <View style={[styles.moodBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.moodBadgeText, { color: colors.primary }]}>
                  {moodOptions.find(m => m.id === currentVideo.mood)?.emoji} {currentVideo.mood}
                </Text>
              </View>
            )}
            {currentVideo.isEmergencyAlert && (
              <View style={[styles.emergencyBadge, { backgroundColor: colors.error + '20' }]}>
                <AlertTriangle size={12} color={colors.error} />
                <Text style={[styles.emergencyBadgeText, { color: colors.error }]}>
                  Emergency Alert
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderGeneratingState = () => (
    <View style={[styles.generatingContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.sparkleIcon, { backgroundColor: colors.primary + '20' }]}>
        <Sparkles size={32} color={colors.primary} />
      </View>
      <Text style={[styles.generatingTitle, { color: colors.text }]}>
        Creating Your Personal Check-in
      </Text>
      <Text style={[styles.generatingText, { color: colors.textSecondary }]}>
        Our AI is crafting a personalized video message based on your mood and recovery progress. This usually takes 2-3 minutes.
      </Text>
      
      {currentVideo && (
        <View style={[styles.statusContainer, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.statusText, { color: colors.primary }]}>
            Status: {currentVideo.status}
          </Text>
        </View>
      )}

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}
    </View>
  );

  const renderVideoHistory = () => {
    if (videoCheckIns.length === 0) return null;

    return (
      <View style={styles.historySection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Previous Check-ins</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyScroll}>
          {videoCheckIns.map((checkIn) => (
            <TouchableOpacity
              key={checkIn.id}
              style={[
                styles.historyItem,
                {
                  backgroundColor: currentVideo?.id === checkIn.id ? colors.primaryLight : colors.surface,
                  borderColor: currentVideo?.id === checkIn.id ? colors.primary : colors.border,
                }
              ]}
              onPress={() => selectVideoCheckIn(checkIn)}
            >
              <View style={styles.historyItemHeader}>
                <Calendar size={16} color={colors.textSecondary} />
                <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                  {checkIn.createdAt.toLocaleDateString()}
                </Text>
              </View>
              {checkIn.mood && (
                <Text style={[styles.historyMood, { color: colors.text }]}>
                  {moodOptions.find(m => m.id === checkIn.mood)?.emoji} {checkIn.mood}
                </Text>
              )}
              {checkIn.isEmergencyAlert && (
                <View style={[styles.emergencyIndicator, { backgroundColor: colors.error + '20' }]}>
                  <AlertTriangle size={12} color={colors.error} />
                  <Text style={[styles.emergencyIndicatorText, { color: colors.error }]}>
                    Emergency
                  </Text>
                </View>
              )}
              <View style={[
                styles.statusIndicator,
                { backgroundColor: checkIn.status === 'completed' ? colors.success : 
                                 checkIn.status === 'failed' ? colors.error : colors.warning }
              ]}>
                <Text style={styles.statusIndicatorText}>
                  {checkIn.status === 'completed' ? 'Ready' : 
                   checkIn.status === 'failed' ? 'Failed' : 'Processing'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <MessageCircle size={48} color={colors.primary} />
      </View>
      
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        AI Video Check-ins
      </Text>
      
      <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
        Get personalized video messages from your AI companion. These check-ins are tailored to your recovery journey, current mood, and provide emotional support when you need it most.
      </Text>

      <View style={[styles.featuresContainer, { backgroundColor: colors.primaryLight }]}>
        <Text style={[styles.featuresTitle, { color: colors.primary }]}>What makes it special:</Text>
        <Text style={[styles.featureItem, { color: colors.text }]}>• Personalized based on your recovery progress</Text>
        <Text style={[styles.featureItem, { color: colors.text }]}>• Adapts to your current emotional state</Text>
        <Text style={[styles.featureItem, { color: colors.text }]}>• Celebrates your achievements and milestones</Text>
        <Text style={[styles.featureItem, { color: colors.text }]}>• Provides encouragement during difficult times</Text>
        <Text style={[styles.featureItem, { color: colors.text }]}>• Emergency alert system with audio fallback</Text>
      </View>

      {!user?.isPremium && (
        <View style={[styles.premiumNotice, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
          <Crown size={20} color={colors.warning} />
          <Text style={[styles.premiumText, { color: colors.warning }]}>
            Premium Feature
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={[styles.content, { paddingHorizontal: padding, maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>AI Video Check-in</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Personalized support from your AI companion
          </Text>
        </View>

        {isGenerating ? (
          renderGeneratingState()
        ) : currentVideo?.videoUrl && !fallbackMode ? (
          <View style={styles.videoSection}>
            {renderVideoPlayer()}
            
            <View style={styles.videoActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleRegenerate}
              >
                <RotateCcw size={20} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  Generate New
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.infoTitle, { color: colors.primary }]}>
                Your Personalized Message
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                This video was created specifically for you based on your recovery progress, current mood ({currentVideo.mood}), and personal journey. Take a moment to listen to this supportive message.
              </Text>
            </View>

            {renderVideoHistory()}
          </View>
        ) : currentVideo && fallbackMode ? (
          <View style={styles.videoSection}>
            {renderFallbackContent()}
            
            <View style={styles.videoActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleRegenerate}
              >
                <RotateCcw size={20} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>

            {renderVideoHistory()}
          </View>
        ) : (
          <View>
            {renderEmptyState()}
            {user?.isPremium && (
              <View>
                {renderMoodSelector()}
                <TouchableOpacity
                  style={[
                    styles.generateButton,
                    { 
                      backgroundColor: selectedMood ? colors.primary : colors.disabled,
                    }
                  ]}
                  onPress={generatePersonalizedVideo}
                  disabled={isGenerating || !selectedMood}
                >
                  <Sparkles size={20} color="white" />
                  <Text style={[styles.generateButtonText, { color: 'white' }]}>
                    Generate My Check-in
                  </Text>
                </TouchableOpacity>

                {/* Emergency Alert Test Button (for development) */}
                <TouchableOpacity
                  style={[styles.emergencyButton, { backgroundColor: colors.error }]}
                  onPress={() => generateEmergencyAlert('This is a test emergency alert. Please remain calm and follow safety protocols.')}
                >
                  <AlertTriangle size={20} color="white" />
                  <Text style={[styles.generateButtonText, { color: 'white' }]}>
                    Test Emergency Alert
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {!user?.isPremium && (
              <TouchableOpacity
                style={[styles.generateButton, { backgroundColor: colors.warning }]}
                onPress={() => setShowPaywall(true)}
              >
                <Crown size={20} color="white" />
                <Text style={[styles.generateButtonText, { color: 'white' }]}>
                  Upgrade to Premium
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
  content: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  moodSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  moodOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    minWidth: 120,
  },
  moodEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  videoSection: {
    flex: 1,
  },
  videoContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: 300,
  },
  videoOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  videoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  videoDate: {
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  moodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  emergencyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  videoActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    marginBottom: 16,
  },
  fallbackIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  audioButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  generatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    marginBottom: 24,
  },
  sparkleIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  generatingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  generatingText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featureItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  premiumNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  premiumText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  historySection: {
    marginTop: 24,
  },
  historyScroll: {
    marginTop: 12,
  },
  historyItem: {
    width: 160,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 12,
    marginLeft: 4,
  },
  historyMood: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  emergencyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
    gap: 4,
  },
  emergencyIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusIndicatorText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
});