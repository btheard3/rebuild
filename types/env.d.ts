declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_REVENUECAT_API_KEY: string;
      EXPO_PUBLIC_ELEVENLABS_API_KEY: string;
      EXPO_PUBLIC_TAVUS_API_KEY: string;
      EXPO_PUBLIC_ALGONODE_API_URL: string;
      EXPO_PUBLIC_ALGONODE_INDEXER_URL: string;
      EXPO_PUBLIC_ANALYTICS_API_URL: string;
    }
  }
}

// Ensure this file is treated as a module
export {};