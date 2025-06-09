class TavusService {
  private apiKey: string;
  private baseUrl = 'https://tavusapi.com/v2';

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_TAVUS_API_KEY || '';
  }

  async generateVideo(script: string, userId: string): Promise<{ videoId: string; status: string } | null> {
    if (!this.apiKey) {
      // Mock video generation for development
      return {
        videoId: `mock_video_${Date.now()}`,
        status: 'generating'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          replica_id: 'default_replica',
          script,
          background: 'office',
          properties: {
            user_id: userId,
            personalization: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        videoId: data.video_id,
        status: data.status
      };
    } catch (error) {
      console.error('Failed to generate video:', error);
      return null;
    }
  }

  async getVideoStatus(videoId: string): Promise<{ status: string; videoUrl?: string } | null> {
    if (videoId.startsWith('mock_video_')) {
      // Mock video status for development
      return {
        status: 'completed',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      };
    }

    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/videos/${videoId}`, {
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        status: data.status,
        videoUrl: data.download_url
      };
    } catch (error) {
      console.error('Failed to get video status:', error);
      return null;
    }
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
}

export const tavusService = new TavusService();