import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Moon, Bell, Lock, HelpCircle, LogOut, CreditCard } from 'lucide-react-native';

type SettingItem = {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  type: 'toggle' | 'link';
  value?: boolean;
  route?: string;
  color: string;
};

export default function ProfileScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  
  const [settings, setSettings] = useState<SettingItem[]>([
    {
      id: 'theme',
      title: 'Dark Mode',
      icon: Moon,
      type: 'toggle',
      value: theme === 'dark',
      color: colors.primary,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      type: 'toggle',
      value: true,
      color: colors.accent,
    },
    {
      id: 'subscription',
      title: 'Premium Subscription',
      icon: CreditCard,
      type: 'link',
      route: '/profile/subscription',
      color: colors.success,
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: Lock,
      type: 'link',
      route: '/profile/security',
      color: colors.warning,
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: HelpCircle,
      type: 'link',
      route: '/profile/help',
      color: colors.secondary,
    },
  ]);

  const handleToggle = (id: string) => {
    setSettings(
      settings.map(item => {
        if (item.id === id) {
          if (id === 'theme') {
            toggleTheme();
            return { ...item, value: theme === 'light' }; // It will flip after toggleTheme
          }
          return { ...item, value: !item.value };
        }
        return item;
      })
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ],
      { cancelable: true }
    );
  };

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.settingItem, 
        { 
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }
      ]}
      onPress={() => {
        if (item.type === 'toggle') {
          handleToggle(item.id);
        } else if (item.route) {
          console.log(`Navigate to ${item.route}`);
        }
      }}
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <item.icon size={20} color={item.color} />
        </View>
        <Text style={[styles.settingItemTitle, { color: colors.text }]}>{item.title}</Text>
      </View>
      
      {item.type === 'toggle' ? (
        <Switch
          value={item.value}
          onValueChange={() => handleToggle(item.id)}
          trackColor={{ false: colors.disabled, true: colors.primary + '70' }}
          thumbColor={item.value ? colors.primary : colors.border}
        />
      ) : (
        <ChevronRight size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  const userPicture = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image source={{ uri: userPicture }} style={styles.profilePicture} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.name}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
            
            <TouchableOpacity
              style={[styles.subscriptionBadge, { backgroundColor: colors.primaryLight }]}
              onPress={() => console.log('Upgrade to premium')}
            >
              <Text style={[styles.subscriptionText, { color: colors.primary }]}>
                {user?.premium ? 'Premium Member' : 'Free Plan'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => console.log('Edit profile')}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Settings</Text>
          <View style={styles.settingsContainer}>
            {settings.map(renderSettingItem)}
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.error }]}
          onPress={handleLogout}
        >
          <LogOut size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.textSecondary }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  profilePicture: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  subscriptionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subscriptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingsContainer: {
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
  },
});