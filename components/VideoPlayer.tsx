import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import { useTheme } from '@/context/ThemeContext';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react-native';

interface VideoPlayerProps {
  source: { uri: string };
  style?: any;
  autoplay?: boolean;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
  onError?: (error: string) => void;
}

export default function VideoPlayer({
  source,
  style,
  autoplay = false,
  onPlaybackStatusUpdate,
  onError,
}: VideoPlayerProps) {
  const { colors } = useTheme();
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    return () => {
      // Unload video when component unmounts
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, []);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('Video playback error:', status.error);
        setHasError(true);
        if (onError) onError(status.error);
      }
      return;
    }

    setIsLoading(false);
    setIsPlaying(status.isPlaying);

    if (status.didJustFinish) {
      setIsPlaying(false);
    }

    if (onPlaybackStatusUpdate) {
      onPlaybackStatusUpdate(status);
    }
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const handleReplay = async () => {
    if (!videoRef.current) return;

    await videoRef.current.replayAsync();
  };

  const toggleMute = async () => {
    if (!videoRef.current) return;

    const newMuteState = !isMuted;
    await videoRef.current.setIsMutedAsync(newMuteState);
    setIsMuted(newMuteState);
  };

  // Web fallback for platforms that don't support Video component
  if (Platform.OS === 'web' && !Video) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        style={styles.video}
        source={source}
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        useNativeControls={false}
      />

      {isLoading && (
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
          <ActivityIndicator color="white" size="large" />
        </View>
      )}

      {hasError && (
        <View style={[styles.overlay, { backgroundColor: colors.error + '20' }]}>
          <View style={styles.errorContainer}>
            <Play size={24} color={colors.error} />
          </View>
        </View>
      )}

      {!isLoading && !hasError && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            onPress={handlePlayPause}
          >
            {isPlaying ? (
              <Pause size={24} color="white" />
            ) : (
              <Play size={24} color="white" />
            )}
          </TouchableOpacity>

          <View style={styles.secondaryControls}>
            <TouchableOpacity
              style={[styles.smallControlButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
              onPress={handleReplay}
            >
              <RotateCcw size={16} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallControlButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
              onPress={toggleMute}
            >
              {isMuted ? (
                <VolumeX size={16} color="white" />
              ) : (
                <Volume2 size={16} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryControls: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  smallControlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});