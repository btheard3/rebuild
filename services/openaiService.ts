// @services/openaiService.ts

export const openaiService = {
  async generateScript(journalEntry: string, mood?: string): Promise<string> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

      if (!apiKey || apiKey.includes('placeholder')) {
        console.log('🤖 Simulating OpenAI script generation for journal entry');

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Return a demo script based on mood or content
        if (mood) {
          return this.generateMockScriptByMood(mood, journalEntry);
        }

        return `Hi there! I wanted to check in with you today. Based on your recent thoughts, it sounds like you're navigating some important feelings. Remember that every step forward in your recovery journey matters, no matter how small. You're showing incredible strength by taking time to reflect and process your experiences. Keep taking things one day at a time, and know that support is always available when you need it.`;
      }

      const moodContext = mood ? ` The person is feeling ${mood}.` : '';
      const prompt = `Convert the following journal entry into a warm, supportive 30-second voice message script for someone going through disaster recovery.${moodContext} Make it encouraging and personalized:\n\n"${journalEntry}"\n\nScript:`;

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 200,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return (
        data.choices?.[0]?.message?.content?.trim() ||
        'Unable to generate script at this time.'
      );
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate script');
    }
  },

  async generateRecoveryRecommendations(planData: any): Promise<string[]> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

      if (!apiKey || apiKey.includes('placeholder')) {
        console.log('🤖 Simulating OpenAI recovery recommendations');
        
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

Provide practical, prioritized recommendations that are specific to their situation. Each recommendation should be actionable and include specific next steps. Format as a JSON array of strings.`;

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 500,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      
      try {
        return JSON.parse(content);
      } catch {
        // If JSON parsing fails, split by lines and clean up
        return content.split('\n')
          .filter((line: string) => line.trim().length > 0)
          .map((line: string) => line.replace(/^[-•*]\s*/, '').trim())
          .slice(0, 7);
      }
    } catch (error) {
      console.error('OpenAI recommendations error:', error);
      return this.generateMockRecommendations(planData);
    }
  },

  generateMockScriptByMood(mood: string, journalEntry: string): string {
    const scripts = {
      great: `Hi! I can see you're feeling really positive today, and that's wonderful to see. Your resilience is truly inspiring. Based on what you've shared, it sounds like you're making real progress in your recovery journey. Keep celebrating these victories, both big and small. Your positive energy is not only helping you heal, but it's also a beacon of hope for others who might be struggling. Keep up the amazing work!`,

      good: `Hello! It's great to hear that you're having a good day. Your steady progress and positive outlook are really encouraging to see. From your recent reflections, it's clear that you're taking thoughtful steps forward in your recovery. Remember that these good days are a testament to your strength and the work you're putting in. Keep building on this momentum, and don't forget to acknowledge how far you've come.`,

      okay: `Hi there. I can sense that today feels pretty balanced for you - not amazing, but not terrible either. That's completely normal and valid in recovery. From what you've shared, it sounds like you're processing things thoughtfully. Remember that okay days are still progress days. You're showing up, you're reflecting, and you're moving forward. That takes courage, and I want you to know that your efforts matter.`,

      sad: `Hello, and thank you for sharing what's on your heart today. I can hear that you're going through a difficult time right now, and I want you to know that it's okay to feel sad. Your feelings are valid, and it's actually a sign of strength that you're acknowledging them. Recovery isn't linear, and having tough days doesn't mean you're not making progress. You're not alone in this journey, and brighter days will come. Take things one moment at a time.`,

      stressed: `Hi, I can sense that you're feeling overwhelmed right now, and I want you to know that what you're experiencing is completely understandable. Recovery can feel like a lot to handle sometimes. From your thoughts today, it's clear you're dealing with multiple challenges, but remember - you don't have to tackle everything at once. Take a deep breath. Focus on just the next small step. You've overcome difficulties before, and you have the strength to get through this too. Support is available when you need it.`,

      anxious: `Hello, I can feel the worry in your words today, and I want you to know that anxiety is a normal part of the recovery process. It's your mind's way of trying to protect you, even when it feels overwhelming. From what you've shared, it sounds like you're facing some uncertainties, and that's really hard. Remember to breathe deeply, focus on what you can control today, and trust that you're building resilience with each challenge you face. You're stronger than your anxiety.`,

      default: `Hi there, thank you for taking the time to check in today. I can see you're processing a lot right now, and I want you to know that whatever you're feeling is completely valid. Recovery is a journey with ups and downs, and you're showing incredible courage by staying engaged with the process. Remember that every day you show up for yourself is a victory. You're not alone, and you're making progress even when it doesn't feel like it.`,
    };

    return scripts[mood as keyof typeof scripts] || scripts.default;
  },

  generateMockRecommendations(planData: any): string[] {
    const baseRecommendations = [
      'Contact FEMA at 1-800-621-3362 to apply for Individual Assistance within 60 days of the disaster declaration',
      'Document all damage with photos and videos before beginning any cleanup for insurance and FEMA claims',
      'Keep detailed records of all disaster-related expenses, including receipts for temporary lodging, food, and supplies',
    ];

    const disasterSpecific: Record<string, string[]> = {
      hurricane: [
        'Apply for SBA disaster loans for property damage and economic injury at disasterloanassistance.sba.gov',
        'Contact your insurance company immediately to file claims for wind and water damage',
        'Register with local emergency management for updates on utility restoration and debris removal',
      ],
      flood: [
        'Contact the National Flood Insurance Program if you have flood insurance coverage',
        'Have your home professionally inspected for mold and structural damage before re-entering',
        'Apply for SBA disaster loans specifically for flood damage repair and replacement',
      ],
      fire: [
        'Contact your homeowner\'s insurance immediately as fire damage claims are time-sensitive',
        'Register with local authorities for debris removal and hazardous material cleanup services',
        'Apply for temporary housing assistance through FEMA while your home is being rebuilt',
      ],
      earthquake: [
        'Have your home inspected by a structural engineer before re-occupying',
        'Contact your earthquake insurance provider if you have coverage',
        'Apply for SBA disaster loans for earthquake-specific structural repairs',
      ],
      tornado: [
        'Contact your homeowner\'s insurance for wind damage claims',
        'Register for debris removal services with local emergency management',
        'Apply for FEMA assistance for temporary housing and home repairs',
      ],
    };

    const needsSpecific: Record<string, string> = {
      shelter: 'Contact the Red Cross at 1-800-733-2767 for immediate emergency shelter assistance',
      food: 'Locate nearby food banks and emergency food distribution centers through 211',
      medical: 'Find mobile medical clinics and disaster health services in your area',
      utilities: 'Contact utility companies to report outages and get restoration timelines',
      transportation: 'Apply for disaster-related transportation assistance through local social services',
    };

    const insuranceRecommendations = planData.insurance?.hasInsurance
      ? [
          `Contact ${planData.insurance.provider || 'your insurance company'} immediately to file your claim`,
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