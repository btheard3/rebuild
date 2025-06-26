// @services/openaiService.ts

interface OpenAIError extends Error {
  status?: number;
  code?: string;
}

export const openaiService = {
  async generateScript(journalEntry: string, mood?: string): Promise<string> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

      if (!apiKey || apiKey.includes('placeholder') || apiKey.startsWith('sk-...')) {
        console.log('🤖 OpenAI API key not configured, using mock response');
        
        // Simulate API delay for realistic UX
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        return this.generateMockScriptByMood(mood || 'default', journalEntry);
      }

      const moodContext = mood ? ` The person is feeling ${mood}.` : '';
      const prompt = `Convert the following journal entry into a warm, supportive 30-second voice message script for someone going through disaster recovery.${moodContext} Make it encouraging and personalized. Keep it under 150 words:\n\n"${journalEntry}"\n\nScript:`;

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini', // Use more cost-effective model
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 200,
            presence_penalty: 0.1,
            frequency_penalty: 0.1,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`) as OpenAIError;
        error.status = response.status;

        // Handle specific error cases
        if (response.status === 401) {
          error.message =
            'Invalid OpenAI API key. Please check your configuration.';
        } else if (response.status === 429) {
          error.message = 'Rate limit exceeded. Please try again in a moment.';
        } else if (response.status === 422) {
          error.message = 'Invalid request. Please check your text input.';
        }

        throw error;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      
      if (!content) {
        throw new Error('No content received from OpenAI API');
      }

      return content;
    } catch (error) {
      console.error('OpenAI script generation error:', error);
      
      // Provide fallback response for better UX
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new Error('Service temporarily busy. Please try again in a moment.');
        } else if (error.message.includes('quota')) {
          throw new Error('Service quota exceeded. Please try again later.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network connection issue. Please check your internet connection.');
        }
      }
      
      // Return mock response as fallback
      console.log('Falling back to mock response due to API error');
      return this.generateMockScriptByMood(mood || 'default', journalEntry);
    }
  },

  async generateRecoveryRecommendations(planData: any): Promise<string[]> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

      if (!apiKey || apiKey.includes('placeholder') || apiKey.startsWith('sk-...')) {
        console.log('🤖 OpenAI API key not configured, using mock recommendations');
        
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        return this.generateMockRecommendations(planData);
      }

      const prompt = `Generate 5-7 specific, actionable recovery recommendations for someone affected by a ${planData.disasterType}. 

Context:
- Disaster Type: ${planData.disasterType}
- Family Size: ${planData.personalInfo?.familySize || 1}
- Has Insurance: ${planData.insurance?.hasInsurance ? 'Yes' : 'No'}
- Insurance Provider: ${planData.insurance?.provider || 'None'}
- Immediate Needs: ${Object.entries(planData.immediateNeeds || {})
  .filter(([key, value]) => value === true)
  .map(([key]) => key)
  .join(', ') || 'None specified'}

Provide practical, prioritized recommendations that are specific to their situation. Each recommendation should be actionable and include specific next steps. Format as a JSON array of strings. Keep each recommendation under 100 characters.`;

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 800,
            response_format: { type: "json_object" },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      
      if (!content) {
        throw new Error('No content received from OpenAI API');
      }

      try {
        const parsed = JSON.parse(content);
        if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
          return parsed.recommendations.slice(0, 7);
        } else if (Array.isArray(parsed)) {
          return parsed.slice(0, 7);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (parseError) {
        // If JSON parsing fails, try to extract recommendations from text
        const lines = content.split('\n')
          .filter((line: string) => line.trim().length > 0)
          .map((line: string) => line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim())
          .filter((line: string) => line.length > 10)
          .slice(0, 7);
        
        return lines.length > 0 ? lines : this.generateMockRecommendations(planData);
      }
    } catch (error) {
      console.error('OpenAI recommendations error:', error);
      
      // Always provide fallback recommendations
      return this.generateMockRecommendations(planData);
    }
  },

  generateMockScriptByMood(mood: string, journalEntry: string): string {
    const scripts = {
      supportive: `Hi! I can see you're going through a challenging time right now. I want you to know that your feelings are completely valid, and it's okay to take things one step at a time. Remember that recovery isn't linear, and each small step forward is a victory worth celebrating. You're showing incredible resilience, and I'm here to support you through this journey. Keep focusing on what you can control, and don't hesitate to reach out for help when you need it. You're not alone in this.`,

      hopeful: `Hello! I see the hope in your words, even amid the challenges you're facing. That spark of optimism is so powerful and will help carry you through this recovery process. Better days are ahead, and the strength you're showing now is building a foundation for your future. Keep nurturing that hope - it's not just wishful thinking, but a genuine force for healing and growth. I believe in your ability to rebuild and create something beautiful from this experience.`,

      encouraging: `Hey there! I want to acknowledge the incredible courage you're showing in this difficult situation. You've already overcome so much, and that resilience will continue to serve you well. Remember that every challenge you face is developing your strength and character. You have what it takes to get through this, and each step forward, no matter how small, is progress worth celebrating. Keep going - I'm cheering for you every step of the way!`,

      empathetic: `I hear you, and I want you to know that what you're feeling is completely understandable. Disaster recovery is an emotional rollercoaster, and it's okay to have good days and bad days. Your feelings are valid, whether you're experiencing grief, frustration, or moments of hope. Be gentle with yourself during this process. You're doing the best you can with the circumstances you've been given, and that's more than enough. I'm here with you through all of it.`,

      motivational: `It's time to harness your inner strength and take action! You have the power to rebuild and create an even stronger foundation than before. Focus on setting small, achievable goals each day that move you forward on your recovery journey. Celebrate those victories, learn from the setbacks, and keep your eyes on the future you're working to create. You've got this! Every action you take is a building block toward your renewed life and well-being.`,

      default: `Thank you for sharing your thoughts with me today. I want you to know that your experiences matter, and you're showing remarkable strength during this challenging time. Recovery is a journey with ups and downs, but each day brings new opportunities for healing and growth. Remember to be patient with yourself and acknowledge the progress you're making, even when it feels small. You have a community of support around you, and better days are ahead. Keep taking one step at a time - you're doing great.`,
    };

    return scripts[mood as keyof typeof scripts] || scripts.default;
  },

  generateMockRecommendations(planData: any): string[] {
    const baseRecommendations = [
      'Contact FEMA at 1-800-621-3362 to apply for Individual Assistance within 60 days',
      'Document all damage with photos and videos before beginning cleanup',
      'Keep detailed records of all disaster-related expenses and receipts',
    ];

    const disasterSpecific: Record<string, string[]> = {
      hurricane: [
        'Apply for SBA disaster loans at disasterloanassistance.sba.gov',
        'Contact your insurance company immediately to file wind and water damage claims',
        'Register with local emergency management for utility restoration updates',
      ],
      flood: [
        'Contact the National Flood Insurance Program if you have flood coverage',
        'Have your home professionally inspected for mold and structural damage',
        'Apply for SBA disaster loans specifically for flood damage repair',
      ],
      fire: [
        'Contact your homeowner\'s insurance immediately for fire damage claims',
        'Register with local authorities for debris removal services',
        'Apply for temporary housing assistance through FEMA',
      ],
      earthquake: [
        'Have your home inspected by a structural engineer before re-occupying',
        'Contact your earthquake insurance provider if you have coverage',
        'Apply for SBA disaster loans for earthquake-specific repairs',
      ],
      tornado: [
        'Contact your homeowner\'s insurance for wind damage claims',
        'Register for debris removal services with local emergency management',
        'Apply for FEMA assistance for temporary housing and repairs',
      ],
    };

    const needsSpecific: Record<string, string> = {
      shelter: 'Contact the Red Cross at 1-800-733-2767 for emergency shelter assistance',
      food: 'Locate nearby food banks and emergency food distribution centers through 211',
      medical: 'Find mobile medical clinics and disaster health services in your area',
      utilities: 'Contact utility companies to report outages and get restoration timelines',
      transportation: 'Apply for disaster-related transportation assistance through local services',
    };

    const insuranceRecommendations = planData.insurance?.hasInsurance
      ? [
          `Contact ${planData.insurance.provider || 'your insurance company'} immediately`,
          'Request an adjuster inspection as soon as possible to assess damage',
          'Keep detailed records of all communications with your insurance company',
        ]
      : [
          'Apply for FEMA Individual Assistance as your primary source of disaster aid',
          'Look into local disaster relief programs and community assistance funds',
          'Consider applying for SBA disaster loans for low-interest recovery funding',
        ];

    const selectedRecommendations = [
      ...baseRecommendations,
      ...(disasterSpecific[planData.disasterType] || []),
      ...insuranceRecommendations.slice(0, 2),
    ];

    // Add needs-specific recommendations
    if (planData.immediateNeeds) {
      Object.entries(planData.immediateNeeds)
        .filter(([key, value]) => value === true && needsSpecific[key])
        .forEach(([key]) => {
          selectedRecommendations.push(needsSpecific[key]);
        });
    }

    return selectedRecommendations.slice(0, 7);
  },
};