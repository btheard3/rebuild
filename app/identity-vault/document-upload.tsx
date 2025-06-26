import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { analyticsService } from '@/services/analyticsService';
import { identityVaultService } from '@/services/identityVaultService';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { ArrowLeft, Upload, Camera, FileText, X, Image as ImageIcon, Shield, User } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';
import CameraCapture from '@/components/CameraCapture';

const DOCUMENT_CATEGORIES = [
  { id: 'identification', label: 'Identification', icon: User },
  { id: 'insurance', label: 'Insurance', icon: Shield },
  { id: 'medical', label: 'Medical', icon: FileText },
  { id: 'property', label: 'Property', icon: FileText },
  { id: 'financial', label: 'Financial', icon: FileText },
  { id: 'other', label: 'Other', icon: FileText },
];

export default function DocumentUploadScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [documentName, setDocumentName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [documentFile, setDocumentFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    analyticsService.trackScreen('document_upload');
  }, []);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      
      // Check file size (limit to 10MB)
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);
      if (fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a file smaller than 10MB');
        return;
      }

      setDocumentFile({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType,
        size: fileInfo.size,
      });

      // Auto-fill document name from filename
      if (!documentName && asset.name) {
        const nameWithoutExtension = asset.name.split('.').slice(0, -1).join('.');
        setDocumentName(nameWithoutExtension);
      }

      analyticsService.trackEvent('document_selected', {
        file_type: asset.mimeType,
        file_size: fileInfo.size,
      });
    } catch (error) {
      console.error('Document picking error:', error);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  const handleCameraCapture = (uri: string) => {
    setShowCamera(false);
    
    // Process the captured image
    setDocumentFile({
      uri,
      name: `photo_${Date.now()}.jpg`,
      type: 'image/jpeg',
      size: 0, // We don't know the size yet
    });

    analyticsService.trackEvent('photo_captured', {
      file_type: 'image/jpeg',
    });
  };

  const removeDocument = () => {
    setDocumentFile(null);
  };

  const validateForm = (): boolean => {
    if (!documentName.trim()) {
      Alert.alert('Error', 'Please enter a document name');
      return false;
    }

    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a document category');
      return false;
    }

    if (!documentFile) {
      Alert.alert('Error', 'Please select a document or take a photo');
      return false;
    }

    return true;
  };

  const uploadDocument = async () => {
    if (!validateForm()) return;

    setIsUploading(true);
    analyticsService.trackEvent('document_upload_started', {
      category: selectedCategory,
      file_type: documentFile.type,
    });

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real app, this would upload to Supabase Storage
      // and store metadata in the database

      // Generate blockchain hash for document verification
      const documentHash = await identityVaultService.generateDataHash({
        name: documentName,
        category: selectedCategory,
        fileType: documentFile.type,
        timestamp: new Date().toISOString(),
        userId: user?.id || 'anonymous',
      });

      // Store hash on blockchain (simulated)
      const transactionId = await identityVaultService.storeHashOnBlockchain(documentHash);

      analyticsService.trackEvent('document_upload_completed', {
        category: selectedCategory,
        has_blockchain_verification: true,
        transaction_id: transactionId,
      });

      Alert.alert(
        'Upload Successful',
        'Your document has been securely uploaded and blockchain-verified.',
        [
          {
            text: 'View Documents',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Document upload failed:', error);
      analyticsService.trackError('document_upload_failed', 'DocumentUpload', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      Alert.alert('Upload Failed', 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
        title="Document Photo"
        description="Take a clear photo of your document"
      />
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
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter-Bold' }]}>Upload Document</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.text, fontFamily: 'Inter-Medium' }]}>Document Name</Text>
          <TextInput
            style={[
              styles.input, 
              { 
                backgroundColor: colors.surface, 
                color: colors.text,
                borderColor: colors.border,
                fontFamily: 'Inter-Regular'
              }
            ]}
            placeholder="Enter document name"
            placeholderTextColor={colors.textSecondary}
            value={documentName}
            onChangeText={setDocumentName}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.text, fontFamily: 'Inter-Medium' }]}>Document Category</Text>
          <View style={styles.categoriesGrid}>
            {DOCUMENT_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  { 
                    backgroundColor: selectedCategory === category.id ? colors.primary + '20' : colors.surface,
                    borderColor: selectedCategory === category.id ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <category.icon 
                  size={24} 
                  color={selectedCategory === category.id ? colors.primary : colors.textSecondary} 
                />
                <Text 
                  style={[
                    styles.categoryLabel, 
                    { 
                      color: selectedCategory === category.id ? colors.primary : colors.text,
                      fontFamily: 'Inter-Medium'
                    }
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.text, fontFamily: 'Inter-Medium' }]}>Document File</Text>
          
          {!documentFile ? (
            <View style={styles.uploadOptions}>
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={pickDocument}
              >
                <Upload size={24} color={colors.primary} />
                <Text style={[styles.uploadButtonText, { color: colors.text, fontFamily: 'Inter-Medium' }]}>
                  Select File
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowCamera(true)}
              >
                <Camera size={24} color={colors.primary} />
                <Text style={[styles.uploadButtonText, { color: colors.text, fontFamily: 'Inter-Medium' }]}>
                  Take Photo
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.filePreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {documentFile.type?.startsWith('image/') ? (
                <Image source={{ uri: documentFile.uri }} style={styles.imagePreview} />
              ) : (
                <View style={[styles.fileIcon, { backgroundColor: colors.primary + '20' }]}>
                  <FileText size={32} color={colors.primary} />
                </View>
              )}
              
              <View style={styles.fileInfo}>
                <Text style={[styles.fileName, { color: colors.text, fontFamily: 'Inter-SemiBold' }]} numberOfLines={1}>
                  {documentFile.name}
                </Text>
                <Text style={[styles.fileType, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
                  {documentFile.type}
                </Text>
                {documentFile.size && (
                  <Text style={[styles.fileSize, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
                    {(documentFile.size / 1024).toFixed(1)} KB
                  </Text>
                )}
              </View>
              
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: colors.error + '20' }]}
                onPress={removeDocument}
              >
                <X size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.securityNotice, { backgroundColor: colors.primary + '15' }]}>
          <Shield size={20} color={colors.primary} />
          <Text style={[styles.securityText, { color: colors.text, fontFamily: 'Inter-Regular' }]}>
            Your document will be encrypted and a verification hash will be stored on the Algorand blockchain for tamper-proof security.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.uploadDocumentButton,
            { 
              backgroundColor: documentFile ? colors.primary : colors.disabled,
              opacity: isUploading ? 0.7 : 1
            }
          ]}
          onPress={uploadDocument}
          disabled={!documentFile || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Shield size={20} color="white" />
              <Text style={[styles.uploadDocumentButtonText, { fontFamily: 'Inter-SemiBold' }]}>
                Upload & Verify Document
              </Text>
            </>
          )}
        </TouchableOpacity>
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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 12,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: '48%',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLabel: {
    marginTop: 8,
    fontSize: 14,
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uploadButton: {
    width: '48%',
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: {
    marginTop: 12,
    fontSize: 14,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  fileIcon: {
    width: 60,
    height: 60,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    marginBottom: 4,
  },
  fileType: {
    fontSize: 12,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  securityText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  uploadDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 8,
    marginBottom: 20,
  },
  uploadDocumentButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
});