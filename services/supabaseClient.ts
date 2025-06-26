import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { analyticsService } from './analyticsService';

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Enhanced error handling and validation
const validateEnvironmentVariables = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Supabase environment variables missing. Some features may not work.'
    );
    return false;
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    console.error('Invalid Supabase URL format:', supabaseUrl);
    return false;
  }

  // Validate anon key format (basic check)
  if (!supabaseAnonKey.includes('.') || supabaseAnonKey.length < 10) {
    console.error('Invalid Supabase anon key format');
    return false;
  }

  return true;
};

// Create mock client for development/testing
const createMockClient = () => {
  console.warn('⚠️ Using mock Supabase client - some features will be limited');
  
  return {
    auth: {
      signUp: async (credentials: any) => {
        console.log('Mock signUp:', credentials.email);
        return {
          data: {
            user: {
              id: 'mock-user-id',
              email: credentials.email,
              user_metadata: { full_name: credentials.options?.data?.full_name },
            },
            session: { access_token: 'mock-token' },
          },
          error: null,
        };
      },
      signInWithPassword: async (credentials: any) => {
        console.log('Mock signIn:', credentials.email);
        return {
          data: {
            user: {
              id: 'mock-user-id',
              email: credentials.email,
              user_metadata: { full_name: 'Mock User' },
            },
            session: { access_token: 'mock-token' },
          },
          error: null,
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
              unsubscribe: () => console.log('Mock auth listener unsubscribed'),
            },
          },
        };
      },
      getUser: async () => {
        console.log('Mock getUser');
        return { data: { user: null }, error: null };
      },
    },
    from: (table: string) => ({
      select: (columns?: string) => {
        console.log(`Mock select from ${table}${columns ? ` (${columns})` : ''}`);
        return {
          eq: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null }),
              single: () => Promise.resolve({ data: null, error: null }),
            }),
            single: () => Promise.resolve({ data: null, error: null }),
          }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
          limit: () => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
          then: (callback: any) => Promise.resolve(callback({ data: [], error: null })),
        };
      },
      insert: (values: any) => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'mock-id', ...values[0] }, error: null }),
        }),
        then: (callback: any) => Promise.resolve(callback({ data: values, error: null })),
      }),
      update: (values: any) => ({
        eq: () => Promise.resolve({ data: values, error: null }),
        match: () => Promise.resolve({ data: values, error: null }),
        then: (callback: any) => Promise.resolve(callback({ data: values, error: null })),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
        match: () => Promise.resolve({ data: null, error: null }),
        then: (callback: any) => Promise.resolve(callback({ data: null, error: null })),
      }),
    }),
    channel: (name: string) => ({
      on: () => ({
        subscribe: () => {
          console.log(`Mock subscription to channel ${name}`);
          return {
            unsubscribe: () => console.log(`Mock unsubscribe from channel ${name}`),
          };
        },
      }),
    }),
    removeChannel: () => {},
    rpc: (fn: string, params?: any) => {
      console.log(`Mock RPC call to ${fn}`, params);
      return Promise.resolve({ data: null, error: null });
    },
  };
};

// Initialize Supabase client with error handling
let supabase: any;
let isRealClient = false;

try {
  if (validateEnvironmentVariables() && supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
      global: {
        headers: {
          'x-application-name': 'rebuild-app',
          'x-application-version': '1.0.0',
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    
    isRealClient = true;
    console.log('✅ Supabase client initialized successfully');
    
    // Track successful initialization
    analyticsService.trackEvent('supabase_client_initialized', {
      is_real_client: true,
    });
  } else {
    console.warn('⚠️ Using mock Supabase client due to missing/invalid environment variables');
    supabase = createMockClient();
    
    // Track mock client usage
    analyticsService.trackEvent('supabase_client_initialized', {
      is_real_client: false,
      reason: 'invalid_config',
    });
  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error);
  supabase = createMockClient();
  
  // Track initialization failure
  analyticsService.trackEvent('supabase_client_initialization_failed', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
}

// Export the client and utility functions
export { supabase };

// Utility function to check if we're using the real client
export const isRealSupabaseClient = () => isRealClient;

// Health check function with timeout
export const checkSupabaseConnection = async (timeoutMs = 5000): Promise<boolean> => {
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Connection check timed out'));
      }, timeoutMs);
    });

    // Create the actual health check promise
    const healthCheckPromise = supabase.auth.getSession();

    // Race the promises
    const { error } = await Promise.race([healthCheckPromise, timeoutPromise]);
    
    if (error) {
      console.error('Supabase connection error:', error);
      
      // Track connection error
      analyticsService.trackEvent('supabase_connection_error', {
        error: error.message,
      });
      
      return false;
    }
    
    console.log('✅ Supabase connection healthy');
    return true;
  } catch (error) {
    console.error('❌ Supabase health check failed:', error);
    
    // Track health check failure
    analyticsService.trackEvent('supabase_health_check_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return false;
  }
};

// Retry mechanism for Supabase operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};