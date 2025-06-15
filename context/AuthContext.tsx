import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabaseClient';
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
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  updatePremiumStatus: (isPremium: boolean) => void;
  getCurrentUser: () => Promise<User | null>;
  isRealAuth: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cross-platform secure store
const secureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signUp = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw error;

    if (data.user) {
      const newUser = {
        id: data.user.id,
        name,
        email: data.user.email!,
        isPremium: true, // Set to true for testing
      };
      setUser(newUser);

      // Store user data securely
      await secureStoreAdapter.setItem('user_data', JSON.stringify(newUser));
      await secureStoreAdapter.setItem(
        'auth_token',
        data.session?.access_token || ''
      );
    }

    setIsLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    if (data.user) {
      const newUser = {
        id: data.user.id,
        name: data.user.user_metadata?.full_name || '',
        email: data.user.email!,
        isPremium: true, // Set to true for testing
      };
      setUser(newUser);

      // Store user data securely
      await secureStoreAdapter.setItem('user_data', JSON.stringify(newUser));
      await secureStoreAdapter.setItem(
        'auth_token',
        data.session?.access_token || ''
      );

      analyticsService.trackEvent('user_signed_in', { user_id: newUser.id });
    }

    setIsLoading(false);
  };

  const signOut = async () => {
    setIsLoading(true);

    try {
      // Track logout event
      analyticsService.trackEvent('user_signed_out', { user_id: user?.id });

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Supabase signout error:', error);
        // Continue with logout even if Supabase fails
      }

      // Clear all stored data
      await Promise.all([
        secureStoreAdapter.deleteItem('user_data'),
        secureStoreAdapter.deleteItem('auth_token'),
        secureStoreAdapter.deleteItem('gamification_data'),
        secureStoreAdapter.deleteItem('analytics_session_id'),
      ]);

      // Clear web storage if on web platform
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();

          // Clear any cached data
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
              cacheNames.map((cacheName) => caches.delete(cacheName))
            );
          }
        } catch (error) {
          console.warn('Failed to clear web storage:', error);
        }
      }

      // Clear user state
      setUser(null);

      // Show success message briefly
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Create a temporary success message
        const successMessage = document.createElement('div');
        successMessage.textContent = 'Successfully logged out';
        successMessage.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10B981;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          font-weight: 500;
          z-index: 10000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.3s ease-out;
        `;

        // Add animation keyframes
        if (!document.querySelector('#logout-animation-styles')) {
          const style = document.createElement('style');
          style.id = 'logout-animation-styles';
          style.textContent = `
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
              from { transform: translateX(0); opacity: 1; }
              to { transform: translateX(100%); opacity: 0; }
            }
          `;
          document.head.appendChild(style);
        }

        document.body.appendChild(successMessage);

        // Remove message after 3 seconds
        setTimeout(() => {
          successMessage.style.animation = 'slideOut 0.3s ease-in';
          setTimeout(() => {
            if (document.body.contains(successMessage)) {
              document.body.removeChild(successMessage);
            }
          }, 300);
        }, 3000);
      }

      // Prevent browser back button access by replacing history
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Replace current history entry to prevent back navigation
        window.history.replaceState(null, '', '/');

        // Add a new entry to prevent going back to authenticated pages
        window.history.pushState(null, '', '/');

        // Listen for popstate to prevent back navigation
        const preventBack = (e: PopStateEvent) => {
          window.history.pushState(null, '', '/');
        };

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.removeEventListener('popstate', preventBack);
        }

        // Clean up listener after a short delay
        setTimeout(() => {
          window.removeEventListener('popstate', preventBack);
        }, 1000);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear the user state
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentUser = async (): Promise<User | null> => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return null;

      return {
        id: data.user.id,
        name: data.user.user_metadata?.full_name || '',
        email: data.user.email!,
        isPremium: true, // Set to true for testing
      };
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  };

  const updatePremiumStatus = (isPremium: boolean) => {
    if (user) {
      const updatedUser = { ...user, isPremium };
      setUser(updatedUser);

      // Update stored user data
      secureStoreAdapter.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  const loadUser = async () => {
    try {
      // Try to load from stored data first
      const storedUserData = await secureStoreAdapter.getItem('user_data');
      const storedToken = await secureStoreAdapter.getItem('auth_token');

      if (storedUserData && storedToken) {
        const userData = JSON.parse(storedUserData);
        // Ensure premium status is true for testing
        userData.isPremium = true;
        setUser(userData);
      }

      // Verify with Supabase
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        // Clear invalid stored data
        await secureStoreAdapter.deleteItem('user_data');
        await secureStoreAdapter.deleteItem('auth_token');
        setUser(null);
        return;
      }

      const currentUser = {
        id: data.user.id,
        name: data.user.user_metadata?.full_name || '',
        email: data.user.email!,
        isPremium: true, // Set to true for testing
      };

      setUser(currentUser);
      await secureStoreAdapter.setItem(
        'user_data',
        JSON.stringify(currentUser)
      );
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      await revenueCatService.initialize();
      await loadUser();

      revenueCatService.onCustomerInfoUpdated((customerInfo) => {
        const isPremium =
          customerInfo.entitlements.active['premium'] !== undefined;
        updatePremiumStatus(isPremium);
      });
    };

    initializeAuth().finally(() => setIsLoading(false));
  }, []);

  const isAuthenticated = !!user;
  const isRealAuth = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        signIn,
        signOut,
        signUp,
        updatePremiumStatus,
        getCurrentUser,
        isRealAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
