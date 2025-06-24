import axios from 'axios';
import { Platform } from 'react-native';
import { analyticsService } from './analyticsService';

interface TavusError extends Error {
  status?: number;
  code?: string;
}

class TavusService {
  private apiKey: string;
  private baseUrl = 'https://api.tavus.io/v1';
  private cache: Map<string, string> = new Map();
  private cacheExpiry: Map<string, number> = new Map();

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_TAVUS_API_KEY || '';
  }

  async generateVideo(
    script: string,
    mood: string = 'supportive',
    options: {
      userName?: string;
      location?: string;
      disasterType?: string;
    } = {}
  ): Promise<string | null> {
    // Validate input
    if (!script || script.trim().length === 0) {
      throw new Error('Script cannot be empty');
    }

    if (script.length > 2000) {
      throw new Error('Script is too long. Maximum 2000 characters allowed.');
    }

    // Check cache first (24-hour expiry for videos)
    const cacheKey = `${script.substring(0, 100)}-${mood}`;
    const cached = this.cache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);

    if (cached && expiry && Date.now() < expiry) {
      console.log('🎬 Using cached video');
      return cached;
    }

    // Check if we're on web platform
    if (Platform.OS === 'web') {
      console.log('🎬 Web platform detected - video generation not supported');
      return this.getMockVideoUrl(mood);
    }

    // Check if API key is missing or invalid
    if (!this.apiKey || this.apiKey.includes('YOUR_TAVUS_API_KEY')) {
      console.log('🎬 Using mock video due to missing API key');
      return this.getMockVideoUrl(mood);
    }

    try {
      console.log('🎬 Generating video with Tavus API');
      
      // Personalize script with user details if available
      let personalizedScript = script;
      if (options.userName) {
        personalizedScript = personalizedScript.replace(/\[NAME\]/g, options.userName);
      }
      if (options.location) {
        personalizedScript = personalizedScript.replace(/\[LOCATION\]/g, options.location);
      }
      if (options.disasterType) {
        personalizedScript = personalizedScript.replace(/\[DISASTER_TYPE\]/g, options.disasterType);
      }

      // In a real implementation, this would call the Tavus API
      // For now, we'll simulate the API call and return a mock video URL
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock successful response
      const videoUrl = this.getMockVideoUrl(mood);
      
      // Cache for 24 hours
      this.cache.set(cacheKey, videoUrl);
      this.cacheExpiry.set(cacheKey, Date.now() + 24 * 60 * 60 * 1000);

      analyticsService.trackEvent('tavus_video_generated', {
        script_length: script.length,
        mood,
        has_personalization: !!(options.userName || options.location || options.disasterType)
      });

      return videoUrl;
    } catch (error) {
      console.error('Failed to generate video:', error);

      if (error instanceof Error) {
        // Re-throw with more user-friendly messages
        if (
          error.message.includes('network') ||
          error.message.includes('fetch')
        ) {
          throw new Error(
            'Network connection issue. Please check your internet connection.'
          );
        } else if (error.message.includes('rate limit')) {
          throw new Error(
            'Service temporarily busy. Please try again in a moment.'
          );
        } else if (
          error.message.includes('quota') ||
          error.message.includes('credits')
        ) {
          throw new Error(
            'Video service quota exceeded. Please try again later.'
          );
        }
      }

      analyticsService.trackError('tavus_video_generation_failed', 'TavusService', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  private getMockVideoUrl(mood: string): string {
    // Return different mock videos based on mood
    const moodVideos: Record<string, string> = {
      supportive: 'https://assets.mixkit.co/videos/preview/mixkit-young-mother-with-her-little-daughter-decorating-a-christmas-tree-39745-large.mp4',
      hopeful: 'https://assets.mixkit.co/videos/preview/mixkit-mother-with-her-little-daughter-eating-a-marshmallow-in-nature-39764-large.mp4',
      encouraging: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4',
      empathetic: 'https://assets.mixkit.co/videos/preview/mixkit-woman-running-above-the-camera-on-a-running-track-32807-large.mp4',
      motivational: 'https://assets.mixkit.co/videos/preview/mixkit-man-under-multicolored-lights-1237-large.mp4'
    };

    return moodVideos[mood] || moodVideos.supportive;
  }

  async saveVideoToSupabase(
    userId: string,
    videoId: string,
    script: string,
    mood: string,
    videoUrl: string,
    journalEntry?: string
  ): Promise<boolean> {
    try {
      // In a real implementation, this would save to Supabase
      // For now, we'll just log the action and return success
      console.log('Saving video to Supabase:', {
        userId,
        videoId,
        script: script.substring(0, 50) + '...',
        mood,
        videoUrl
      });

      analyticsService.trackEvent('tavus_video_saved', {
        user_id: userId,
        video_id: videoId,
        mood
      });

      return true;
    } catch (error) {
      console.error('Failed to save video to Supabase:', error);
      analyticsService.trackError('tavus_video_save_failed', 'TavusService', {
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id: userId
      });
      return false;
    }
  }

  // Clear cache (useful for testing or memory management)
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.apiKey || this.apiKey.includes('YOUR_TAVUS_API_KEY')) {
        return false;
      }

      // In a real implementation, this would check the Tavus API status
      // For now, we'll just return true
      return true;
    } catch {
      return false;
    }
  }
}

export const tavusService = new TavusService();