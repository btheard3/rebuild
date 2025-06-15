// services/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Expo-compatible env variable loading
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL or Anon Key is missing in environment variables!'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
