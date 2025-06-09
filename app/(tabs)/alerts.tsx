import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import { useRefresh } from '@/hooks/useRefresh';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, TriangleAlert as AlertTriangle, Info, CircleCheck as CheckCircle, X, Settings, MapPin, Clock, Volume2, VolumeX } from 'lucide-react-native';
import HomeButton from '@/components/HomeButton';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import RefreshIndicator from '@/components/RefreshIndicator';
import PullToRefresh from '@/components/PullToRefresh';
import BoltBadge from '@/components/BoltBadge';
import { analyticsService } from '@/services/analyticsService';

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
  category?: string;
  source?: string;
};

type NotificationSettings = {
  emergency: boolean;
  weather: boolean;
  evacuation: boolean;
  recovery: boolean;
  location: boolean;
  sound: boolean;
  criticalOnly: boolean;
  autoMarkRead: boolean;
};

type AlertFilters = {
  priority: AlertPriority | 'all';
  type: AlertType | 'all';
  status: 'all' | 'unread' | 'read';
  timeRange: 'all' | '24h' | '7d' | '30d';
};

export default function AlertsScreen() {
  const { colors } = useTheme();
  const { deviceType, padding } = useResponsive();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<AlertItem[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    emergency: true,
    weather: true,
    evacuation: true,
    recovery: true,
    location: true,
    sound: true,
    criticalOnly: false,
    autoMarkRead: false,
  });
  const [filters, setFilters] = useState<AlertFilters>({
    priority: 'all',
    type: 'all',
    status: 'all',
    timeRange: 'all',
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'timestamp' | 'priority'>('timestamp');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Mock fetch function for alerts
  const fetchAlerts = async (): Promise<AlertItem[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockAlerts: AlertItem[] = [
      {
        id: '1',
        title: 'Severe Weather Warning',
        message: 'Tornado watch issued for your area until 8:00 PM. Seek shelter immediately if sirens sound.',
        type: 'weather',
        priority: 'critical',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        location: 'Your Area',
        isRead: false,
        actionRequired: true,
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
        category: 'Weather Alert',
        source: 'National Weather Service',
      },
      {
        id: '2',
        title: 'Evacuation Route Update',
        message: 'Highway 101 North is now open. Use this route for safer evacuation if needed.',
        type: 'evacuation',
        priority: 'high',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        location: 'Highway 101',
        isRead: false,
        actionRequired: false,
        category: 'Transportation',
        source: 'Emergency Management',
      },
      {
        id: '3',
        title: 'Recovery Center Opening',
        message: 'New disaster recovery center opening tomorrow at Community Center. Services include FEMA assistance, insurance help, and mental health support.',
        type: 'recovery',
        priority: 'medium',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        location: 'Community Center',
        isRead: true,
        actionRequired: false,
        category: 'Recovery Services',
        source: 'FEMA',
      },
      {
        id: '4',
        title: 'Emergency Shelter Available',
        message: 'Red Cross has opened emergency shelter at Lincoln High School. Capacity available, pets welcome.',
        type: 'emergency',
        priority: 'high',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        location: 'Lincoln High School',
        isRead: true,
        actionRequired: false,
        category: 'Emergency Services',
        source: 'Red Cross',
      },
      {
        id: '5',
        title: 'Water Distribution',
        message: 'Free water distribution at City Park from 9 AM to 5 PM daily. Bring containers.',
        type: 'info',
        priority: 'medium',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        location: 'City Park',
        isRead: true,
        actionRequired: false,
        category: 'Community Resources',
        source: 'City Emergency Services',
      },
    ];
    
    return mockAlerts;
  };

  // Use refresh hook with real-time updates
  const {
    data: refreshData,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refresh,
    isConnected,
    hasNewUpdates,
    markAsRead: markRefreshAsRead
  } = useRefresh({
    id: 'alerts',
    fetchFunction: fetchAlerts,
    config: {
      interval: 15000, // 15 seconds for critical alerts
      priority: 'critical',
      retryAttempts: 3,
      retryDelay: 2000,
    },
    enableRealTime: true,
    enablePullToRefresh: true,
  });

  useEffect(() => {
    if (refreshData) {
      setAlerts(refreshData);
    }
  }, [refreshData]);

  useEffect(() => {
    analyticsService.trackScreen('alerts');
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...alerts];

    // Apply filters
    if (filters.priority !== 'all') {
      filtered = filtered.filter(alert => alert.priority === filters.priority);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(alert => alert.type === filters.type);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(alert => 
        filters.status === 'read' ? alert.isRead : !alert.isRead
      );
    }

    if (filters.timeRange !== 'all') {
      const now = new Date();
      const timeRanges = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      
      const range = timeRanges[filters.timeRange];
      if (range) {
        filtered = filtered.filter(alert => 
          now.getTime() - alert.timestamp.getTime() <= range
        );
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      } else {
        return b.timestamp.getTime() - a.timestamp.getTime();
      }
    });

    setFilteredAlerts(filtered);
  }, [alerts, filters, sortBy]);

  // Play sound for critical alerts
  useEffect(() => {
    if (hasNewUpdates && soundEnabled && settings.sound) {
      const criticalAlerts = alerts.filter(alert => 
        alert.priority === 'critical' && !alert.isRead
      );
      
      if (criticalAlerts.length > 0) {
        playAlertSound();
      }
    }
  }, [hasNewUpdates, alerts, soundEnabled, settings.sound]);

  const playAlertSound = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Audio' in window) {
      try {
        const audio = new Audio('/alert-sound.mp3');
        audio.volume = 0.5;
        audio.play().catch(console.warn);
      } catch (error) {
        console.warn('Could not play alert sound:', error);
      }
    }
  };

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
    
    analyticsService.trackEvent('alert_marked_read', { alertId });
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
    markRefreshAsRead();
    analyticsService.trackEvent('all_alerts_marked_read');
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
          onPress: () => {
            setAlerts(prev => prev.filter(alert => alert.id !== alertId));
            analyticsService.trackEvent('alert_dismissed', { alertId });
          }
        },
      ]
    );
  };

  const updateSetting = (key: keyof NotificationSettings) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: !prev[key] };
      analyticsService.trackEvent('notification_setting_changed', { 
        setting: key, 
        value: newSettings[key] 
      });
      return newSettings;
    });
  };

  const updateFilter = (key: keyof AlertFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    analyticsService.trackEvent('alert_filter_changed', { filter: key, value });
  };

  const exportAlerts = () => {
    const exportData = {
      alerts: filteredAlerts,
      exportDate: new Date().toISOString(),
      filters,
      settings
    };
    
    if (Platform.OS === 'web') {
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `alerts-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
    
    analyticsService.trackEvent('alerts_exported', { count: filteredAlerts.length });
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
          padding: deviceType === 'mobile' ? 16 : 20,
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
            <Text style={[
              styles.alertTitle, 
              { 
                color: colors.text,
                fontSize: deviceType === 'mobile' ? 16 : 18,
              }
            ]} numberOfLines={1}>
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

      <Text style={[
        styles.alertMessage, 
        { 
          color: colors.text,
          fontSize: deviceType === 'mobile' ? 14 : 15,
        }
      ]}>
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

      {alert.source && (
        <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
          Source: {alert.source}
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
            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')} 
            {key === 'criticalOnly' && ' Only'}
            {key === 'autoMarkRead' && ' Auto Mark as Read'}
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

  const renderFilters = () => (
    <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.filtersTitle, { color: colors.text }]}>Filters & Sorting</Text>
      
      <View style={styles.filterRow}>
        <Text style={[styles.filterLabel, { color: colors.text }]}>Priority:</Text>
        <View style={styles.filterOptions}>
          {['all', 'critical', 'high', 'medium', 'low'].map(priority => (
            <TouchableOpacity
              key={priority}
              style={[
                styles.filterOption,
                { 
                  backgroundColor: filters.priority === priority ? colors.primary : colors.surface,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => updateFilter('priority', priority)}
            >
              <Text style={[
                styles.filterOptionText,
                { color: filters.priority === priority ? 'white' : colors.text }
              ]}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterRow}>
        <Text style={[styles.filterLabel, { color: colors.text }]}>Status:</Text>
        <View style={styles.filterOptions}>
          {['all', 'unread', 'read'].map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterOption,
                { 
                  backgroundColor: filters.status === status ? colors.primary : colors.surface,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => updateFilter('status', status)}
            >
              <Text style={[
                styles.filterOptionText,
                { color: filters.status === status ? 'white' : colors.text }
              ]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterRow}>
        <Text style={[styles.filterLabel, { color: colors.text }]}>Sort by:</Text>
        <View style={styles.filterOptions}>
          {['timestamp', 'priority'].map(sort => (
            <TouchableOpacity
              key={sort}
              style={[
                styles.filterOption,
                { 
                  backgroundColor: sortBy === sort ? colors.primary : colors.surface,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => setSortBy(sort as 'timestamp' | 'priority')}
            >
              <Text style={[
                styles.filterOptionText,
                { color: sortBy === sort ? 'white' : colors.text }
              ]}>
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <HomeButton />
      <ResponsiveContainer>
        <View style={[styles.content, { marginTop: deviceType === 'mobile' ? 70 : 80 }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[
                styles.headerTitle, 
                { 
                  color: colors.text,
                  fontSize: deviceType === 'mobile' ? 24 : 28,
                }
              ]}>
                Emergency Alerts
              </Text>
              {unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.unreadText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? (
                  <Volume2 size={20} color={colors.primary} />
                ) : (
                  <VolumeX size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>Filters</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowSettings(!showSettings)}
              >
                <Settings size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <RefreshIndicator
            isRefreshing={isRefreshing}
            lastUpdated={lastUpdated}
            isConnected={isConnected}
            hasNewUpdates={hasNewUpdates}
            onRefresh={refresh}
            onMarkAsRead={markRefreshAsRead}
            autoRefreshInterval={15}
          />

          {criticalAlerts.length > 0 && (
            <View style={[styles.criticalBanner, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
              <AlertTriangle size={20} color={colors.error} />
              <Text style={[styles.criticalText, { color: colors.error }]}>
                {criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? 's' : ''} require immediate attention
              </Text>
            </View>
          )}

          {showSettings && renderSettings()}
          {showFilters && renderFilters()}

          <View style={styles.alertsActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={[styles.markAllButton, { backgroundColor: colors.primary }]}
                onPress={markAllAsRead}
              >
                <CheckCircle size={16} color="white" />
                <Text style={styles.markAllButtonText}>Mark All Read</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: colors.secondary }]}
              onPress={exportAlerts}
            >
              <Text style={styles.exportButtonText}>Export ({filteredAlerts.length})</Text>
            </TouchableOpacity>
          </View>

          <PullToRefresh onRefresh={refresh} refreshing={isRefreshing}>
            <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Loading alerts...
                  </Text>
                </View>
              ) : filteredAlerts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <CheckCircle size={48} color={colors.success} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>All Clear</Text>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No alerts match your current filters. We'll notify you of any important updates.
                  </Text>
                </View>
              ) : (
                <View style={styles.alertsContainer}>
                  {filteredAlerts.map(renderAlert)}
                </View>
              )}
            </ScrollView>
          </PullToRefresh>
        </View>
      </ResponsiveContainer>
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
    paddingBottom: 80,
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
    flex: 1,
  },
  headerTitle: {
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 36,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
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
    flex: 1,
  },
  filtersContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  alertsActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  markAllButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  exportButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  alertsList: {
    flex: 1,
  },
  alertsContainer: {
    paddingBottom: 20,
  },
  alertCard: {
    borderRadius: 12,
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
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
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