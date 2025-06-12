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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatusSuccess } from 'expo-av';
import { Play, Pause, RotateCcw } from 'lucide-react-native';
import { tavusService } from '@/services/tavusService';
import { useAuth } from '@/context/AuthContext';

export default function VideoCheckinScreen() {
  const videoRef = useRef<Video>(null);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [prompt, setPrompt] = useState(
    'Today, I want to reflect on my progress.'
  );

  const generateVideo = async () => {
    setIsLoading(true);
    setVideoUrl(null);
    try {
      console.log('Generating video for prompt:', prompt);
      const url = await tavusService.generateVideo(prompt, user?.id ?? 'guest');
      if (!url) throw new Error('No video URL returned');
      console.log('Video URL:', url);
      setVideoUrl(url);
    } catch (error) {
      console.error('Video generation failed:', error);
      Alert.alert('Error', 'AI video generation failed. Try again later.');
    } finally {
      setIsLoading(false);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>AI Video Check-in</Text>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateVideo}
          disabled={isLoading}
        >
          <Text style={styles.generateButtonText}>
            {isLoading ? 'Generating...' : 'Generate AI Video'}
          </Text>
        </TouchableOpacity>

        {isLoading && (
          <ActivityIndicator
            size="large"
            color="#10B981"
            style={{ marginVertical: 20 }}
          />
        )}

        {videoUrl && (
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={{ uri: videoUrl }}
              style={styles.video}
              useNativeControls={false}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
            />
            <View style={styles.controls}>
              <TouchableOpacity onPress={handlePlayPause}>
                {isPlaying ? (
                  <Pause size={32} color="white" />
                ) : (
                  <Play size={32} color="white" />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => videoRef.current?.replayAsync()}>
                <RotateCcw size={32} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  videoContainer: {
    marginTop: 24,
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#1E293B',
  },
});
