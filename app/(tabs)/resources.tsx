import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { useResponsive, getResponsiveValue } from '@/hooks/useResponsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyticsService } from '@/services/analyticsService';
import { algorandService } from '@/services/algorandService';
import { Search, Filter, FolderPlus, FileText, Image as ImageIcon, Shield, Crown } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import BoltBadge from '@/components/BoltBadge';
import PaywallScreen from '@/components/PaywallScreen';

type ResourceCategory = 'All' | 'Documents' | 'Images' | 'Insurance' | 'Medical' | 'Legal';

type ResourceItem = {
  id: string;
  name: string;
  dateAdded: string;
  type: 'document' | 'image';
  category: Exclude<ResourceCategory, 'All'>;
  size: string;
  uri?: string;
  previewUrl?: string;
  blockchainHash?: string;
  verified?: boolean;
};

export default function ResourcesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { addPoints, completeAchievement } = useGamification();
  const { deviceType } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory>('All');
  const [showPaywall, setShowPaywall] = useState(false);
  const [verifyingDocument, setVerifyingDocument] = useState<string | null>(null);

  const getPadding = getResponsiveValue(16, 24, 32);
  const getMaxWidth = getResponsiveValue('100%', 800, 1000);
  const getNumColumns = getResponsiveValue(1, 2, 3);
  
  const padding = getPadding(deviceType);
  const maxWidth = getMaxWidth(deviceType);
  const numColumns = getNumColumns(deviceType);

  useEffect(() => {
    analyticsService.trackScreen('resources');
  }, []);

  // Updated with more inclusive images
  const [resources, setResources] = useState<ResourceItem[]>([
    {
      id: '1',
      name: 'Insurance Policy.pdf',
      dateAdded: '2025-02-10',
      type: 'document',
      category: 'Insurance',
      size: '2.3 MB',
      previewUrl: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
      verified: false,
    },
    {
      id: '2',
      name: 'Home Damage Photos',
      dateAdded: '2025-02-15',
      type: 'image',
      category: 'Insurance',
      size: '4.7 MB',
      previewUrl: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg',
      verified: false,
    },
    {
      id: '3',
      name: 'Medical Records.pdf',
      dateAdded: '2025-01-22',
      type: 'document',
      category: 'Medical',
      size: '1.8 MB',
      previewUrl: 'https://images.pexels.com/photos/5699398/pexels-photo-5699398.jpeg',
      verified: true,
      blockchainHash: 'abc123def456',
    },
    {
      id: '4',
      name: 'Property Deed.pdf',
      dateAdded: '2025-01-05',
      type: 'document',
      category: 'Legal',
      size: '3.2 MB',
      previewUrl: 'https://images.pexels.com/photos/5699479/pexels-photo-5699479.jpeg',
      verified: false,
    },
  ]);

  const categories: ResourceCategory[] = ['All', 'Documents', 'Images', 'Insurance', 'Medical', 'Legal'];

  const filteredResources = resources.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: '*/*',
      });
      
      if (result.canceled) {
        console.log('Document picking cancelled');
        return;
      }

      const newDocument: ResourceItem = {
        id: Date.now().toString(),
        name: result.assets[0].name,
        dateAdded: new Date().toISOString().split('T')[0],
        type: result.assets[0].mimeType?.startsWith('image/') ? 'image' : 'document',
        category: 'Documents',
        size: `${(result.assets[0].size || 0 / 1024 / 1024).toFixed(1)} MB`,
        uri: result.assets[0].uri,
        verified: false,
      };

      setResources(prev => [newDocument, ...prev]);
      
      analyticsService.trackEvent('document_uploaded', {
        document_type: newDocument.type,
        document_size: newDocument.size,
        category: newDocument.category
      });
      
      addPoints(30, 'Uploaded document');
      
      // Check for upload achievement
      setTimeout(() => completeAchievement('upload_document'), 100);
      
      Alert.alert('Success', `Document "${result.assets[0].name}" added successfully!`);
      
    } catch (error) {
      console.error('Error picking document:', error);
      analyticsService.trackError('document_upload_failed', 'ResourcesScreen', {
        error: error.message
      });
    }
  };

  const handleVerifyOnBlockchain = async (resourceId: string) => {
    if (!user?.isPremium) {
      setShowPaywall(true);
      analyticsService.trackEvent('resources_paywall_shown', { feature: 'blockchain_verification' });
      return;
    }

    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;

    setVerifyingDocument(resourceId);
    analyticsService.trackEvent('blockchain_verification_started', { resource_id: resourceId });

    try {
      // In a real implementation, you would read the actual file content
      // For demo purposes, we'll use the resource name as content
      const mockContent = `Document: ${resource.name}\nDate: ${resource.dateAdded}\nSize: ${resource.size}`;
      
      const result = await algorandService.storeDocumentHash(mockContent);
      
      if (result) {
        // Update the resource with blockchain verification
        setResources(prev => prev.map(r => 
          r.id === resourceId 
            ? { ...r, verified: true, blockchainHash: result.hash }
            : r
        ));

        addPoints(50, 'Document verified on blockchain');
        
        analyticsService.trackEvent('blockchain_verification_completed', {
          resource_id: resourceId,
          transaction_id: result.txId,
          hash: result.hash
        });

        Alert.alert(
          'Verification Complete',
          `Your document has been verified on the Algorand blockchain.\n\nTransaction ID: ${result.txId}\nHash: ${result.hash.substring(0, 16)}...`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Blockchain verification failed:', error);
      analyticsService.trackError('blockchain_verification_failed', 'ResourcesScreen', {
        resource_id: resourceId,
        error: error.message
      });
      
      Alert.alert(
        'Verification Failed',
        'Could not verify document on blockchain. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setVerifyingDocument(null);
    }
  };

  const renderCategoryChip = (category: ResourceCategory) => {
    const isSelected = category === selectedCategory;
    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryChip,
          { 
            backgroundColor: isSelected ? colors.primary : colors.surface,
            borderColor: isSelected ? colors.primary : colors.border,
          }
        ]}
        onPress={() => {
          setSelectedCategory(category);
          analyticsService.trackEvent('resource_category_selected', { category });
        }}
      >
        <Text
          style={[
            styles.categoryChipText,
            { color: isSelected ? 'white' : colors.text }
          ]}
        >
          {category}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderResourceItem = ({ item }: { item: ResourceItem }) => (
    <TouchableOpacity
      style={[
        styles.resourceItem,
        { 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          width: deviceType === 'mobile' ? '100%' : `${100 / numColumns - 2}%`,
        }
      ]}
      onPress={() => {
        analyticsService.trackUserAction('resource_opened', 'resources', {
          resource_id: item.id,
          resource_name: item.name,
          resource_type: item.type
        });
        console.log(`Open ${item.name}`);
      }}
    >
      {item.previewUrl ? (
        <Image source={{ uri: item.previewUrl }} style={styles.resourceThumbnail} />
      ) : (
        <View style={[styles.resourceThumbnail, { backgroundColor: colors.primaryLight }]}>
          {item.type === 'document' ? (
            <FileText size={24} color={colors.primary} />
          ) : (
            <ImageIcon size={24} color={colors.primary} />
          )}
        </View>
      )}
      
      <View style={styles.resourceInfo}>
        <View style={styles.resourceHeader}>
          <Text style={[styles.resourceName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.success + '20' }]}>
              <Shield size={12} color={colors.success} />
            </View>
          )}
        </View>
        
        <Text style={[styles.resourceDetails, { color: colors.textSecondary }]}>
          {item.category} • {item.size}
        </Text>
        <Text style={[styles.resourceDate, { color: colors.textSecondary }]}>
          Added: {item.dateAdded}
        </Text>

        {!item.verified && (
          <TouchableOpacity
            style={[
              styles.verifyButton,
              { 
                backgroundColor: user?.isPremium ? colors.primary + '20' : colors.disabled + '20',
                borderColor: user?.isPremium ? colors.primary : colors.disabled,
              }
            ]}
            onPress={() => handleVerifyOnBlockchain(item.id)}
            disabled={verifyingDocument === item.id}
          >
            {!user?.isPremium && <Crown size={12} color={colors.disabled} />}
            <Text style={[
              styles.verifyButtonText, 
              { 
                color: user?.isPremium ? colors.primary : colors.disabled,
                marginLeft: !user?.isPremium ? 4 : 0
              }
            ]}>
              {verifyingDocument === item.id ? 'Verifying...' : 'Verify on Blockchain'}
            </Text>
          </TouchableOpacity>
        )}

        {item.verified && item.blockchainHash && (
          <View style={[styles.hashContainer, { backgroundColor: colors.success + '10' }]}>
            <Text style={[styles.hashLabel, { color: colors.success }]}>Blockchain Hash:</Text>
            <Text style={[styles.hashText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.blockchainHash}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingHorizontal: padding, maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search resources..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              analyticsService.trackUserAction('filter_pressed', 'resources');
              console.log('Filter pressed');
            }}
          >
            <Filter size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            renderItem={({ item }) => renderCategoryChip(item)}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
        
        {filteredResources.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No resources found. Try adjusting your search or add new documents.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredResources}
            renderItem={renderResourceItem}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            key={numColumns}
            contentContainerStyle={styles.resourcesList}
            columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
          />
        )}
        
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleDocumentUpload}
        >
          <FolderPlus size={24} color="white" />
          <Text style={styles.addButtonText}>Add Document</Text>
        </TouchableOpacity>
      </View>

      <PaywallScreen 
        visible={showPaywall} 
        onClose={() => setShowPaywall(false)} 
      />
      
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
    marginBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesList: {
    paddingRight: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryChipText: {
    fontWeight: '500',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  resourcesList: {
    paddingBottom: 80,
  },
  row: {
    justifyContent: 'space-between',
  },
  resourceItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  resourceThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  resourceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resourceName: {
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
    paddingRight: 8,
  },
  verifiedBadge: {
    padding: 4,
    borderRadius: 12,
  },
  resourceDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  resourceDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  verifyButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  hashContainer: {
    padding: 6,
    borderRadius: 4,
  },
  hashLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  hashText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  addButton: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});