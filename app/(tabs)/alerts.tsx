import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Bell, TriangleAlert as AlertTriangle, Info, CircleCheck as CheckCircle } from 'lucide-react-native';

export default function AlertsScreen() {
  const alerts = [
    {
      id: 1,
      type: 'emergency',
      title: 'Emergency Alert',
      message: 'Severe weather warning in your area. Take shelter immediately.',
      timestamp: '2 minutes ago',
      icon: AlertTriangle,
      color: '#ef4444'
    },
    {
      id: 2,
      type: 'info',
      title: 'Resource Update',
      message: 'New disaster relief center opened at Community Center.',
      timestamp: '1 hour ago',
      icon: Info,
      color: '#3b82f6'
    },
    {
      id: 3,
      type: 'success',
      title: 'Aid Approved',
      message: 'Your emergency assistance application has been approved.',
      timestamp: '3 hours ago',
      icon: CheckCircle,
      color: '#10b981'
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Bell size={24} color="#1f2937" />
        <Text style={styles.title}>Emergency Alerts</Text>
      </View>
      
      <ScrollView style={styles.alertsList}>
        {alerts.map((alert) => {
          const IconComponent = alert.icon;
          return (
            <View key={alert.id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <IconComponent size={20} color={alert.color} />
                <Text style={[styles.alertTitle, { color: alert.color }]}>
                  {alert.title}
                </Text>
                <Text style={styles.timestamp}>{alert.timestamp}</Text>
              </View>
              <Text style={styles.alertMessage}>{alert.message}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 12,
  },
  alertsList: {
    flex: 1,
  },
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  alertMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});