// @services/tavusService.ts
import axios from 'axios';

const TAVUS_API_URL = 'https://api.tavus.io/api/v1/videos';

export const tavusService = {
  async generateVideo(prompt: string, userId?: string): Promise<string | null> {
    try {
      // For development/demo purposes, we'll simulate the Tavus API call
      // In production, you would use your actual Tavus API key
      const apiKey = process.env.EXPO_PUBLIC_TAVUS_API_KEY;
      
      if (!apiKey || apiKey.includes('placeholder')) {
        console.log('🎬 Simulating Tavus video generation for:', prompt);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Return a demo video URL for testing
        return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      }

      const response = await axios.post(
        TAVUS_API_URL,
        {
          template_id: process.env.EXPO_PUBLIC_TAVUS_TEMPLATE_ID,
          variables: {
            script: prompt,
            user_id: userId || 'demo-user'
          },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data?.video_url || null;
    } catch (error) {
      console.error('Tavus API error:', error);
      throw new Error('Failed to generate video');
    }
  },

  generateEmergencyAlertScript(alertData: {
    alertText: string;
    severity: string;
    location?: string;
    timestamp: Date;
    instructions: string[];
  }): string {
    const { alertText, severity, location, instructions } = alertData;
    
    let script = `This is an ${severity} emergency alert. ${alertText}`;
    
    if (location) {
      script += ` This alert affects the ${location} area.`;
    }
    
    if (instructions.length > 0) {
      script += ' Please follow these safety instructions: ';
      script += instructions.join('. ') + '.';
    }
    
    script += ' Stay safe and follow official guidance from local authorities.';
    
    return script;
  }
};