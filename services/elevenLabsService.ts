import { Platform } from 'react-native';
import { Audio } from 'expo-audio';

class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '';
  }

  async generateSpeech(text: string, voiceId: string = 'pNInz6obpgDQGcFmaJgB'): Promise<string | null> {
    if (Platform.OS === 'web' || !this.apiKey) {
      // Mock audio URL for web or when API key is missing
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
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      return audioUrl;
    } catch (error) {
      console.error('Failed to generate speech:', error);
      return null;
    }
  }

  async playAudio(audioUrl: string): Promise<void> {
    try {
      const sound = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      // Clean up sound after playing
      sound.sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.sound.unloadAsync();
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
}

export const elevenLabsService = new ElevenLabsService();