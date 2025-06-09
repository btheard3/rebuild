// services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Expo requires these to be prefixed with EXPO_PUBLIC_ in .env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Enhanced error handling and validation
const validateEnvironmentVariables = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables missing. Some features may not work.');
    return false;
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    console.error('Invalid Supabase URL format:', supabaseUrl);
    return false;
  }

  // Validate anon key format (basic JWT structure check)
  if (!supabaseAnonKey.includes('.')) {
    console.error('Invalid Supabase anon key format');
    return false;
  }

  return true;
};

// Create mock client for development/testing
const createMockClient = () => ({
  auth: {
    signUp: async (credentials: any) => {
      console.log('Mock signUp:', credentials.email);
      return { 
        data: { 
          user: { 
            id: 'mock-user-id', 
            email: credentials.email,
            user_metadata: { full_name: credentials.options?.data?.full_name }
          }, 
          session: { access_token: 'mock-token' } 
        }, 
        error: null 
      };
    },
    signInWithPassword: async (credentials: any) => {
      console.log('Mock signIn:', credentials.email);
      return { 
        data: { 
          user: { 
            id: 'mock-user-id', 
            email: credentials.email,
            user_metadata: { full_name: 'Mock User' }
          }, 
          session: { access_token: 'mock-token' } 
        }, 
        error: null 
      };
    },
    signOut: async () => {
      console.log('Mock signOut');
      return { error: null };
    },
    getSession: async () => {
      console.log('Mock getSession');
      return { data: { session: null }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      console.log('Mock onAuthStateChange listener added');
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => console.log('Mock auth listener unsubscribed') 
          } 
        } 
      };
    },
    getUser: async () => {
      console.log('Mock getUser');
      return { data: { user: null }, error: null };
    },
  },
  from: (table: string) => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
  }),
  channel: (name: string) => ({
    on: () => ({ subscribe: () => {} }),
  }),
  removeChannel: () => {},
});

// Initialize Supabase client
let supabase: any;

if (validateEnvironmentVariables() && supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Configure auth settings for better mobile experience
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
    console.log('✅ Supabase client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    supabase = createMockClient();
  }
} else {
  console.warn('⚠️ Using mock Supabase client due to missing/invalid environment variables');
  supabase = createMockClient();
}

// Export the client and utility functions
export { supabase };

// Utility function to check if we're using the real client
export const isRealSupabaseClient = () => {
  return validateEnvironmentVariables() && supabaseUrl && supabaseAnonKey;
};

// Health check function
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    console.log('✅ Supabase connection healthy');
    return true;
  } catch (error) {
    console.error('❌ Supabase health check failed:', error);
    return false;
  }
};