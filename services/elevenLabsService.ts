import { Platform } from 'react-native';
import { Audio } from 'expo-av';

interface ElevenLabsError extends Error {
  status?: number;
  code?: string;
}

class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private cache: Map<string, string> = new Map();
  private cacheExpiry: Map<string, number> = new Map();

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '';
  }

  async generateSpeech(
    text: string,
    voiceId: string = 'ThT5KcBeYPX3keUQqHPh', // Professional male announcer for emergency alerts
    options: {
      stability?: number;
      similarity_boost?: number;
      style?: number;
      use_speaker_boost?: boolean;
    } = {}
  ): Promise<string | null> {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    if (text.length > 5000) {
      throw new Error('Text is too long. Maximum 5000 characters allowed.');
    }

    // Check cache first (24-hour expiry for emergency alerts)
    const cacheKey = `${text.substring(0, 100)}-${voiceId}`;
    const cached = this.cache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);

    if (cached && expiry && Date.now() < expiry) {
      console.log('🎵 Using cached audio for emergency alert');
      return cached;
    }

    if (
      Platform.OS === 'web' ||
      !this.apiKey ||
      this.apiKey.includes('your_elevenlabs_api_key')
    ) {
      // Mock audio URL for web or when API key is missing
      console.log('🎵 Using mock audio for development');
      return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text: text.trim(),
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: options.stability || 0.75, // Emergency alert optimized
              similarity_boost: options.similarity_boost || 0.75, // Clear enunciation
              style: options.style || 0.15, // Professional tone
              use_speaker_boost: options.use_speaker_boost || true, // Enhanced clarity
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        let errorMessage = `ElevenLabs API error: ${response.status}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage += ` - ${
            errorData.detail?.message || errorData.message || errorText
          }`;
        } catch {
          errorMessage += ` - ${errorText}`;
        }

        const error = new Error(errorMessage) as ElevenLabsError;
        error.status = response.status;

        // Handle specific error cases
        if (response.status === 401) {
          error.message =
            'Invalid ElevenLabs API key. Please check your configuration.';
        } else if (response.status === 429) {
          error.message = 'Rate limit exceeded. Please try again in a moment.';
        } else if (response.status === 422) {
          error.message = 'Invalid request. Please check your text input.';
        }

        throw error;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Cache for 24 hours (emergency alerts)
      this.cache.set(cacheKey, audioUrl);
      this.cacheExpiry.set(cacheKey, Date.now() + 24 * 60 * 60 * 1000);

      return audioUrl;
    } catch (error) {
      console.error('Failed to generate speech:', error);

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
            'Voice service quota exceeded. Please try again later.'
          );
        }
      }

      throw error;
    }
  }

  async playAudio(audioUrl: string): Promise<void> {
    try {
      // Configure audio session for emergency alerts
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        {
          shouldPlay: true,
          volume: 1.0, // Full volume for emergency alerts
          rate: 1.0,
          shouldCorrectPitch: true,
        }
      );

      // Clean up sound after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(console.warn);
        }
      });

      // Handle playback errors
      // ✅ Type-safe check for error using type narrowing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          if ('error' in status && status.error) {
            console.error('Audio playback error:', status.error);
          }
        }
      });
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw new Error(
        'Unable to play audio. Please check your device audio settings.'
      );
    }
  }

  async generateAndPlaySpeech(text: string, voiceId?: string): Promise<void> {
    try {
      const audioUrl = await this.generateSpeech(text, voiceId);
      if (audioUrl) {
        await this.playAudio(audioUrl);
      } else {
        throw new Error('Failed to generate audio');
      }
    } catch (error) {
      console.error('Generate and play speech error:', error);
      throw error;
    }
  }

  // Emergency alert specific method with optimized settings
  async generateEmergencyAlert(alertText: string): Promise<string | null> {
    // Ensure text is within 500 character limit for emergency alerts
    const truncatedText =
      alertText.length > 500 ? alertText.substring(0, 497) + '...' : alertText;

    return this.generateSpeech(
      truncatedText,
      'ThT5KcBeYPX3keUQqHPh', // Professional male announcer
      {
        stability: 0.75,
        similarity_boost: 0.75,
        style: 0.15,
        use_speaker_boost: true,
      }
    );
  }

  // Predefined affirmations for different emotional states
  getAffirmationForMood(mood: string): string {
    const affirmations: Record<string, string> = {
      sad: "You are stronger than you know, and this difficult time will pass. Every day you're rebuilding, you're showing incredible courage.",
      stressed:
        "Take a deep breath. You've overcome challenges before, and you have the strength to handle this too. One step at a time.",
      anxious:
        "It's okay to feel uncertain. Focus on what you can control today, and trust that you're making progress even when it doesn't feel like it.",
      overwhelmed:
        "You don't have to do everything at once. Break it down into small steps, and celebrate each victory along the way.",
      hopeful:
        "Your positive energy is powerful. Keep nurturing that hope - it's lighting the way forward for yourself and others.",
      grateful:
        'Gratitude is a beautiful strength. Even in difficult times, your ability to find things to appreciate shows your resilient spirit.',
      default:
        'You are resilient, capable, and worthy of support. Every step you take in your recovery journey matters, no matter how small.',
    };

    return affirmations[mood.toLowerCase()] || affirmations.default;
  }

  // Clear cache (useful for testing or memory management)
  clearCache(): void {
    // Clean up blob URLs to prevent memory leaks
    this.cache.forEach((url) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });

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
      if (!this.apiKey || this.apiKey.includes('your_elevenlabs_api_key')) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
