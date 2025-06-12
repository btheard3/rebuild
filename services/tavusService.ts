export const tavusService = {
  async generateVideo(
    script: string,
    userId?: string
  ): Promise<{ videoUrl: string }> {
    const response = await fetch('https://your-deployed-function-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_TAVUS_API_KEY}`,
      },
      body: JSON.stringify({
        script,
        template_id: process.env.EXPO_PUBLIC_TAVUS_TEMPLATE_ID,
        user_id: userId,
      }),
    });

    const result = await response.json();
    return { videoUrl: result.video_url };
  },
};
