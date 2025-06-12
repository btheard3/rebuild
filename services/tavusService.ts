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

  generateEmergencyAlertScript({
    alertText,
    severity,
    location,
    timestamp,
    instructions
  }: {
    alertText: string;
    severity: string;
    location?: string;
    timestamp: Date;
    instructions: string[];
  }): string {
    const urgencyLevel = severity === 'critical' ? 'URGENT' : severity.toUpperCase();
    const locationText = location ? ` in the ${location} area` : '';
    const timeText = timestamp.toLocaleTimeString();
    
    let script = `${urgencyLevel} ALERT: ${alertText}${locationText}. `;
    
    if (instructions.length > 0) {
      script += 'Please take the following actions immediately: ';
      instructions.forEach((instruction, index) => {
        script += `${index + 1}. ${instruction}. `;
      });
    }
    
    script += `This alert was issued at ${timeText}. Stay safe and follow official guidance.`;
    
    return script;
  }
};