// @services/supabaseService.ts
import { supabase } from '@/lib/supabase';

export const supabaseService = {
  async saveVideoLog({
    userId,
    videoUrl,
    script,
  }: {
    userId: string;
    videoUrl: string;
    script: string;
  }) {
    const { data, error } = await supabase
      .from('video_logs')
      .insert([{ user_id: userId, video_url: videoUrl, script }]);

    if (error) throw error;
    return data;
  },
};
