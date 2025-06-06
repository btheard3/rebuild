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
  }): string {
    const { name = 'there', disasterType = 'disaster', daysSinceDisaster = 0, immediateNeeds = [], recentProgress = [] } = userData;

    let script = `Hello ${name}, I hope you're doing well today. `;

    if (daysSinceDisaster > 0) {
      script += `I know it's been ${daysSinceDisaster} days since the ${disasterType}, and I want you to know that your strength in facing each day is truly remarkable. `;
    }

    if (recentProgress.length > 0) {
      script += `I've noticed you've made some important progress recently - ${recentProgress.join(', ')}. These steps, no matter how small they might seem, are building blocks toward your recovery. `;
    }

    if (immediateNeeds.length > 0) {
      script += `I see you're working on addressing your immediate needs like ${immediateNeeds.join(' and ')}. Remember, it's okay to take things one step at a time. `;
    }

    script += `You're not alone in this journey. Every day you choose to move forward, you're showing incredible resilience. Take care of yourself today, and remember that healing isn't linear - it's okay to have difficult moments. You're doing better than you think.`;

    return script;
  }
}

export const tavusService = new TavusService();