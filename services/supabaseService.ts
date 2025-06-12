// @services/supabaseService.ts
import { supabase } from '@/services/supabase';

export const supabaseService = {
  async saveVideoLog({
    userId,
    videoUrl,
    script,
    mood,
    journalEntry
  }: {
    userId: string;
    videoUrl: string;
    script: string;
    mood?: string;
    journalEntry?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('ai_video_checkins')
        .insert([{
          user_id: userId,
          video_id: `video_${Date.now()}`,
          script,
          mood,
          video_url: videoUrl,
          status: 'completed',
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
      console.error('Failed to save video log:', error);
      throw error;
    }
  },

  async getVideoHistory(userId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('ai_video_checkins')
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
      console.error('Failed to get video history:', error);
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