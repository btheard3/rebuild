import { openaiService } from '@/services/openaiService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, userId } = body;

    if (!text) {
      return Response.json({ 
        success: false, 
        message: 'Text content is required' 
      }, { status: 400 });
    }

    // Analyze sentiment using OpenAI
    const prompt = `
      Analyze the sentiment and emotional state in the following journal entry. 
      Provide a detailed analysis including:
      1. Primary emotion(s) detected
      2. Overall sentiment (positive, negative, or neutral)
      3. Key themes or concerns
      4. Emotional intensity (low, medium, high)
      5. Any signs of distress that might need attention
      6. A supportive response that acknowledges their feelings
      
      Journal entry: "${text}"
      
      Format the response as JSON with the following structure:
      {
        "primaryEmotions": ["emotion1", "emotion2"],
        "sentiment": "positive/negative/neutral",
        "sentimentScore": 0.0 to 1.0,
        "themes": ["theme1", "theme2"],
        "intensity": "low/medium/high",
        "concernFlags": ["flag1", "flag2"] or [],
        "supportiveResponse": "response text"
      }
    `;

    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey || apiKey.includes('YOUR_OPENAI_API_KEY_HERE')) {
      // Return mock data if API key is not configured
      return Response.json({
        success: true,
        analysis: {
          primaryEmotions: ["reflective", "hopeful"],
          sentiment: "neutral",
          sentimentScore: 0.6,
          themes: ["recovery", "resilience", "uncertainty"],
          intensity: "medium",
          concernFlags: [],
          supportiveResponse: "Thank you for sharing your thoughts. It sounds like you're navigating a challenging time with remarkable resilience. Your mixed feelings are completely normal during recovery, and it's important to acknowledge both your progress and your struggles. Remember that healing isn't linear, and each step forward matters, no matter how small it might seem."
        }
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    // Parse the JSON response
    const analysis = JSON.parse(analysisText);

    return Response.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    
    // Return a fallback analysis with error flag
    return Response.json({ 
      success: false, 
      message: 'Analysis failed', 
      error: error instanceof Error ? error.message : 'Unknown error',
      analysis: {
        primaryEmotions: ["unknown"],
        sentiment: "neutral",
        sentimentScore: 0.5,
        themes: ["recovery"],
        intensity: "medium",
        concernFlags: [],
        supportiveResponse: "Thank you for sharing your thoughts. I appreciate your openness and reflection."
      }
    }, { status: 500 });
  }
}