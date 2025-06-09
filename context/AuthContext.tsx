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
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  updatePremiumStatus: (isPremium: boolean) => void;
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
      setUser({
        id: data.user.id,
        name,
        email: data.user.email!,
        isPremium: false,
      });
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
      setUser({
        id: data.user.id,
        name: data.user.user_metadata?.full_name || '',
        email: data.user.email!,
        isPremium: false,
      });
    }

    setIsLoading(false);
  };

  const signOut = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setIsLoading(false);
  };

  const updatePremiumStatus = (isPremium: boolean) => {
    if (user) {
      setUser({ ...user, isPremium });
    }
  };

  const loadUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return;
    setUser({
      id: data.user.id,
      name: data.user.user_metadata?.full_name || '',
      email: data.user.email!,
      isPremium: false,
    });
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

  const isRealAuth = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signOut,
        signUp,
        updatePremiumStatus,
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
