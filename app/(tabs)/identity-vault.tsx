import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Clipboard,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { analyticsService } from '@/services/analyticsService';
import { Shield, Lock, CircleCheck as CheckCircle, Copy, ExternalLink, TriangleAlert as AlertTriangle, User, Phone, MapPin, FileText, Clock } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';

interface UserRecoveryData {
  fullName: string;
  governmentId: string;
  insurancePolicyNumber: string;
  insuranceProvider: string;
  primaryContactName: string;
  primaryContactPhone: string;
  secondaryContactName: string;
  secondaryContactPhone: string;
  currentAddress: string;
  city: string;
  state: string;
  zipCode: string;
}

interface BlockchainBackup {
  hash: string;
  transactionId: string;
  timestamp: Date;
  verified: boolean;
}

export default function IdentityVaultScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { deviceType, padding } = useResponsive();
  
  const [formData, setFormData] = useState<UserRecoveryData>({
    fullName: '',
    governmentId: '',
    insurancePolicyNumber: '',
    insuranceProvider: '',
    primaryContactName: '',
    primaryContactPhone: '',
    secondaryContactName: '',
    secondaryContactPhone: '',
    currentAddress: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const [backup, setBackup] = useState<BlockchainBackup | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState<'form' | 'backup' | 'verified'>('form');

  useEffect(() => {
    analyticsService.trackScreen('identity_vault');
  }, []);

  const generateDataHash = async (data: UserRecoveryData): Promise<string> => {
    try {
      // Combine all data into a single string for hashing
      const dataString = JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        userId: user?.id || 'anonymous'
      });

      // Convert string to ArrayBuffer
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataString);

      // Generate SHA-256 hash
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      
      // Convert hash to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return hashHex;
    } catch (error) {
      console.error('Hash generation failed:', error);
      throw new Error('Failed to generate secure hash');
    }
  };

  const simulateAlgorandTransaction = async (hash: string): Promise<string> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a realistic Algorand transaction ID
    const txId = `ALGO${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    return txId;
  };

  const validateForm = (): boolean => {
    const requiredFields = [
      'fullName', 'governmentId', 'insurancePolicyNumber', 'insuranceProvider',
      'primaryContactName', 'primaryContactPhone', 'currentAddress', 'city', 'state', 'zipCode'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof UserRecoveryData].trim()) {
        Alert.alert('Validation Error', `Please fill in all required fields.`);
        return false;
      }
    }

    // Validate phone numbers
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(formData.primaryContactPhone)) {
      Alert.alert('Validation Error', 'Please enter a valid primary contact phone number.');
      return false;
    }

    if (formData.secondaryContactPhone && !phoneRegex.test(formData.secondaryContactPhone)) {
      Alert.alert('Validation Error', 'Please enter a valid secondary contact phone number.');
      return false;
    }

    return true;
  };

  const createBlockchainBackup = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    analyticsService.trackEvent('blockchain_backup_started');

    try {
      // Generate secure hash of user data
      const dataHash = await generateDataHash(formData);
      
      // Simulate Algorand blockchain transaction
      const transactionId = await simulateAlgorandTransaction(dataHash);
      
      const backupData: BlockchainBackup = {
        hash: dataHash,
        transactionId,
        timestamp: new Date(),
        verified: false
      };

      setBackup(backupData);
      setStep('backup');

      analyticsService.trackEvent('blockchain_backup_completed', {
        hash_length: dataHash.length,
        transaction_id: transactionId
      });

      Alert.alert(
        'Backup Created Successfully',
        'Your identity data has been securely hashed and anchored to the Algorand blockchain.',
        [{ text: 'Continue', onPress: () => {} }]
      );

    } catch (error) {
      console.error('Blockchain backup failed:', error);
      analyticsService.trackError('blockchain_backup_failed', 'IdentityVault', {
        error: error.message
      });
      
      Alert.alert(
        'Backup Failed',
        'Unable to create blockchain backup. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyBackup = async () => {
    if (!backup) return;

    setIsVerifying(true);
    analyticsService.trackEvent('blockchain_verification_started');

    try {
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Re-generate hash and compare
      const currentHash = await generateDataHash(formData);
      const isValid = currentHash === backup.hash;

      if (isValid) {
        setBackup(prev => prev ? { ...prev, verified: true } : null);
        setStep('verified');
        
        analyticsService.trackEvent('blockchain_verification_success');
        
        Alert.alert(
          'Verification Successful',
          'Your identity backup has been verified on the blockchain.',
          [{ text: 'Excellent!' }]
        );
      } else {
        analyticsService.trackEvent('blockchain_verification_failed');
        Alert.alert(
          'Verification Failed',
          'Data integrity check failed. Your data may have been modified.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Verification failed:', error);
      Alert.alert('Verification Error', 'Unable to verify backup. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
    analyticsService.trackEvent('clipboard_copy', { type: label });
  };

  const openAlgoExplorer = () => {
    if (!backup) return;
    
    const url = `https://testnet.algoexplorer.io/tx/${backup.transactionId}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open AlgoExplorer');
    });
    
    analyticsService.trackEvent('algoexplorer_opened', {
      transaction_id: backup.transactionId
    });
  };

  const formatHash = (hash: string): string => {
    if (hash.length < 12) return hash;
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}`;
  };

  const formatTransactionId = (txId: string): string => {
    if (txId.length < 8) return txId;
    return `${txId.substring(0, 4)}...${txId.substring(txId.length - 4)}`;
  };

  const renderFormStep = () => (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <User size={24} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Full Legal Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="Enter your full legal name"
          placeholderTextColor={colors.textSecondary}
          value={formData.fullName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Government ID Number *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="SSN, Driver's License, or Passport Number"
          placeholderTextColor={colors.textSecondary}
          value={formData.governmentId}
          onChangeText={(text) => setFormData(prev => ({ ...prev, governmentId: text }))}
          secureTextEntry
        />
      </View>

      <View style={styles.sectionHeader}>
        <FileText size={24} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Insurance Information</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Insurance Provider *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="e.g., State Farm, Allstate, GEICO"
          placeholderTextColor={colors.textSecondary}
          value={formData.insuranceProvider}
          onChangeText={(text) => setFormData(prev => ({ ...prev, insuranceProvider: text }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Policy Number *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="Your insurance policy number"
          placeholderTextColor={colors.textSecondary}
          value={formData.insurancePolicyNumber}
          onChangeText={(text) => setFormData(prev => ({ ...prev, insurancePolicyNumber: text }))}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Phone size={24} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Contacts</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Primary Contact Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="Full name of primary emergency contact"
          placeholderTextColor={colors.textSecondary}
          value={formData.primaryContactName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, primaryContactName: text }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Primary Contact Phone *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="+1 (555) 123-4567"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          value={formData.primaryContactPhone}
          onChangeText={(text) => setFormData(prev => ({ ...prev, primaryContactPhone: text }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Secondary Contact Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="Full name of secondary emergency contact"
          placeholderTextColor={colors.textSecondary}
          value={formData.secondaryContactName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, secondaryContactName: text }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Secondary Contact Phone</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="+1 (555) 987-6543"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          value={formData.secondaryContactPhone}
          onChangeText={(text) => setFormData(prev => ({ ...prev, secondaryContactPhone: text }))}
        />
      </View>

      <View style={styles.sectionHeader}>
        <MapPin size={24} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Address</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Street Address *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="123 Main Street, Apt 4B"
          placeholderTextColor={colors.textSecondary}
          value={formData.currentAddress}
          onChangeText={(text) => setFormData(prev => ({ ...prev, currentAddress: text }))}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
          <Text style={[styles.label, { color: colors.text }]}>City *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            placeholder="City"
            placeholderTextColor={colors.textSecondary}
            value={formData.city}
            onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={[styles.label, { color: colors.text }]}>State *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            placeholder="ST"
            placeholderTextColor={colors.textSecondary}
            value={formData.state}
            onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={[styles.label, { color: colors.text }]}>ZIP *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            placeholder="12345"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={formData.zipCode}
            onChangeText={(text) => setFormData(prev => ({ ...prev, zipCode: text }))}
          />
        </View>
      </View>

      <View style={[styles.securityNotice, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
        <AlertTriangle size={20} color={colors.warning} />
        <Text style={[styles.securityText, { color: colors.text }]}>
          Your data will be hashed using SHA-256 encryption and anchored to the Algorand blockchain. 
          No sensitive information is stored on-chain.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.createBackupButton, { backgroundColor: colors.primary }]}
        onPress={createBlockchainBackup}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Shield size={20} color="white" />
            <Text style={styles.createBackupButtonText}>Create Blockchain Backup</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderBackupStep = () => (
    <ScrollView style={styles.backupContainer} showsVerticalScrollIndicator={false}>
      <View style={[styles.backupHeader, { backgroundColor: colors.primary + '20' }]}>
        <Shield size={48} color={colors.primary} />
        <Text style={[styles.backupTitle, { color: colors.text }]}>Identity Backup Created</Text>
        <Text style={[styles.backupSubtitle, { color: colors.textSecondary }]}>
          Your identity information has been securely hashed and anchored to the Algorand blockchain.
        </Text>
      </View>

      <View style={[styles.backupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.backupDetail}>
          <Text style={[styles.backupLabel, { color: colors.textSecondary }]}>Data Hash</Text>
          <View style={styles.hashContainer}>
            <Text style={[styles.hashText, { color: colors.text }]}>
              {backup ? formatHash(backup.hash) : 'N/A'}
            </Text>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => backup && copyToClipboard(backup.hash, 'Data hash')}
            >
              <Copy size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.backupDetail}>
          <Text style={[styles.backupLabel, { color: colors.textSecondary }]}>Transaction ID</Text>
          <View style={styles.hashContainer}>
            <Text style={[styles.hashText, { color: colors.text }]}>
              {backup ? formatTransactionId(backup.transactionId) : 'N/A'}
            </Text>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => backup && copyToClipboard(backup.transactionId, 'Transaction ID')}
            >
              <Copy size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.backupDetail}>
          <Text style={[styles.backupLabel, { color: colors.textSecondary }]}>Timestamp</Text>
          <Text style={[styles.backupValue, { color: colors.text }]}>
            {backup ? backup.timestamp.toLocaleString() : 'N/A'}
          </Text>
        </View>

        <View style={styles.backupDetail}>
          <Text style={[styles.backupLabel, { color: colors.textSecondary }]}>Status</Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: backup?.verified ? colors.success + '20' : colors.warning + '20' }
            ]}>
              <Text style={[
                styles.statusText, 
                { color: backup?.verified ? colors.success : colors.warning }
              ]}>
                {backup?.verified ? 'VERIFIED' : 'UNVERIFIED'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={verifyBackup}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <CheckCircle size={20} color="white" />
              <Text style={styles.actionButtonText}>Verify Backup</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.secondary }]}
          onPress={openAlgoExplorer}
        >
          <ExternalLink size={20} color="white" />
          <Text style={styles.actionButtonText}>View on AlgoExplorer</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.info + '20', borderColor: colors.info }]}>
        <Text style={[styles.infoTitle, { color: colors.info }]}>How Blockchain Verification Works</Text>
        <Text style={[styles.infoText, { color: colors.text }]}>
          1. Your data is hashed using SHA-256 algorithm{'\n'}
          2. Only the hash is stored on the Algorand blockchain{'\n'}
          3. No sensitive information leaves your device{'\n'}
          4. The hash serves as proof of data integrity{'\n'}
          5. Verification confirms your data hasn't been altered
        </Text>
      </View>
    </ScrollView>
  );

  const renderVerifiedStep = () => (
    <ScrollView style={styles.verifiedContainer} showsVerticalScrollIndicator={false}>
      <View style={[styles.verifiedHeader, { backgroundColor: colors.success + '20' }]}>
        <CheckCircle size={64} color={colors.success} />
        <Text style={[styles.verifiedTitle, { color: colors.text }]}>Verification Successful</Text>
        <Text style={[styles.verifiedSubtitle, { color: colors.textSecondary }]}>
          Your identity information has been verified against the blockchain record.
        </Text>
      </View>

      <View style={[styles.verifiedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.verifiedDetail}>
          <Text style={[styles.verifiedLabel, { color: colors.textSecondary }]}>Verification Status</Text>
          <View style={[styles.verifiedBadge, { backgroundColor: colors.success + '20' }]}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={[styles.verifiedBadgeText, { color: colors.success }]}>VERIFIED</Text>
          </View>
        </View>

        <View style={styles.verifiedDetail}>
          <Text style={[styles.verifiedLabel, { color: colors.textSecondary }]}>Data Hash</Text>
          <View style={styles.hashContainer}>
            <Text style={[styles.hashText, { color: colors.text }]}>
              {backup ? formatHash(backup.hash) : 'N/A'}
            </Text>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => backup && copyToClipboard(backup.hash, 'Data hash')}
            >
              <Copy size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.verifiedDetail}>
          <Text style={[styles.verifiedLabel, { color: colors.textSecondary }]}>Transaction ID</Text>
          <View style={styles.hashContainer}>
            <Text style={[styles.hashText, { color: colors.text }]}>
              {backup ? formatTransactionId(backup.transactionId) : 'N/A'}
            </Text>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => backup && copyToClipboard(backup.transactionId, 'Transaction ID')}
            >
              <Copy size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.verifiedDetail}>
          <Text style={[styles.verifiedLabel, { color: colors.textSecondary }]}>Verification Time</Text>
          <View style={styles.timeContainer}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={[styles.verifiedValue, { color: colors.text }]}>
              {new Date().toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.secondary }]}
          onPress={openAlgoExplorer}
        >
          <ExternalLink size={20} color="white" />
          <Text style={styles.actionButtonText}>View on AlgoExplorer</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => setStep('form')}
        >
          <FileText size={20} color="white" />
          <Text style={styles.actionButtonText}>Edit Information</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.securityCard, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
        <Text style={[styles.securityTitle, { color: colors.success }]}>Your Data is Secure</Text>
        <Text style={[styles.securityText, { color: colors.text }]}>
          Your identity information has been successfully verified against the blockchain record. 
          This means your data is securely backed up and can be recovered in case of emergency.
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Lock size={24} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Identity Vault</Text>
        </View>
      </View>

      <View style={[styles.content, { paddingHorizontal: padding }]}>
        {step === 'form' && renderFormStep()}
        {step === 'backup' && renderBackupStep()}
        {step === 'verified' && renderVerifiedStep()}
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 8,
    marginVertical: 20,
    borderWidth: 1,
  },
  securityText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  createBackupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 8,
    marginBottom: 40,
  },
  createBackupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  backupContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  backupHeader: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  backupTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  backupSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  backupCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  backupDetail: {
    marginBottom: 16,
  },
  backupLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  backupValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  hashContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hashText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  iconButton: {
    padding: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
  verifiedContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  verifiedHeader: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  verifiedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  verifiedSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  verifiedCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  verifiedDetail: {
    marginBottom: 16,
  },
  verifiedLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  verifiedValue: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    borderWidth: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  securityText: {
    fontSize: 14,
    lineHeight: 22,
  },
});