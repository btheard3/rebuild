import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
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
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Secure store mock for web platform
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

  useEffect(() => {
    // Initialize RevenueCat and check user status
    const initializeAuth = async () => {
      await revenueCatService.initialize();
      await loadUser();
      
      // Set up RevenueCat listener for subscription changes
      revenueCatService.onCustomerInfoUpdated((customerInfo) => {
        const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
        updatePremiumStatus(isPremium);
      });
    };

    initializeAuth();
  }, []);

  const loadUser = async () => {
    try {
      const userString = await secureStoreAdapter.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);
        setUser(userData);
        
        // Check current premium status from RevenueCat
        const customerInfo = await revenueCatService.getCustomerInfo();
        if (customerInfo) {
          const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
          if (userData.isPremium !== isPremium) {
            updatePremiumStatus(isPremium);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      analyticsService.trackError('auth_load_user_failed', 'AuthContext', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // This is a mock authentication. In a real app, you would call an API
      const mockUser = {
        id: '123',
        name: 'John Doe',
        email,
        isPremium: false
      };
      await secureStoreAdapter.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      analyticsService.trackEvent('user_sign_in', { email, method: 'email_password' });
    } catch (error) {
      console.error('Error signing in:', error);
      analyticsService.trackError('auth_sign_in_failed', 'AuthContext', { email, error: error.message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await secureStoreAdapter.deleteItem('user');
      setUser(null);
      analyticsService.trackEvent('user_sign_out');
    } catch (error) {
      console.error('Error signing out:', error);
      analyticsService.trackError('auth_sign_out_failed', 'AuthContext', { error: error.message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // This is a mock registration. In a real app, you would call an API
      const mockUser = {
        id: '123',
        name,
        email,
        isPremium: false
      };
      await secureStoreAdapter.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      analyticsService.trackEvent('user_sign_up', { email, method: 'email_password' });
    } catch (error) {
      console.error('Error signing up:', error);
      analyticsService.trackError('auth_sign_up_failed', 'AuthContext', { email, error: error.message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePremiumStatus = async (isPremium: boolean) => {
    if (user) {
      const updatedUser = { ...user, isPremium };
      setUser(updatedUser);
      await secureStoreAdapter.setItem('user', JSON.stringify(updatedUser));
      
      analyticsService.trackEvent('premium_status_changed', { 
        isPremium, 
        userId: user.id 
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
      isAuthenticated: !!user 
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