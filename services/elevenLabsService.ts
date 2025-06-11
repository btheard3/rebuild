import { Platform } from 'react-native';
import { Audio } from 'expo-av';

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
    // Check cache first (24-hour expiry for emergency alerts)
    const cacheKey = `${text}-${voiceId}`;
    const cached = this.cache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);
    
    if (cached && expiry && Date.now() < expiry) {
      console.log('🎵 Using cached audio for emergency alert');
      return cached;
    }

    if (Platform.OS === 'web' || !this.apiKey) {
      // Mock audio URL for web or when API key is missing
      console.log('🎵 Using mock audio for development');
      return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
    }

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: options.stability || 0.75, // Emergency alert optimized
            similarity_boost: options.similarity_boost || 0.75, // Clear enunciation
            style: options.style || 0.15, // Professional tone
            use_speaker_boost: options.use_speaker_boost || true, // Enhanced clarity
          },
          // Note: Speaking rate (0.9 for emergency alerts) is controlled by the model
          // and cannot be directly set via voice_settings for eleven_monolingual_v1
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Cache for 24 hours (emergency alerts)
      this.cache.set(cacheKey, audioUrl);
      this.cacheExpiry.set(cacheKey, Date.now() + 24 * 60 * 60 * 1000);
      
      return audioUrl;
    } catch (error) {
      console.error('Failed to generate speech:', error);
      return null;
    }
  }

  async playAudio(audioUrl: string): Promise<void> {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, volume: 1.0 } // Full volume for emergency alerts
      );
      
      // Clean up sound after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }

  async generateAndPlaySpeech(text: string, voiceId?: string): Promise<void> {
    const audioUrl = await this.generateSpeech(text, voiceId);
    if (audioUrl) {
      await this.playAudio(audioUrl);
    }
  }

  // Emergency alert specific method with optimized settings
  async generateEmergencyAlert(alertText: string): Promise<string | null> {
    // Ensure text is within 500 character limit for emergency alerts
    const truncatedText = alertText.length > 500 ? alertText.substring(0, 497) + '...' : alertText;
    
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
      stressed: "Take a deep breath. You've overcome challenges before, and you have the strength to handle this too. One step at a time.",
      anxious: "It's okay to feel uncertain. Focus on what you can control today, and trust that you're making progress even when it doesn't feel like it.",
      overwhelmed: "You don't have to do everything at once. Break it down into small steps, and celebrate each victory along the way.",
      hopeful: "Your positive energy is powerful. Keep nurturing that hope - it's lighting the way forward for yourself and others.",
      grateful: "Gratitude is a beautiful strength. Even in difficult times, your ability to find things to appreciate shows your resilient spirit.",
      default: "You are resilient, capable, and worthy of support. Every step you take in your recovery journey matters, no matter how small."
    };

    return affirmations[mood.toLowerCase()] || affirmations.default;
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
      entries: Array.from(this.cache.keys())
    };
  }
}

export const elevenLabsService = new ElevenLabsService();