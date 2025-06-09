import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { useResponsive, getResponsiveValue } from '@/hooks/useResponsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tavusService } from '@/services/tavusService';
import { analyticsService } from '@/services/analyticsService';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Play, Pause, RotateCcw, Crown, Lock } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';
import PaywallScreen from '@/components/PaywallScreen';

export default function VideoCheckinScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { data: gamificationData, addPoints } = useGamification();
  const { deviceType } = useResponsive();
  
  const [videoData, setVideoData] = useState<{ videoId: string; videoUrl?: string; status: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const getPadding = getResponsiveValue(16, 24, 32);
  const getMaxWidth = getResponsiveValue('100%', 600, 800);
  
  const padding = getPadding(deviceType);
  const maxWidth = getMaxWidth(deviceType);

  // Create video player
  const player = useVideoPlayer(videoData?.videoUrl || '', (player) => {
    player.loop = false;
    player.muted = false;
  });

  useEffect(() => {
    analyticsService.trackScreen('video_checkin');
    
    // Check if user has existing video
    loadExistingVideo();
  }, []);

  const loadExistingVideo = async () => {
    // In a real app, you'd load from storage or API
    // For now, we'll just check if there's a mock video
    const mockVideoId = 'mock_video_' + user?.id;
    const status = await tavusService.getVideoStatus(mockVideoId);
    
    if (status && status.status === 'completed') {
      setVideoData({
        videoId: mockVideoId,
        videoUrl: status.videoUrl,
        status: status.status
      });
    }
  };

  const generatePersonalizedVideo = async () => {
    if (!user?.isPremium) {
      setShowPaywall(true);
      analyticsService.trackEvent('video_checkin_paywall_shown', { reason: 'not_premium' });
      return;
    }

    setIsGenerating(true);
    analyticsService.trackEvent('video_checkin_generation_started');

    try {
      // Generate personalized script based on user data
      const script = tavusService.generatePersonalizedScript({
        name: user.name?.split(' ')[0],
        disasterType: 'hurricane', // This would come from user's recovery wizard data
        daysSinceDisaster: 5, // This would be calculated from actual disaster date
        immediateNeeds: ['shelter', 'food'], // From user's needs assessment
        recentProgress: ['Completed recovery wizard', 'Uploaded insurance documents']
      });

      const result = await tavusService.generateVideo(script, user.id);
      
      if (result) {
        setVideoData(result);
        
        // Poll for completion
        pollVideoStatus(result.videoId);
        
        // Award points for using AI video feature
        addPoints(25, 'Generated AI video check-in');
        
        analyticsService.trackEvent('video_checkin_generation_completed', {
          videoId: result.videoId
        });
      }
    } catch (error) {
      console.error('Failed to generate video:', error);
      analyticsService.trackError('video_checkin_generation_failed', 'VideoCheckinScreen', {
        error: error.message
      });
      
      Alert.alert(
        'Generation Failed',
        'We couldn\'t generate your video check-in right now. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const pollVideoStatus = async (videoId: string) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const poll = async () => {
      attempts++;
      const status = await tavusService.getVideoStatus(videoId);
      
      if (status) {
        setVideoData(prev => prev ? { ...prev, ...status } : null);
        
        if (status.status === 'completed' && status.videoUrl) {
          analyticsService.trackEvent('video_checkin_ready', { videoId });
          return;
        }
        
        if (status.status === 'failed') {
          analyticsService.trackError('video_checkin_generation_failed', 'VideoCheckinScreen', {
            videoId,
            status: status.status
          });
          return;
        }
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 10000); // Poll every 10 seconds
      }
    };

    poll();
  };

  const handlePlayPause = () => {
    if (player.playing) {
      player.pause();
      analyticsService.trackEvent('video_checkin_paused');
    } else {
      player.play();
      analyticsService.trackEvent('video_checkin_played');
    }
  };

  const handleRegenerate = () => {
    Alert.alert(
      'Regenerate Video',
      'This will create a new personalized video check-in. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Regenerate', onPress: generatePersonalizedVideo }
      ]
    );
  };

  const renderVideoPlayer = () => {
    if (!videoData?.videoUrl) return null;

    return (
      <View style={[styles.videoContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
        />
        
        <View style={styles.videoControls}>
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: colors.primary }]}
            onPress={handlePlayPause}
          >
            {player.playing ? (
              <Pause size={24} color="white" />
            ) : (
              <Play size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderGeneratingState = () => (
    <View style={[styles.generatingContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.generatingTitle, { color: colors.text }]}>
        Creating Your Personal Check-in
      </Text>
      <Text style={[styles.generatingText, { color: colors.textSecondary }]}>
        Our AI is crafting a personalized video message just for you. This usually takes 2-3 minutes.
      </Text>
      
      {videoData && (
        <View style={[styles.statusContainer, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.statusText, { color: colors.primary }]}>
            Status: {videoData.status}
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <Crown size={48} color={colors.primary} />
      </View>
      
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        AI Video Check-ins
      </Text>
      
      <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
        Get personalized video messages from your AI companion. These check-ins are tailored to your recovery journey and provide emotional support when you need it most.
      </Text>

      {!user?.isPremium && (
        <View style={[styles.premiumNotice, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
          <Lock size={20} color={colors.warning} />
          <Text style={[styles.premiumText, { color: colors.warning }]}>
            Premium Feature
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.generateButton,
          { 
            backgroundColor: user?.isPremium ? colors.primary : colors.disabled,
          }
        ]}
        onPress={generatePersonalizedVideo}
        disabled={isGenerating}
      >
        <Text style={[styles.generateButtonText, { color: 'white' }]}>
          {user?.isPremium ? 'Generate My Check-in' : 'Upgrade to Premium'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingHorizontal: padding, maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>AI Video Check-in</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Personalized support from your AI companion
          </Text>
        </View>

        {isGenerating ? (
          renderGeneratingState()
        ) : videoData?.videoUrl ? (
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
                This video was created specifically for you based on your recovery progress, current needs, and personal journey. Take a moment to listen to this supportive message.
              </Text>
            </View>
          </View>
        ) : (
          renderEmptyState()
        )}
      </View>

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
  videoControls: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
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
  generatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
  },
  generatingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
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
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
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
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
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
});