import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useResponsive, getResponsiveValue } from '@/hooks/useResponsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, TriangleAlert as AlertTriangle, Info, CircleCheck as CheckCircle, X, Settings, MapPin, Clock } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';

type AlertType = 'emergency' | 'weather' | 'evacuation' | 'info' | 'recovery';
type AlertPriority = 'critical' | 'high' | 'medium' | 'low';

type AlertItem = {
  id: string;
  title: string;
  message: string;
  type: AlertType;
  priority: AlertPriority;
  timestamp: Date;
  location?: string;
  isRead: boolean;
  actionRequired: boolean;
  expiresAt?: Date;
};

type NotificationSettings = {
  emergency: boolean;
  weather: boolean;
  evacuation: boolean;
  recovery: boolean;
  location: boolean;
  sound: boolean;
};

export default function AlertsScreen() {
  const { colors } = useTheme();
  const { deviceType } = useResponsive();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    emergency: true,
    weather: true,
    evacuation: true,
    recovery: true,
    location: true,
    sound: true,
  });
  const [showSettings, setShowSettings] = useState(false);

  const getPadding = getResponsiveValue(16, 24, 32);
  const getMaxWidth = getResponsiveValue('100%', 800, 1000);
  
  const padding = getPadding(deviceType);
  const maxWidth = getMaxWidth(deviceType);

  // Mock alerts data
  useEffect(() => {
    const mockAlerts: AlertItem[] = [
      {
        id: '1',
        title: 'Severe Weather Warning',
        message: 'Tornado watch issued for your area until 8:00 PM. Seek shelter immediately if sirens sound.',
        type: 'weather',
        priority: 'critical',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        location: 'Your Area',
        isRead: false,
        actionRequired: true,
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      },
      {
        id: '2',
        title: 'Evacuation Route Update',
        message: 'Highway 101 North is now open. Use this route for safer evacuation if needed.',
        type: 'evacuation',
        priority: 'high',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        location: 'Highway 101',
        isRead: false,
        actionRequired: false,
      },
      {
        id: '3',
        title: 'Recovery Center Opening',
        message: 'New disaster recovery center opening tomorrow at Community Center. Services include FEMA assistance, insurance help, and mental health support.',
        type: 'recovery',
        priority: 'medium',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        location: 'Community Center',
        isRead: true,
        actionRequired: false,
      },
      {
        id: '4',
        title: 'Emergency Shelter Available',
        message: 'Red Cross has opened emergency shelter at Lincoln High School. Capacity available, pets welcome.',
        type: 'emergency',
        priority: 'high',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        location: 'Lincoln High School',
        isRead: true,
        actionRequired: false,
      },
      {
        id: '5',
        title: 'Water Distribution',
        message: 'Free water distribution at City Park from 9 AM to 5 PM daily. Bring containers.',
        type: 'info',
        priority: 'medium',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        location: 'City Park',
        isRead: true,
        actionRequired: false,
      },
    ];
    setAlerts(mockAlerts);
  }, []);

  const getAlertIcon = (type: AlertType, priority: AlertPriority) => {
    const iconColor = priority === 'critical' ? colors.error : 
                     priority === 'high' ? colors.warning : 
                     colors.primary;

    switch (type) {
      case 'emergency':
        return <AlertTriangle size={24} color={iconColor} />;
      case 'weather':
        return <AlertTriangle size={24} color={iconColor} />;
      case 'evacuation':
        return <AlertTriangle size={24} color={iconColor} />;
      case 'recovery':
        return <Info size={24} color={iconColor} />;
      case 'info':
        return <Info size={24} color={iconColor} />;
      default:
        return <Bell size={24} color={iconColor} />;
    }
  };

  const getPriorityColor = (priority: AlertPriority) => {
    switch (priority) {
      case 'critical':
        return colors.error;
      case 'high':
        return colors.warning;
      case 'medium':
        return colors.primary;
      case 'low':
        return colors.textSecondary;
      default:
        return colors.primary;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  const dismissAlert = (alertId: string) => {
    Alert.alert(
      'Dismiss Alert',
      'Are you sure you want to dismiss this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Dismiss', 
          style: 'destructive',
          onPress: () => setAlerts(prev => prev.filter(alert => alert.id !== alertId))
        },
      ]
    );
  };

  const updateSetting = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const unreadCount = alerts.filter(alert => !alert.isRead).length;
  const criticalAlerts = alerts.filter(alert => alert.priority === 'critical' && !alert.isRead);

  const renderAlert = (alert: AlertItem) => (
    <TouchableOpacity
      key={alert.id}
      style={[
        styles.alertCard,
        { 
          backgroundColor: alert.isRead ? colors.surface : colors.primaryLight,
          borderColor: alert.isRead ? colors.border : getPriorityColor(alert.priority),
          borderLeftWidth: 4,
        }
      ]}
      onPress={() => markAsRead(alert.id)}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertIconContainer}>
          {getAlertIcon(alert.type, alert.priority)}
        </View>
        
        <View style={styles.alertInfo}>
          <View style={styles.alertTitleRow}>
            <Text style={[styles.alertTitle, { color: colors.text }]} numberOfLines={1}>
              {alert.title}
            </Text>
            <TouchableOpacity
              onPress={() => dismissAlert(alert.id)}
              style={styles.dismissButton}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.alertMeta}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(alert.priority) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(alert.priority) }]}>
                {alert.priority.toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.timestampContainer}>
              <Clock size={12} color={colors.textSecondary} />
              <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                {formatTimestamp(alert.timestamp)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={[styles.alertMessage, { color: colors.text }]}>
        {alert.message}
      </Text>

      {alert.location && (
        <View style={styles.locationContainer}>
          <MapPin size={14} color={colors.textSecondary} />
          <Text style={[styles.locationText, { color: colors.textSecondary }]}>
            {alert.location}
          </Text>
        </View>
      )}

      {alert.actionRequired && (
        <View style={[styles.actionBadge, { backgroundColor: colors.warning + '20' }]}>
          <AlertTriangle size={14} color={colors.warning} />
          <Text style={[styles.actionText, { color: colors.warning }]}>
            Action Required
          </Text>
        </View>
      )}

      {alert.expiresAt && (
        <Text style={[styles.expiryText, { color: colors.textSecondary }]}>
          Expires: {alert.expiresAt.toLocaleString()}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderSettings = () => (
    <View style={[styles.settingsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.settingsTitle, { color: colors.text }]}>Notification Settings</Text>
      
      {Object.entries(settings).map(([key, value]) => (
        <View key={key} style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')} Alerts
          </Text>
          <Switch
            value={value}
            onValueChange={() => updateSetting(key as keyof NotificationSettings)}
            trackColor={{ false: colors.disabled, true: colors.primary + '70' }}
            thumbColor={value ? colors.primary : colors.border}
          />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingHorizontal: padding, maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Emergency Alerts</Text>
            {unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.unreadText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Settings size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {criticalAlerts.length > 0 && (
          <View style={[styles.criticalBanner, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
            <AlertTriangle size={20} color={colors.error} />
            <Text style={[styles.criticalText, { color: colors.error }]}>
              {criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? 's' : ''} require immediate attention
            </Text>
          </View>
        )}

        {showSettings && renderSettings()}

        <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
          {alerts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <CheckCircle size={48} color={colors.success} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>All Clear</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No active alerts in your area. We'll notify you of any important updates.
              </Text>
            </View>
          ) : (
            <View style={styles.alertsContainer}>
              {alerts.map(renderAlert)}
            </View>
          )}
        </ScrollView>
      </View>
      <BoltBadge />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  criticalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  criticalText: {
    marginLeft: 8,
    fontWeight: '600',
    flex: 1,
  },
  settingsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  settingLabel: {
    fontSize: 16,
  },
  alertsList: {
    flex: 1,
  },
  alertsContainer: {
    paddingBottom: 80,
  },
  alertCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  alertIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 8,
  },
  dismissButton: {
    padding: 4,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    marginLeft: 4,
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  expiryText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
});