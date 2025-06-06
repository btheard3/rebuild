import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { useResponsive, getResponsiveValue } from '@/hooks/useResponsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyticsService } from '@/services/analyticsService';
import { ChevronRight, Moon, Bell, Lock, CircleHelp as HelpCircle, LogOut, CreditCard, Crown, Contrast } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';
import PaywallScreen from '@/components/PaywallScreen';

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
  const { colors, theme, toggleTheme, highContrastMode, toggleHighContrastMode } = useTheme();
  const { user, signOut } = useAuth();
  const { data: gamificationData } = useGamification();
  const { deviceType } = useResponsive();
  const [showPaywall, setShowPaywall] = useState(false);
  
  const getPadding = getResponsiveValue(16, 24, 32);
  const getMaxWidth = getResponsiveValue('100%', 600, 800);
  
  const padding = getPadding(deviceType);
  const maxWidth = getMaxWidth(deviceType);

  React.useEffect(() => {
    analyticsService.trackScreen('profile');
  }, []);
  
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
      id: 'high_contrast',
      title: 'High Contrast',
      icon: Contrast,
      type: 'toggle',
      value: highContrastMode,
      color: colors.accent,
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
            analyticsService.trackEvent('theme_toggled', { new_theme: theme === 'light' ? 'dark' : 'light' });
            return { ...item, value: theme === 'light' };
          } else if (id === 'high_contrast') {
            toggleHighContrastMode();
            analyticsService.trackEvent('high_contrast_toggled', { enabled: !highContrastMode });
            return { ...item, value: !highContrastMode };
          } else {
            analyticsService.trackEvent('setting_toggled', { setting: id, value: !item.value });
            return { ...item, value: !item.value };
          }
        }
        return item;
      })
    );
  };

  const handleSubscriptionPress = () => {
    if (user?.isPremium) {
      Alert.alert(
        'Premium Subscription',
        'You are currently subscribed to Premium. Manage your subscription in your device settings.',
        [{ text: 'OK' }]
      );
    } else {
      setShowPaywall(true);
      analyticsService.trackEvent('profile_subscription_pressed', { user_premium: false });
    }
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
          onPress: () => {
            analyticsService.trackEvent('user_logout_initiated');
            signOut();
          },
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
        } else if (item.id === 'subscription') {
          handleSubscriptionPress();
        } else if (item.route) {
          analyticsService.trackUserAction('setting_link_pressed', 'profile', { setting: item.id });
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

  // Updated with more inclusive profile picture
  const userPicture = 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { padding, maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image source={{ uri: userPicture }} style={styles.profilePicture} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.name}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
            
            <TouchableOpacity
              style={[
                styles.subscriptionBadge, 
                { backgroundColor: user?.isPremium ? colors.warning + '20' : colors.primaryLight }
              ]}
              onPress={handleSubscriptionPress}
            >
              {user?.isPremium && <Crown size={14} color={colors.warning} />}
              <Text style={[
                styles.subscriptionText, 
                { 
                  color: user?.isPremium ? colors.warning : colors.primary,
                  marginLeft: user?.isPremium ? 4 : 0
                }
              ]}>
                {user?.isPremium ? 'Premium Member' : 'Free Plan'}
              </Text>
            </TouchableOpacity>

            {/* Gamification Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {gamificationData.level}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Level</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.success }]}>
                  {gamificationData.points}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Points</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.warning }]}>
                  {gamificationData.streakDays}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Streak</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              analyticsService.trackUserAction('edit_profile_pressed', 'profile');
              console.log('Edit profile');
            }}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Mission Statement */}
        <View style={[styles.missionCard, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.missionTitle, { color: colors.primary }]}>Our Mission</Text>
          <Text style={[styles.missionText, { color: colors.text }]}>
            Rebuild was born from the experience of Hurricane Katrina survivors. We believe that everyone deserves access to comprehensive disaster recovery tools, regardless of their background or circumstances. Our app provides empathetic, AI-powered support to help underserved communities navigate the complex journey of rebuilding their lives after disaster strikes.
          </Text>
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
          Version 1.0.0 • Built with ❤️ for disaster survivors
        </Text>
      </ScrollView>

      <PaywallScreen 
        visible={showPaywall} 
        onClose={() => setShowPaywall(false)} 
      />
      
      <BoltBadge />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  profileCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    alignItems: 'flex-start',
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
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  subscriptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
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
  missionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  missionText: {
    fontSize: 14,
    lineHeight: 20,
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