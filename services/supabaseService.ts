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
  }
};