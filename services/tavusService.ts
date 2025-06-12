class TavusService {
  private apiKey: string;
  private baseUrl = 'https://tavusapi.com/v2';
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second base delay for exponential backoff

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_TAVUS_API_KEY || '';
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`${context} attempt ${attempt} failed:`, error);
        
        if (attempt < this.maxRetries) {
          const delayMs = this.baseDelay * Math.pow(2, attempt - 1);
          console.log(`Retrying ${context} in ${delayMs}ms...`);
          await this.delay(delayMs);
        }
      }
    }
    
    throw lastError!;
  }

  async generateVideo(script: string, userId: string): Promise<{ videoId: string; status: string } | null> {
    if (!this.apiKey) {
      // Mock video generation for development
      console.log('🎬 Using mock video generation for development');
      return {
        videoId: `mock_video_${Date.now()}`,
        status: 'generating'
      };
    }

    try {
      const result = await this.retryWithBackoff(async () => {
        const response = await fetch(`${this.baseUrl}/videos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
          },
          body: JSON.stringify({
            replica_id: 'default_replica',
            script,
            // Emergency broadcast video specifications:
            // Note: These parameters would be used if Tavus API supported them directly
            // For now, they serve as documentation of requirements
            background: 'office', // Professional background for emergency alerts
            properties: {
              user_id: userId,
              personalization: true,
              // Emergency alert video requirements (for future API support):
              // resolution: '1920x1080', // 1080p for professional quality
              // frame_rate: 30, // 30fps for smooth playback
              // visual_style: 'emergency_broadcast', // High contrast, clear typography
              // branding: {
              //   logo: 'organization_logo',
              //   emergency_elements: true,
              //   warning_symbols: true
              // },
              // duration_target: 60, // 60-second target for emergency alerts
              // audio_settings: {
              //   voice_clarity: 'high',
              //   speaking_rate: 0.9 // Slightly slower for emergency announcements
              // }
            }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.video_id) {
          throw new Error('No video ID returned from Tavus API');
        }

        return {
          videoId: data.video_id,
          status: data.status || 'generating'
        };
      }, 'Video generation');

      console.log('🎬 Video generation initiated:', result);
      return result;
    } catch (error) {
      console.error('Failed to generate video after retries:', error);
      return null;
    }
  }

  async getVideoStatus(videoId: string): Promise<{ status: string; videoUrl?: string } | null> {
    if (videoId.startsWith('mock_video_')) {
      // Mock video status for development
      console.log('🎬 Using mock video status for development');
      return {
        status: 'completed',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      };
    }

    if (!this.apiKey) {
      console.warn('No Tavus API key provided');
      return null;
    }

    try {
      const result = await this.retryWithBackoff(async () => {
        const response = await fetch(`${this.baseUrl}/videos/${videoId}`, {
          headers: {
            'x-api-key': this.apiKey,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        // Validate that completed videos have a download URL
        if (data.status === 'completed' && !data.download_url) {
          throw new Error('Video marked as completed but no download URL provided');
        }

        return {
          status: data.status,
          videoUrl: data.download_url
        };
      }, `Video status check for ${videoId}`);

      console.log('🎬 Video status retrieved:', result);
      return result;
    } catch (error) {
      console.error('Failed to get video status after retries:', error);
      return null;
    }
  }

  // Enhanced script generation for emergency alerts
  generateEmergencyAlertScript(alertData: {
    alertText: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    location?: string;
    timestamp?: Date;
    instructions?: string[];
  }): string {
    const { alertText, severity = 'medium', location, timestamp, instructions = [] } = alertData;
    
    // Ensure alert text is within 500 character limit
    const truncatedAlert = alertText.length > 500 ? alertText.substring(0, 497) + '...' : alertText;
    
    let script = '';
    
    // Emergency alert opening based on severity
    switch (severity) {
      case 'critical':
        script += 'EMERGENCY ALERT: This is a critical emergency notification. ';
        break;
      case 'high':
        script += 'URGENT ALERT: This is an urgent emergency notification. ';
        break;
      case 'medium':
        script += 'ALERT: This is an important emergency notification. ';
        break;
      case 'low':
        script += 'NOTICE: This is an emergency information update. ';
        break;
    }
    
    // Add timestamp if provided
    if (timestamp) {
      script += `Issued at ${timestamp.toLocaleTimeString()} on ${timestamp.toLocaleDateString()}. `;
    }
    
    // Add location if provided
    if (location) {
      script += `This alert affects the ${location} area. `;
    }
    
    // Main alert content
    script += truncatedAlert + ' ';
    
    // Add instructions if provided
    if (instructions.length > 0) {
      script += 'Please follow these instructions: ';
      instructions.forEach((instruction, index) => {
        script += `${index + 1}. ${instruction}. `;
      });
    }
    
    // Emergency alert closing
    script += 'Stay safe and monitor official channels for updates. This has been an emergency alert notification.';
    
    return script;
  }

  generatePersonalizedScript(userData: {
    name?: string;
    disasterType?: string;
    daysSinceDisaster?: number;
    immediateNeeds?: string[];
    recentProgress?: string[];
    mood?: string;
    currentLevel?: number;
    totalPoints?: number;
  }): string {
    const { 
      name = 'there', 
      disasterType = 'disaster', 
      daysSinceDisaster = 0, 
      immediateNeeds = [], 
      recentProgress = [],
      mood = 'hopeful',
      currentLevel = 1,
      totalPoints = 0
    } = userData;

    let script = `Hello ${name}, I hope you're doing well today. `;

    // Acknowledge their mood
    switch (mood) {
      case 'hopeful':
        script += `I can sense your hopeful energy today, and that's such a beautiful thing to see. `;
        break;
      case 'overwhelmed':
        script += `I understand you're feeling overwhelmed right now, and that's completely okay. These feelings are valid and temporary. `;
        break;
      case 'grateful':
        script += `Your sense of gratitude today is truly inspiring. Even in difficult times, your ability to find things to appreciate shows incredible strength. `;
        break;
      case 'anxious':
        script += `I notice you're feeling anxious today. Take a deep breath with me - you're safe right now, and we'll take this one step at a time. `;
        break;
      case 'determined':
        script += `Your determination today is powerful. That inner strength you're showing is exactly what will carry you through this journey. `;
        break;
      default:
        script += `Thank you for sharing how you're feeling with me today. `;
    }

    // Acknowledge time since disaster
    if (daysSinceDisaster > 0) {
      if (daysSinceDisaster < 7) {
        script += `I know it's only been ${daysSinceDisaster} days since the ${disasterType}, and everything still feels fresh and overwhelming. What you're experiencing is completely normal. `;
      } else if (daysSinceDisaster < 30) {
        script += `It's been ${daysSinceDisaster} days since the ${disasterType}. You've made it through some of the hardest initial days, and that takes incredible courage. `;
      } else {
        script += `${daysSinceDisaster} days have passed since the ${disasterType}. Look how far you've come - each day you've chosen to keep going is a victory. `;
      }
    }

    // Celebrate progress and achievements
    if (recentProgress.length > 0) {
      script += `I've been watching your progress, and I'm genuinely proud of what you've accomplished. You've ${recentProgress.join(', ')}. `;
      
      if (currentLevel && currentLevel > 1) {
        script += `You've reached level ${currentLevel} in your recovery journey, which shows your dedication and resilience. `;
      }
      
      if (totalPoints && totalPoints > 0) {
        script += `You've earned ${totalPoints} points by taking positive steps forward. Each point represents a moment where you chose progress over staying stuck. `;
      }
    }

    // Address immediate needs with empathy
    if (immediateNeeds.length > 0) {
      script += `I see you're still working on some immediate needs like ${immediateNeeds.join(' and ')}. Remember, addressing these needs isn't just practical - it's an act of self-care and self-respect. `;
    }

    // Mood-specific encouragement
    switch (mood) {
      case 'hopeful':
        script += `Hold onto that hope - it's not naive or foolish. Hope is a choice, and choosing it repeatedly is one of the bravest things you can do. `;
        break;
      case 'overwhelmed':
        script += `When everything feels like too much, remember: you don't have to solve everything today. Pick one small thing, just one, and focus on that. `;
        break;
      case 'grateful':
        script += `Your gratitude is a superpower. It's helping you see light even in dark times, and that perspective will be your guide forward. `;
        break;
      case 'anxious':
        script += `Anxiety often comes from our mind trying to solve tomorrow's problems with today's information. You're handling today beautifully. `;
        break;
      case 'determined':
        script += `Channel that determination wisely. You have the strength to rebuild, but remember to be gentle with yourself in the process. `;
        break;
    }

    // Closing with personalized encouragement
    script += `You're not just surviving this experience - you're learning, growing, and becoming more resilient with each passing day. `;
    
    script += `I believe in you, ${name}. Your journey matters, your feelings are valid, and your future is still full of possibilities. Take care of yourself today, and remember - I'm here whenever you need encouragement. You've got this.`;

    return script;
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) {
      console.log('🎬 Tavus health check: No API key (development mode)');
      return true; // Consider healthy in development
    }

    try {
      // Simple API connectivity test
      const response = await fetch(`${this.baseUrl}/replicas`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      const isHealthy = response.ok;
      console.log(`🎬 Tavus health check: ${isHealthy ? 'Healthy' : 'Unhealthy'}`);
      return isHealthy;
    } catch (error) {
      console.error('🎬 Tavus health check failed:', error);
      return false;
    }
  }
}

export const tavusService = new TavusService();