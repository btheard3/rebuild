import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { supabase, isRealSupabaseClient } from '@/services/supabaseClient';
import { revenueCatService } from '@/services/revenueCatService';
import { analyticsService } from '@/services/analyticsService';

type User = {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  updatePremiumStatus: (isPremium: boolean) => void;
  getCurrentUser: () => Promise<User | null>;
  isAuthenticated: boolean;
  isRealAuth: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Secure store adapter for cross-platform compatibility
const secureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isRealAuth = isRealSupabaseClient();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Initialize RevenueCat
      await revenueCatService.initialize();
      
      // Load user from storage or Supabase session
      await loadUser();
      
      // Set up auth state listener
      handleAuthStateChange();
      
      // Set up RevenueCat listener for subscription changes
      revenueCatService.onCustomerInfoUpdated((customerInfo) => {
        const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
        updatePremiumStatus(isPremium);
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      analyticsService.trackError('auth_initialization_failed', 'AuthContext', { 
        error: error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthStateChange = () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          const userData = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email,
            isPremium: false
          };
          
          // Check premium status from RevenueCat
          try {
            const customerInfo = await revenueCatService.getCustomerInfo();
            if (customerInfo) {
              userData.isPremium = customerInfo.entitlements.active['premium'] !== undefined;
            }
          } catch (error) {
            console.warn('Failed to get premium status:', error);
          }
          
          setUser(userData);
          await secureStoreAdapter.setItem('user', JSON.stringify(userData));
          
          analyticsService.trackEvent('auth_state_changed', { 
            event, 
            user_id: userData.id,
            email: userData.email 
          });
        } else {
          setUser(null);
          await secureStoreAdapter.deleteItem('user');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  };

  const loadUser = async () => {
    try {
      // First, try to get current session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session?.user && !error) {
        const userData = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          isPremium: false
        };
        
        // Check premium status
        try {
          const customerInfo = await revenueCatService.getCustomerInfo();
          if (customerInfo) {
            userData.isPremium = customerInfo.entitlements.active['premium'] !== undefined;
          }
        } catch (error) {
          console.warn('Failed to get premium status:', error);
        }
        
        setUser(userData);
        await secureStoreAdapter.setItem('user', JSON.stringify(userData));
        return;
      }
      
      // Fallback to stored user data
      const userString = await secureStoreAdapter.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);
        setUser(userData);
        
        // Verify premium status if we have a real connection
        if (isRealAuth) {
          try {
            const customerInfo = await revenueCatService.getCustomerInfo();
            if (customerInfo) {
              const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
              if (userData.isPremium !== isPremium) {
                updatePremiumStatus(isPremium);
              }
            }
          } catch (error) {
            console.warn('Failed to verify premium status:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      analyticsService.trackError('auth_load_user_failed', 'AuthContext', { 
        error: error.message 
      });
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        const userData = {
          id: data.user.id,
          name: name,
          email: email,
          isPremium: false
        };
        
        setUser(userData);
        await secureStoreAdapter.setItem('user', JSON.stringify(userData));
        
        analyticsService.trackEvent('user_sign_up', { 
          email, 
          method: 'email_password',
          is_real_auth: isRealAuth 
        });
      }
    } catch (error) {
      console.error('Error signing up:', error);
      analyticsService.trackError('auth_sign_up_failed', 'AuthContext', { 
        email, 
        error: error.message 
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        const userData = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          email: email,
          isPremium: false
        };
        
        // Check premium status
        try {
          const customerInfo = await revenueCatService.getCustomerInfo();
          if (customerInfo) {
            userData.isPremium = customerInfo.entitlements.active['premium'] !== undefined;
          }
        } catch (error) {
          console.warn('Failed to get premium status during sign in:', error);
        }
        
        setUser(userData);
        await secureStoreAdapter.setItem('user', JSON.stringify(userData));
        
        analyticsService.trackEvent('user_sign_in', { 
          email, 
          method: 'email_password',
          is_real_auth: isRealAuth 
        });
      }
    } catch (error) {
      console.error('Error signing in:', error);
      analyticsService.trackError('auth_sign_in_failed', 'AuthContext', { 
        email, 
        error: error.message 
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }
      
      setUser(null);
      await secureStoreAdapter.deleteItem('user');
      
      analyticsService.trackEvent('user_sign_out', { is_real_auth: isRealAuth });
    } catch (error) {
      console.error('Error signing out:', error);
      analyticsService.trackError('auth_sign_out_failed', 'AuthContext', { 
        error: error.message 
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentUser = async (): Promise<User | null> => {
    try {
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
      
      if (error || !supabaseUser) {
        return null;
      }
      
      const userData = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
        email: supabaseUser.email || '',
        isPremium: false
      };
      
      // Check premium status
      try {
        const customerInfo = await revenueCatService.getCustomerInfo();
        if (customerInfo) {
          userData.isPremium = customerInfo.entitlements.active['premium'] !== undefined;
        }
      } catch (error) {
        console.warn('Failed to get premium status:', error);
      }
      
      return userData;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };

  const updatePremiumStatus = async (isPremium: boolean) => {
    if (user) {
      const updatedUser = { ...user, isPremium };
      setUser(updatedUser);
      await secureStoreAdapter.setItem('user', JSON.stringify(updatedUser));
      
      analyticsService.trackEvent('premium_status_changed', { 
        isPremium, 
        userId: user.id,
        is_real_auth: isRealAuth 
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      signIn, 
      signOut, 
      signUp, 
      updatePremiumStatus,
      getCurrentUser,
      isAuthenticated: !!user,
      isRealAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};