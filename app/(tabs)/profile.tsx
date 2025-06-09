import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Moon,
  Bell,
  Lock,
  CircleHelp as HelpCircle,
  LogOut,
  CreditCard,
  Crown,
  Contrast,
} from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { useResponsive, getResponsiveValue } from '@/hooks/useResponsive';
import { analyticsService } from '@/services/analyticsService';
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
  const {
    colors,
    theme,
    toggleTheme,
    highContrastMode,
    toggleHighContrastMode,
  } = useTheme();
  const { user, signOut } = useAuth();
  const { data: gamificationData } = useGamification();
  const { deviceType } = useResponsive();
  const [showPaywall, setShowPaywall] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const padding = getResponsiveValue(16, 24, 32)(deviceType);
  const maxWidthRaw = getResponsiveValue('100%', 600, 800)(deviceType);
  const maxWidthStyle = { maxWidth: maxWidthRaw as string | number };

  useEffect(() => {
    analyticsService.trackScreen('profile');
  }, []);

  const settings: SettingItem[] = [
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
  ];

  const handleToggle = (id: string) => {
    if (id === 'theme') {
      toggleTheme();
      analyticsService.trackEvent('theme_toggled', {
        new_theme: theme === 'light' ? 'dark' : 'light',
      });
    } else if (id === 'high_contrast') {
      toggleHighContrastMode();
      analyticsService.trackEvent('high_contrast_toggled', {
        enabled: !highContrastMode,
      });
    } else {
      analyticsService.trackEvent('setting_toggled', { setting: id });
    }
  };

  const handleSubscriptionPress = () => {
    if (user?.isPremium) {
      Alert.alert('Premium Subscription', 'You are subscribed to Premium.');
    } else {
      setShowPaywall(true);
      analyticsService.trackEvent('profile_subscription_pressed', {
        user_premium: false,
      });
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await signOut();
            analyticsService.trackEvent('user_logged_out');
          } catch (err) {
            console.error('Logout failed', err);
            Alert.alert('Error', 'Could not log out. Try again.');
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const userPicture =
    'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={{ padding, alignSelf: 'center', width: '100%' }}
      >
        <View style={maxWidthStyle}>
          <View
            style={[
              styles.profileCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Image
              source={{ uri: userPicture }}
              style={styles.profilePicture}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {user?.name}
              </Text>
              <Text
                style={[styles.profileEmail, { color: colors.textSecondary }]}
              >
                {user?.email}
              </Text>
              <TouchableOpacity
                style={[
                  styles.subscriptionBadge,
                  {
                    backgroundColor: user?.isPremium
                      ? colors.warning + '20'
                      : colors.primaryLight,
                  },
                ]}
                onPress={handleSubscriptionPress}
              >
                {user?.isPremium && <Crown size={14} color={colors.warning} />}
                <Text
                  style={[
                    styles.subscriptionText,
                    {
                      color: user?.isPremium ? colors.warning : colors.primary,
                      marginLeft: user?.isPremium ? 4 : 0,
                    },
                  ]}
                >
                  {user?.isPremium ? 'Premium Member' : 'Free Plan'}
                </Text>
              </TouchableOpacity>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.primary }]}>
                    {gamificationData.level}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Level
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.success }]}>
                    {gamificationData.points}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Points
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.warning }]}>
                    {gamificationData.streakDays}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Streak
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.missionCard,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Text style={[styles.missionTitle, { color: colors.primary }]}>
              Our Mission
            </Text>
            <Text style={[styles.missionText, { color: colors.text }]}>
              Rebuild was born from the experience of Hurricane Katrina
              survivors. We believe that everyone deserves access to
              comprehensive disaster recovery tools, regardless of their
              background or circumstances.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Account Settings
            </Text>
            <View style={styles.settingsContainer}>
              {settings.map((setting) => (
                <TouchableOpacity
                  key={setting.id}
                  style={[
                    styles.settingItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    if (setting.type === 'toggle') {
                      handleToggle(setting.id);
                    } else if (setting.id === 'subscription') {
                      handleSubscriptionPress();
                    } else if (setting.route) {
                      analyticsService.trackUserAction(
                        'setting_link_pressed',
                        'profile',
                        { setting: setting.id }
                      );
                      console.log(`Navigate to ${setting.route}`);
                    }
                  }}
                >
                  <View style={styles.settingItemLeft}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: setting.color + '20' },
                      ]}
                    >
                      <setting.icon size={20} color={setting.color} />
                    </View>
                    <Text
                      style={[styles.settingItemTitle, { color: colors.text }]}
                    >
                      {setting.title}
                    </Text>
                  </View>
                  {setting.type === 'toggle' ? (
                    <Switch
                      value={setting.value}
                      onValueChange={() => handleToggle(setting.id)}
                      trackColor={{
                        false: colors.disabled,
                        true: colors.primary + '70',
                      }}
                      thumbColor={
                        setting.value ? colors.primary : colors.border
                      }
                    />
                  ) : (
                    <ChevronRight size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.logoutButton,
              {
                borderColor: colors.error,
                backgroundColor: isLoggingOut
                  ? colors.error + '10'
                  : 'transparent',
                opacity: isLoggingOut ? 0.7 : 1,
              },
            ]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut size={20} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>
              {isLoggingOut ? 'Logging Out...' : 'Log Out'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            Version 1.0.0 • Built with ❤️ for disaster survivors
          </Text>
        </View>
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
  container: { flex: 1 },
  scrollContent: { paddingBottom: 80 },
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
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
  },
});
