// @services/supabaseService.ts
import { supabase } from '@/services/supabaseClient';

export const supabaseService = {
  async saveVoiceInteraction({
    userId,
    script,
    mood,
    audioUrl,
    journalEntry
  }: {
    userId: string;
    script: string;
    mood?: string;
    audioUrl?: string;
    journalEntry?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('ai_voice_interactions')
        .insert([{
          user_id: userId,
          interaction_type: 'affirmation',
          input_text: script,
          audio_url: audioUrl,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to save voice interaction:', error);
      throw error;
    }
  },

  async getVoiceHistory(userId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('ai_voice_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get voice history:', error);
      return [];
    }
  },

  async saveWellnessEntry({
    userId,
    entryType,
    mood,
    content
  }: {
    userId: string;
    entryType: 'journal' | 'mood' | 'meditation' | 'affirmation';
    mood?: string;
    content?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('wellness_entries')
        .insert([{
          user_id: userId,
          entry_type: entryType,
          mood,
          content,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to save wellness entry:', error);
      throw error;
    }
  },

  calculatePriorityScore(planData: any): number {
    let score = 0;
    
    // Base score for disaster type severity
    const disasterScores: Record<string, number> = {
      hurricane: 8,
      flood: 7,
      fire: 9,
      earthquake: 8,
      tornado: 7,
      other: 5
    };
    
    score += disasterScores[planData.disasterType] || 5;
    
    // Family size factor
    const familySize = planData.personalInfo?.familySize || 1;
    if (familySize > 1) {
      score += Math.min(familySize - 1, 5); // Cap at +5 for large families
    }
    
    // Insurance status
    if (!planData.insurance?.hasInsurance) {
      score += 3; // Higher priority if no insurance
    }
    
    // Immediate needs count
    const needsCount = planData.immediateNeeds ? 
      Object.values(planData.immediateNeeds).filter(Boolean).length : 0;
    score += Math.min(needsCount, 5); // Cap at +5 for many needs
    
    return Math.min(score, 10); // Cap total score at 10
  },

  async saveRecoveryPlanToDb({
    userId,
    planData,
    aiRecommendations = []
  }: {
    userId: string;
    planData: any;
    aiRecommendations?: string[];
  }) {
    try {
      const priorityScore = this.calculatePriorityScore(planData);
      
      const { data, error } = await supabase
        .from('recovery_plans')
        .insert([{
          user_id: userId,
          disaster_type: planData.disasterType,
          personal_info: planData.personalInfo || {},
          insurance_info: planData.insurance || {},
          immediate_needs: planData.immediateNeeds || {},
          priority_score: priorityScore,
          recommendations: aiRecommendations,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return {
        success: true,
        planId: data.id,
        priorityScore: data.priority_score,
        recommendations: data.recommendations
      };
    } catch (error) {
      console.error('Failed to save recovery plan:', error);
      throw error;
    }
  }
};