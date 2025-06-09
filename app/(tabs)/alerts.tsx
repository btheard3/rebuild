import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useResponsive, getResponsiveValue } from '@/hooks/useResponsive';
import { analyticsService } from '@/services/analyticsService';
import { TriangleAlert as AlertTriangle, Info, CircleCheck as CheckCircle, Clock, MapPin, Bell } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';

interface Alert {
  id: string;
  type: 'emergency' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  location?: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function AlertsScreen() {
  const { colors } = useTheme();
  const { deviceType } = useResponsive();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const getPadding = getResponsiveValue(16, 24, 32);
  const getMaxWidth = getResponsiveValue('100%', 600, 800);
  
  const padding = getPadding(deviceType);
  const maxWidth = getMaxWidth(deviceType);

  useEffect(() => {
    analyticsService.trackScreen('alerts');
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    // Mock alerts data - in a real app, this would come from an API
    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'emergency',
        title: 'Severe Weather Alert',
        message: 'Hurricane warning issued for your area. Seek shelter immediately.',
        location: 'Miami-Dade County, FL',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        isRead: false,
        priority: 'high'
      },
      {
        id: '2',
        type: 'warning',
        title: 'Evacuation Route Update',
        message: 'Highway 95 North is now closed. Use alternate routes.',
        location: 'Broward County, FL',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: false,
        priority: 'high'
      },
      {
        id: '3',
        type: 'info',
        title: 'Emergency Shelter Available',
        message: 'New emergency shelter opened at Miami Convention Center.',
        location: 'Downtown Miami, FL',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        isRead: true,
        priority: 'medium'
      },
      {
        id: '4',
        type: 'success',
        title: 'Power Restored',
        message: 'Electricity has been restored to your neighborhood.',
        location: 'Coral Gables, FL',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        isRead: true,
        priority: 'low'
      }
    ];

    setAlerts(mockAlerts);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
    analyticsService.trackUserAction('mark_alert_read', 'alerts', { alertId });
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle size={24} color={colors.error} />;
      case 'warning':
        return <AlertTriangle size={24} color={colors.warning} />;
      case 'info':
        return <Info size={24} color={colors.primary} />;
      case 'success':
        return <CheckCircle size={24} color={colors.success} />;
      default:
        return <Bell size={24} color={colors.textSecondary} />;
    }
  };

  const getAlertColors = (type: Alert['type']) => {
    switch (type) {
      case 'emergency':
        return {
          background: colors.error + '10',
          border: colors.error + '30',
          text: colors.error
        };
      case 'warning':
        return {
          background: colors.warning + '10',
          border: colors.warning + '30',
          text: colors.warning
        };
      case 'info':
        return {
          background: colors.primary + '10',
          border: colors.primary + '30',
          text: colors.primary
        };
      case 'success':
        return {
          background: colors.success + '10',
          border: colors.success + '30',
          text: colors.success
        };
      default:
        return {
          background: colors.surface,
          border: colors.border,
          text: colors.text
        };
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const renderAlert = (alert: Alert) => {
    const alertColors = getAlertColors(alert.type);
    
    return (
      <TouchableOpacity
        key={alert.id}
        style={[
          styles.alertCard,
          {
            backgroundColor: alertColors.background,
            borderColor: alertColors.border,
            opacity: alert.isRead ? 0.7 : 1
          }
        ]}
        onPress={() => markAsRead(alert.id)}
      >
        <View style={styles.alertHeader}>
          <View style={styles.alertIcon}>
            {getAlertIcon(alert.type)}
          </View>
          <View style={styles.alertInfo}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              {alert.title}
            </Text>
            <View style={styles.alertMeta}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={[styles.alertTime, { color: colors.textSecondary }]}>
                {formatTimestamp(alert.timestamp)}
              </Text>
              {alert.location && (
                <>
                  <MapPin size={14} color={colors.textSecondary} />
                  <Text style={[styles.alertLocation, { color: colors.textSecondary }]}>
                    {alert.location}
                  </Text>
                </>
              )}
            </View>
          </View>
          {!alert.isRead && (
            <View style={[styles.unreadIndicator, { backgroundColor: alertColors.text }]} />
          )}
        </View>
        
        <Text style={[styles.alertMessage, { color: colors.text }]}>
          {alert.message}
        </Text>
      </TouchableOpacity>
    );
  };

  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingHorizontal: padding, maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Emergency Alerts
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.error }]}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <ScrollView
          style={styles.alertsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {alerts.length > 0 ? (
            alerts.map(renderAlert)
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Bell size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Alerts
              </Text>
              <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                You're all caught up! We'll notify you of any emergency alerts in your area.
              </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertsList: {
    flex: 1,
  },
  alertCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertTime: {
    fontSize: 12,
    marginRight: 8,
  },
  alertLocation: {
    fontSize: 12,
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 36,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    borderRadius: 12,
    marginTop: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});