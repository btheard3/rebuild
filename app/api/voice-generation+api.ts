import { elevenLabsService } from '@/services/elevenLabsService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, mood } = body;

    if (!text) {
      return Response.json({ 
        success: false, 
        message: 'Text content is required' 
      }, { status: 400 });
    }

    // Select voice based on mood if provided
    let voiceId = 'ThT5KcBeYPX3keUQqHPh'; // Default professional voice
    
    if (mood) {
      // Map moods to appropriate voices
      const moodVoiceMap: Record<string, string> = {
        supportive: 'ThT5KcBeYPX3keUQqHPh', // Professional male
        hopeful: 'z9fAnlkpzviPz146aGWa',    // Warm female
        encouraging: 'g5NXKGTGzHgQoEUYLXUX', // Energetic male
        empathetic: 'z9fAnlkpzviPz146aGWa',  // Warm female
        motivational: 'g5NXKGTGzHgQoEUYLXUX' // Energetic male
      };
      
      voiceId = moodVoiceMap[mood] || voiceId;
    }

    // Generate audio using ElevenLabs
    const audioUrl = await elevenLabsService.generateSpeech(text, voiceId);
    
    return Response.json({
      success: true,
      audioUrl
    });
  } catch (error) {
    console.error('Voice generation error:', error);
    return Response.json({ 
      success: false, 
      message: 'Voice generation failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}