import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { analyticsService } from '@/services/analyticsService';
import { identityVaultService } from '@/services/identityVaultService';
import { ArrowLeft, Shield, CircleCheck as CheckCircle, Clock, ExternalLink, TriangleAlert as AlertTriangle, Search } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';

interface VerificationRecord {
  id: string;
  documentName: string;
  documentType: string;
  timestamp: string;
  transactionId: string;
  blockchainHash: string;
  status: 'verified' | 'failed' | 'pending';
}

export default function VerificationHistoryScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    analyticsService.trackScreen('verification_history');
    loadVerificationHistory();
  }, []);

  const loadVerificationHistory = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, this would fetch from Supabase
      // For demo purposes, we'll use mock data
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock verification records
      const mockRecords: VerificationRecord[] = [
        {
          id: '1',
          documentName: 'Driver\'s License',
          documentType: 'Identification',
          timestamp: new Date().toISOString(),
          transactionId: 'ALGO123456789ABCDEF',
          blockchainHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          status: 'verified',
        },
        {
          id: '2',
          documentName: 'Insurance Card',
          documentType: 'Insurance',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          transactionId: 'ALGO987654321FEDCBA',
          blockchainHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
          status: 'verified',
        },
        {
          id: '3',
          documentName: 'Medical Information',
          documentType: 'Medical',
          timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          transactionId: 'ALGO567890ABCDEF12345',
          blockchainHash: 'f1e2d3c4b5a6978685746352413f2e1d0c9b8a7654321',
          status: 'failed',
        },
        {
          id: '4',
          documentName: 'Property Deed',
          documentType: 'Property',
          timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          transactionId: 'ALGO1A2B3C4D5E6F7G8H9I',
          blockchainHash: '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7',
          status: 'verified',
        },
        {
          id: '5',
          documentName: 'Passport',
          documentType: 'Identification',
          timestamp: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
          transactionId: 'ALGO9I8U7Y6T5R4E3W2Q1',
          blockchainHash: '9i8u7y6t5r4e3w2q1p0o9i8u7y6t5r4e3w2q1',
          status: 'pending',
        },
      ];
      
      setRecords(mockRecords);
      
      analyticsService.trackEvent('verification_history_loaded', {
        record_count: mockRecords.length,
      });
    } catch (error) {
      console.error('Failed to load verification history:', error);
      Alert.alert('Error', 'Failed to load verification history');
      
      analyticsService.trackError('verification_history_load_failed', 'VerificationHistory', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadVerificationHistory();
  };

  const viewTransactionDetails = (transactionId: string) => {
    const url = `https://testnet.algoexplorer.io/tx/${transactionId}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open AlgoExplorer');
    });
    
    analyticsService.trackEvent('transaction_details_viewed', {
      transaction_id: transactionId,
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle size={20} color={colors.success} />;
      case 'failed':
        return <AlertTriangle size={20} color={colors.error} />;
      case 'pending':
        return <Clock size={20} color={colors.warning} />;
      default:
        return <Shield size={20} color={colors.primary} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return colors.success;
      case 'failed':
        return colors.error;
      case 'pending':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  const renderVerificationRecord = ({ item }: { item: VerificationRecord }) => (
    <TouchableOpacity
      style={[styles.recordCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push(`/identity-vault/document-details?id=${item.id}`)}
    >
      <View style={styles.recordHeader}>
        <View style={[
          styles.statusBadge, 
          { 
            backgroundColor: getStatusColor(item.status) + '20',
            borderColor: getStatusColor(item.status),
          }
        ]}>
          {getStatusIcon(item.status)}
          <Text style={[
            styles.statusText, 
            { 
              color: getStatusColor(item.status),
              fontFamily: 'Inter-SemiBold'
            }
          ]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
        
        <Text style={[styles.documentType, { color: colors.primary, fontFamily: 'Inter-Medium' }]}>
          {item.documentType}
        </Text>
      </View>
      
      <Text style={[styles.documentName, { color: colors.text, fontFamily: 'Inter-Bold' }]}>
        {item.documentName}
      </Text>
      
      <View style={styles.timestampContainer}>
        <Clock size={14} color={colors.textSecondary} />
        <Text style={[styles.timestamp, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
          {formatDate(item.timestamp)}
        </Text>
      </View>
      
      <View style={styles.transactionContainer}>
        <Text style={[styles.transactionLabel, { color: colors.textSecondary, fontFamily: 'Inter-Medium' }]}>
          Transaction ID:
        </Text>
        <View style={styles.transactionValue}>
          <Text style={[styles.transactionId, { color: colors.text, fontFamily: 'monospace' }]}>
            {identityVaultService.formatHashForDisplay(item.transactionId, 6, 6)}
          </Text>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => viewTransactionDetails(item.transactionId)}
          >
            <ExternalLink size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter-Bold' }]}>Verification History</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter-Medium' }]}>
            Loading verification history...
          </Text>
        </View>
      ) : records.length > 0 ? (
        <FlatList
          data={records}
          renderItem={renderVerificationRecord}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Shield size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: 'Inter-Bold' }]}>
            No Verification Records
          </Text>
          <Text style={[styles.emptyMessage, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
            You haven't verified any documents yet. Upload and verify documents to see your verification history.
          </Text>
          <TouchableOpacity
            style={[styles.uploadButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/identity-vault/document-upload')}
          >
            <Text style={[styles.uploadButtonText, { fontFamily: 'Inter-SemiBold' }]}>Upload Document</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.infoCard, { backgroundColor: colors.primary + '10' }]}>
        <View style={styles.infoHeader}>
          <Shield size={20} color={colors.primary} />
          <Text style={[styles.infoTitle, { color: colors.primary, fontFamily: 'Inter-Bold' }]}>
            Blockchain Verification
          </Text>
        </View>
        <Text style={[styles.infoText, { color: colors.text, fontFamily: 'Inter-Regular' }]}>
          All document verifications are recorded on the Algorand blockchain, providing a tamper-proof record of your document integrity. Each verification creates a unique transaction that can be independently verified.
        </Text>
      </View>
      <BoltBadge />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContent: {
    padding: 20,
  },
  recordCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    marginLeft: 4,
  },
  documentType: {
    fontSize: 14,
  },
  documentName: {
    fontSize: 18,
    marginBottom: 8,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timestamp: {
    fontSize: 14,
    marginLeft: 6,
  },
  transactionContainer: {
    marginTop: 4,
  },
  transactionLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  transactionValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionId: {
    fontSize: 14,
  },
  viewButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  uploadButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
  },
  infoCard: {
    margin: 20,
    borderRadius: 12,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});