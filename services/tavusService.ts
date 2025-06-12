import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_TAVUS_API_KEY;
const BASE_URL = 'https://api.tavus.io/v2';

if (!API_KEY) {
  throw new Error(
    'TAVUS API key missing from .env (EXPO_PUBLIC_TAVUS_API_KEY)'
  );
}

export const tavusService = {
  async generateVideo(prompt: string, userId: string): Promise<string> {
    try {
      // 1. Create video from script using replica
      const createRes = await axios.post(
        `${BASE_URL}/videos`,
        {
          replica_id: 'rb17cf590e15',
          script: prompt,
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const videoId = createRes.data?.video_id;
      if (!videoId) throw new Error('No video_id returned from Tavus');

      // 2. Poll until video is ready
      let attempts = 0;
      const maxAttempts = 10;
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

      while (attempts < maxAttempts) {
        const statusRes = await axios.get(`${BASE_URL}/videos/${videoId}`, {
          headers: { Authorization: `Bearer ${API_KEY}` },
        });

        const { status, video_url } = statusRes.data;
        console.log(`Status: ${status} | Attempt ${attempts + 1}`);

        if (status === 'completed' && video_url) {
          return video_url;
        }

        if (status === 'failed')
          throw new Error('Tavus video generation failed.');
        await delay(4000);
        attempts++;
      }

      throw new Error('Timed out waiting for video generation.');
    } catch (err: any) {
      console.error('Tavus error:', err.response?.data || err.message);
      throw new Error('Failed to generate video from Tavus.');
    }
  },
};
