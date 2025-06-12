// services/tavusService.ts

export interface TavusRequest {
  email: string;
  name: string;
  script: string;
}

export interface TavusResponse {
  video_url: string;
}

export const tavusService = {
  async generateVideo({
    email,
    name,
    script,
  }: TavusRequest): Promise<TavusResponse> {
    try {
      const response = await fetch('https://api.tavus.io/api/v1/videos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_TAVUS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: process.env.EXPO_PUBLIC_TAVUS_TEMPLATE_ID,
          user_email: email,
          variables: { name, script },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Tavus error:', data);
        throw new Error(data.message || 'Failed to generate Tavus video');
      }

      return { video_url: data.video_url };
    } catch (error) {
      console.error('Tavus API exception:', error);
      throw error;
    }
  },
};
