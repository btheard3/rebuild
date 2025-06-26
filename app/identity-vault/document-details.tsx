import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { analyticsService } from '@/services/analyticsService';
import { identityVaultService } from '@/services/identityVaultService';
import { ArrowLeft, FileText, Calendar, Shield, Download, Share as ShareIcon, Trash, ExternalLink, Copy, CircleCheck as CheckCircle } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';

interface DocumentDetails {
  id: string;
  name: string;
  category: string;
  fileType: string;
  fileSize: string;
  uploadDate: string;
  blockchainHash: string;
  transactionId: string;
  verified: boolean;
  previewUrl: string;
}

export default function DocumentDetailsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    analyticsService.trackScreen('document_details');
    loadDocumentDetails();
  }, [documentId]);

  const loadDocumentDetails = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, this would fetch from Supabase
      // For demo purposes, we'll use mock data
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock document data
      const mockDocument: DocumentDetails = {
        id: documentId || '1',
        name: 'Driver\'s License',
        category: 'Identification',
        fileType: 'image/jpeg',
        fileSize: '1.2 MB',
        uploadDate: new Date().toISOString(),
        blockchainHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        transactionId: 'ALGO123456789ABCDEF',
        verified: true,
        previewUrl: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
      };
      
      setDocument(mockDocument);
      
      analyticsService.trackEvent('document_details_loaded', {
        document_id: documentId,
        document_category: mockDocument.category,
      });
    } catch (error) {
      console.error('Failed to load document details:', error);
      Alert.alert('Error', 'Failed to load document details');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyDocument = async () => {
    if (!document) return;
    
    setIsVerifying(true);
    analyticsService.trackEvent('document_verification_started', {
      document_id: document.id,
    });
    
    try {
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, this would verify the document hash on the blockchain
      const isVerified = true;
      
      setDocument(prev => prev ? { ...prev, verified: isVerified } : null);
      
      analyticsService.trackEvent('document_verification_completed', {
        document_id: document.id,
        verified: isVerified,
      });
      
      Alert.alert(
        'Verification Successful',
        'This document has been verified on the blockchain and has not been tampered with.',
        [{ text: 'Great!' }]
      );
    } catch (error) {
      console.error('Document verification failed:', error);
      Alert.alert('Verification Error', 'Unable to verify document. Please try again.');
      
      analyticsService.trackError('document_verification_failed', 'DocumentDetails', {
        document_id: document?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const shareDocument = () => {
    Alert.alert(
      'Share Document',
      'This would share a secure link to this document that expires after 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Share', 
          onPress: () => {
            analyticsService.trackEvent('document_shared', {
              document_id: document?.id,
              document_category: document?.category,
            });
            
            Alert.alert('Success', 'Secure link copied to clipboard');
          }
        },
      ]
    );
  };

  const downloadDocument = () => {
    Alert.alert(
      'Download Document',
      'This would download the document to your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Download', 
          onPress: () => {
            analyticsService.trackEvent('document_downloaded', {
              document_id: document?.id,
              document_category: document?.category,
            });
            
            Alert.alert('Success', 'Document downloaded successfully');
          }
        },
      ]
    );
  };

  const deleteDocument = () => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            analyticsService.trackEvent('document_deleted', {
              document_id: document?.id,
              document_category: document?.category,
            });
            
            // In a real app, this would delete from Supabase
            router.back();
          }
        },
      ]
    );
  };

  const openAlgoExplorer = () => {
    if (!document) return;
    
    const url = `https://testnet.algoexplorer.io/tx/${document.transactionId}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open AlgoExplorer');
    });
    
    analyticsService.trackEvent('algoexplorer_opened', {
      transaction_id: document.transactionId,
      document_id: document.id,
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
    
    analyticsService.trackEvent('clipboard_copy', {
      type: label,
      document_id: document?.id,
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter-Bold' }]}>Document Details</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter-Medium' }]}>
            Loading document details...
          </Text>
        </View>
        <BoltBadge />
      </SafeAreaView>
    );
  }

  if (!document) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter-Bold' }]}>Document Details</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <FileText size={48} color={colors.textSecondary} />
          <Text style={[styles.errorTitle, { color: colors.text, fontFamily: 'Inter-Bold' }]}>
            Document Not Found
          </Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
            The document you're looking for could not be found or may have been deleted.
          </Text>
          <TouchableOpacity
            style={[styles.backToVaultButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backToVaultButtonText, { fontFamily: 'Inter-SemiBold' }]}>Back to Identity Vault</Text>
          </TouchableOpacity>
        </View>
        <BoltBadge />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter-Bold' }]}>Document Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.documentPreviewContainer}>
          {document.fileType.startsWith('image/') ? (
            <Image source={{ uri: document.previewUrl }} style={styles.documentImage} />
          ) : (
            <View style={[styles.documentFilePreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FileText size={64} color={colors.primary} />
              <Text style={[styles.documentFileType, { color: colors.textSecondary, fontFamily: 'Inter-Medium' }]}>
                {document.fileType.split('/')[1].toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.documentInfoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.documentName, { color: colors.text, fontFamily: 'Inter-Bold' }]}>{document.name}</Text>
          
          <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.categoryText, { color: colors.primary, fontFamily: 'Inter-SemiBold' }]}>
              {document.category}
            </Text>
          </View>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary, fontFamily: 'Inter-Medium' }]}>File Type</Text>
              <Text style={[styles.detailValue, { color: colors.text, fontFamily: 'Inter-Regular' }]}>{document.fileType}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary, fontFamily: 'Inter-Medium' }]}>File Size</Text>
              <Text style={[styles.detailValue, { color: colors.text, fontFamily: 'Inter-Regular' }]}>{document.fileSize}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary, fontFamily: 'Inter-Medium' }]}>Upload Date</Text>
              <View style={styles.dateContainer}>
                <Calendar size={14} color={colors.textSecondary} />
                <Text style={[styles.detailValue, { color: colors.text, fontFamily: 'Inter-Regular', marginLeft: 4 }]}>
                  {formatDate(document.uploadDate)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.blockchainCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <View style={styles.blockchainHeader}>
            <Shield size={24} color={colors.primary} />
            <Text style={[styles.blockchainTitle, { color: colors.primary, fontFamily: 'Inter-Bold' }]}>
              Blockchain Verification
            </Text>
          </View>
          
          <View style={styles.verificationStatus}>
            <View style={[
              styles.verificationBadge, 
              { 
                backgroundColor: document.verified ? colors.success + '20' : colors.warning + '20',
                borderColor: document.verified ? colors.success : colors.warning,
              }
            ]}>
              {document.verified ? (
                <CheckCircle size={16} color={colors.success} />
              ) : (
                <Shield size={16} color={colors.warning} />
              )}
              <Text style={[
                styles.verificationText, 
                { 
                  color: document.verified ? colors.success : colors.warning,
                  fontFamily: 'Inter-SemiBold'
                }
              ]}>
                {document.verified ? 'VERIFIED' : 'UNVERIFIED'}
              </Text>
            </View>
            
            {!document.verified && (
              <TouchableOpacity
                style={[styles.verifyButton, { backgroundColor: colors.primary }]}
                onPress={verifyDocument}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={[styles.verifyButtonText, { fontFamily: 'Inter-SemiBold' }]}>Verify Now</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.hashContainer}>
            <Text style={[styles.hashLabel, { color: colors.textSecondary, fontFamily: 'Inter-Medium' }]}>Document Hash</Text>
            <View style={styles.hashValue}>
              <Text style={[styles.hashText, { color: colors.text, fontFamily: 'monospace' }]} numberOfLines={1}>
                {identityVaultService.formatHashForDisplay(document.blockchainHash, 8, 8)}
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(document.blockchainHash, 'Document hash')}
              >
                <Copy size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.transactionContainer}>
            <Text style={[styles.transactionLabel, { color: colors.textSecondary, fontFamily: 'Inter-Medium' }]}>Transaction ID</Text>
            <View style={styles.transactionValue}>
              <Text style={[styles.transactionText, { color: colors.text, fontFamily: 'monospace' }]}>
                {identityVaultService.formatHashForDisplay(document.transactionId, 6, 6)}
              </Text>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={openAlgoExplorer}
              >
                <ExternalLink size={16} color={colors.primary} />
                <Text style={[styles.viewButtonText, { color: colors.primary, fontFamily: 'Inter-Medium' }]}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={downloadDocument}
          >
            <Download size={20} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text, fontFamily: 'Inter-Medium' }]}>Download</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={shareDocument}
          >
            <ShareIcon size={20} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text, fontFamily: 'Inter-Medium' }]}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error + '10', borderColor: colors.error }]}
            onPress={deleteDocument}
          >
            <Trash size={20} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error, fontFamily: 'Inter-Medium' }]}>Delete</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.securityInfo, { backgroundColor: colors.success + '10' }]}>
          <Text style={[styles.securityTitle, { color: colors.success, fontFamily: 'Inter-Bold' }]}>Blockchain Security</Text>
          <Text style={[styles.securityText, { color: colors.text, fontFamily: 'Inter-Regular' }]}>
            This document is secured using Algorand blockchain technology. The document's unique fingerprint (hash) is stored on the blockchain, providing tamper-proof verification without exposing your sensitive information.
          </Text>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  backToVaultButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backToVaultButtonText: {
    color: 'white',
    fontSize: 16,
  },
  documentPreviewContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  documentImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  documentFilePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  documentFileType: {
    marginTop: 8,
    fontSize: 14,
  },
  documentInfoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  documentName: {
    fontSize: 20,
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blockchainCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  blockchainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  blockchainTitle: {
    fontSize: 18,
    marginLeft: 8,
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  verificationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  verifyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 14,
  },
  hashContainer: {
    marginBottom: 12,
  },
  hashLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  hashValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hashText: {
    fontSize: 14,
    flex: 1,
  },
  copyButton: {
    padding: 8,
  },
  transactionContainer: {
    marginBottom: 4,
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
  transactionText: {
    fontSize: 14,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  viewButtonText: {
    fontSize: 14,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    marginTop: 4,
  },
  securityInfo: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
  },
  securityTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    lineHeight: 20,
  },
});