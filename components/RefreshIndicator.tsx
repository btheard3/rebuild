import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react-native';

interface RefreshIndicatorProps {
  isRefreshing: boolean;
  lastUpdated: Date | null;
  isConnected: boolean;
  hasNewUpdates: boolean;
  onRefresh: () => void;
  onMarkAsRead?: () => void;
  autoRefreshInterval?: number; // in seconds
}

export default function RefreshIndicator({
  isRefreshing,
  lastUpdated,
  isConnected,
  hasNewUpdates,
  onRefresh,
  onMarkAsRead,
  autoRefreshInterval = 30
}: RefreshIndicatorProps) {
  const { colors } = useTheme();

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.leftSection}>
        <View style={styles.connectionStatus}>
          {isConnected ? (
            <Wifi size={16} color={colors.success} />
          ) : (
            <WifiOff size={16} color={colors.error} />
          )}
          <Text style={[
            styles.connectionText, 
            { color: isConnected ? colors.success : colors.error }
          ]}>
            {isConnected ? 'Connected' : 'Offline'}
          </Text>
        </View>
        
        <View style={styles.updateInfo}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={[styles.updateText, { color: colors.textSecondary }]}>
            Last updated: {formatLastUpdated(lastUpdated)}
          </Text>
        </View>
        
        <Text style={[styles.intervalText, { color: colors.textSecondary }]}>
          Auto-refresh: {autoRefreshInterval}s
        </Text>
      </View>

      <View style={styles.rightSection}>
        {hasNewUpdates && onMarkAsRead && (
          <TouchableOpacity
            style={[styles.newUpdatesButton, { backgroundColor: colors.primary + '20' }]}
            onPress={onMarkAsRead}
          >
            <Text style={[styles.newUpdatesText, { color: colors.primary }]}>
              New Updates
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.refreshButton,
            { 
              backgroundColor: colors.primary,
              opacity: isRefreshing ? 0.7 : 1
            }
          ]}
          onPress={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small\" color="white" />
          ) : (
            <RefreshCw size={16} color="white" />
          )}
          <Text style={styles.refreshButtonText}>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  leftSection: {
    flex: 1,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  updateText: {
    fontSize: 11,
    marginLeft: 4,
  },
  intervalText: {
    fontSize: 10,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newUpdatesButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newUpdatesText: {
    fontSize: 11,
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});