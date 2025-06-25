// This file is kept for reference but is no longer used in the application
// All video generation functionality has been removed

import { analyticsService } from './analyticsService';

class TavusService {
  // This service is no longer used as video functionality has been removed
  
  async saveVideoToSupabase(
    userId: string,
    videoId: string,
    script: string,
    mood: string,
    videoUrl: string,
    journalEntry?: string
  ): Promise<boolean> {
    console.warn('TavusService is deprecated and no longer used');
    return false;
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    return false;
  }
}

// Export an instance but mark as deprecated
export const tavusService = new TavusService();