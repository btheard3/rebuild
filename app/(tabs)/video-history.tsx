import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { analyticsService } from '@/services/analyticsService';
import { supabase } from '@/services/supabaseClient';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Video as VideoIcon,
  Calendar,
  Clock,
  Heart,
  Share2,
  Download,
  Trash2,
  Play,
} from 'lucide-react-native';
import VideoPlayer from '@/components/VideoPlayer';
import BoltBadge from '@/components/BoltBadge';

interface VideoHistoryItem {
  id: string;
  video_id: string;
  script: string;
  mood: string;
  video_url: string;
  created_at: string;
  status: string;
}

export default function VideoHistoryScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { deviceType, padding } = useResponsive();
  const [videos, setVideos] = useState<VideoHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoHistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    analyticsService.trackScreen('video_history');
    loadVideos();
  }, []);

  const loadVideos = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('video_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load videos:', error);
        Alert.alert('Error', 'Failed to load your video history.');
      } else if (data) {
        setVideos(data as VideoHistoryItem[]);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!user) return;

    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { error } = await supabase
                .from('video_logs')
                .delete()
                .eq('id', videoId)
                .eq('user_id', user.id);

              if (error) {
                console.error('Failed to delete video:', error);
                Alert.alert('Error', 'Failed to delete the video.');
              } else {
                // Remove from local state
                setVideos(prev => prev.filter(v => v.id !== videoId));
                
                // If the deleted video was selected, clear selection
                if (selectedVideo?.id === videoId) {
                  setSelectedVideo(null);
                }
                
                analyticsService.trackEvent('video_deleted', { video_id: videoId });
              }
            } catch (error) {
              console.error('Error deleting video:', error);
              Alert.alert('Error', 'An unexpected error occurred.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleShareVideo = (video: VideoHistoryItem) => {
    Alert.alert(
      'Share Video',
      'This would share your personalized video with others.',
      [{ text: 'OK' }]
    );
    analyticsService.trackEvent('video_share_attempted', { video_id: video.id });
  };

  const handleSaveVideo = (video: VideoHistoryItem) => {
    Alert.alert(
      'Save to Gallery',
      'This would save your personalized video to your device gallery.',
      [{ text: 'OK' }]
    );
    analyticsService.trackEvent('video_save_attempted', { video_id: video.id });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMoodColor = (mood: string) => {
    const moodColors: Record<string, string> = {
      supportive: colors.primary,
      hopeful: colors.success,
      encouraging: colors.warning,
      empathetic: colors.accent,
      motivational: colors.error,
    };
    return moodColors[mood] || colors.primary;
  };

  const renderVideoItem = ({ item }: { item: VideoHistoryItem }) => {
    const isSelected = selectedVideo?.id === item.id;
    const moodColor = getMoodColor(item.mood);

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.videoCard,
          {
            backgroundColor: colors.surface,
            borderColor: isSelected ? moodColor : colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => setSelectedVideo(item)}
      >
        <View style={styles.videoCardHeader}>
          <View style={styles.videoCardInfo}>
            <View style={styles.dateContainer}>
              <Calendar size={14} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                {formatDate(item.created_at)}
              </Text>
            </View>
            <View style={styles.timeContainer}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                {formatTime(item.created_at)}
              </Text>
            </View>
          </View>
          <View style={[styles.moodBadge, { backgroundColor: moodColor + '20' }]}>
            <Text style={[styles.moodText, { color: moodColor }]}>
              {item.mood.charAt(0).toUpperCase() + item.mood.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.thumbnailContainer}>
          <View style={[styles.thumbnail, { backgroundColor: colors.primary + '10' }]}>
            <VideoIcon size={24} color={colors.primary} />
            <Play size={32} color={colors.primary} style={styles.playIcon} />
          </View>
        </View>

        <Text
          style={[styles.scriptPreview, { color: colors.text }]}
          numberOfLines={2}
        >
          {item.script}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <VideoIcon size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Videos Yet</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Your AI-generated video messages will appear here. Create your first video by sharing your thoughts in the Video Check-in tab.
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(tabs)/video-checkin')}
      >
        <Text style={styles.createButtonText}>Create First Video</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Video History
        </Text>
        <View style={styles.placeholderButton} />
      </View>

      <View style={[styles.content, { paddingHorizontal: padding }]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading your videos...
            </Text>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {selectedVideo ? (
              <View style={styles.videoPlayerSection}>
                <VideoPlayer
                  source={{ uri: selectedVideo.video_url }}
                  style={styles.videoPlayer}
                  onError={(error) => {
                    console.error('Video playback error:', error);
                    Alert.alert('Playback Error', 'Unable to play this video.');
                  }}
                />

                <View style={styles.videoActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                    onPress={() => handleShareVideo(selectedVideo)}
                  >
                    <Share2 size={20} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                      Share
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
                    onPress={() => handleSaveVideo(selectedVideo)}
                  >
                    <Download size={20} color={colors.success} />
                    <Text style={[styles.actionButtonText, { color: colors.success }]}>
                      Save
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
                    onPress={() => handleDeleteVideo(selectedVideo.id)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <>
                        <Trash2 size={20} color={colors.error} />
                        <Text style={[styles.actionButtonText, { color: colors.error }]}>
                          Delete
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={[styles.scriptContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.scriptTitle, { color: colors.text }]}>Video Script</Text>
                  <Text style={[styles.scriptContent, { color: colors.textSecondary }]}>
                    {selectedVideo.script}
                  </Text>
                  <View style={styles.scriptMeta}>
                    <View style={styles.metaItem}>
                      <Calendar size={14} color={colors.textSecondary} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {formatDate(selectedVideo.created_at)}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Heart size={14} color={getMoodColor(selectedVideo.mood)} />
                      <Text style={[styles.metaText, { color: getMoodColor(selectedVideo.mood) }]}>
                        {selectedVideo.mood.charAt(0).toUpperCase() + selectedVideo.mood.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.videoListSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Videos
              </Text>
              {videos.length > 0 ? (
                <FlatList
                  data={videos}
                  renderItem={renderVideoItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.videoList}
                  numColumns={deviceType === 'mobile' ? 1 : 2}
                  key={deviceType === 'mobile' ? 'single' : 'double'}
                  columnWrapperStyle={deviceType !== 'mobile' ? styles.videoGrid : undefined}
                />
              ) : (
                renderEmptyState()
              )}
            </View>
          </View>
        )}
      </View>
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
    fontWeight: 'bold',
  },
  placeholderButton: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
  },
  videoPlayerSection: {
    marginBottom: 24,
  },
  videoPlayer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    marginBottom: 16,
  },
  videoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  scriptContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  scriptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scriptContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  scriptMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  videoListSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  videoList: {
    paddingBottom: 20,
  },
  videoGrid: {
    justifyContent: 'space-between',
  },
  videoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    width: '48%',
  },
  videoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  videoCardInfo: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    marginLeft: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  moodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  thumbnailContainer: {
    marginBottom: 12,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  playIcon: {
    position: 'absolute',
  },
  scriptPreview: {
    fontSize: 12,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});