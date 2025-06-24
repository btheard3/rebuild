import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, Alert, Modal } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { useResponsive } from '@/hooks/useResponsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyticsService } from '@/services/analyticsService';
import { algorandService } from '@/services/algorandService';
import { supabase } from '@/services/supabaseClient';
import { Search, Filter, FolderPlus, FileText, Image as ImageIcon, Shield, Camera, X } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';
import CameraCapture from '@/components/CameraCapture';

type ResourceCategory = 'all' | 'emergency' | 'financial' | 'housing' | 'medical' | 'legal' | 'mental-health' | 'food' | 'utilities';

type Resource = {
  id: string;
  title: string;
  description: string;
  category: Exclude<ResourceCategory, 'all'>;
  type: 'hotline' | 'website' | 'location' | 'program';
  contact?: {
    phone?: string;
    website?: string;
    address?: string;
  };
  hours?: string;
  rating: number;
  isFavorite: boolean;
  image: string;
  tags: string[];
  eligibility?: string;
  languages?: string[];
};

export default function ResourcesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { addPoints, completeAchievement } = useGamification();
  const { deviceType, padding } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showCamera, setShowCamera] = useState(false);
  const [verifyingDocument, setVerifyingDocument] = useState<string | null>(null);

  const [moodHistory, setMoodHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyticsService.trackScreen('resources');
    loadResources();
  }, []);

  const [resources, setResources] = useState<Resource[]>([
    {
      id: '1',
      title: 'FEMA Disaster Relief',
      description: 'Federal assistance for disaster survivors including temporary housing, home repairs, and other disaster-related expenses.',
      category: 'emergency',
      type: 'program',
      contact: {
        phone: '1-800-621-3362',
        website: 'https://www.fema.gov',
      },
      hours: '24/7',
      rating: 4.2,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg',
      tags: ['federal', 'housing', 'repairs', 'financial'],
      eligibility: 'Disaster survivors in declared disaster areas',
      languages: ['English', 'Spanish', 'ASL'],
    },
    {
      id: '2',
      title: 'Red Cross Emergency Shelter',
      description: 'Immediate shelter, food, and emergency supplies for disaster victims and their families.',
      category: 'emergency',
      type: 'location',
      contact: {
        phone: '1-800-733-2767',
        website: 'https://www.redcross.org',
        address: '1234 Relief Center Dr, Community City',
      },
      hours: '24/7',
      rating: 4.8,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
      tags: ['shelter', 'food', 'supplies', 'immediate'],
      eligibility: 'All disaster victims',
      languages: ['English', 'Spanish', 'French'],
    },
    {
      id: '3',
      title: 'Disaster Financial Assistance',
      description: 'Low-interest loans and grants for disaster recovery, home repairs, and business restoration.',
      category: 'financial',
      type: 'program',
      contact: {
        phone: '1-800-659-2955',
        website: 'https://www.sba.gov/disaster',
      },
      hours: 'Mon-Fri 8am-8pm EST',
      rating: 4.0,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/5699398/pexels-photo-5699398.jpeg',
      tags: ['loans', 'grants', 'business', 'recovery'],
      eligibility: 'Property owners and renters in disaster areas',
      languages: ['English', 'Spanish'],
    },
    {
      id: '4',
      title: 'Community Housing Solutions',
      description: 'Temporary and transitional housing assistance for families displaced by disasters.',
      category: 'housing',
      type: 'program',
      contact: {
        phone: '(555) 123-4567',
        website: 'https://communityhousing.org',
        address: '789 Housing Ave, Safe Harbor',
      },
      hours: 'Mon-Fri 9am-5pm',
      rating: 4.5,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/5699479/pexels-photo-5699479.jpeg',
      tags: ['temporary', 'transitional', 'families', 'displacement'],
      eligibility: 'Families with children, elderly, disabled',
      languages: ['English', 'Spanish', 'Mandarin'],
    },
    {
      id: '5',
      title: 'Crisis Mental Health Hotline',
      description: '24/7 mental health support for disaster survivors experiencing trauma, anxiety, or depression.',
      category: 'mental-health',
      type: 'hotline',
      contact: {
        phone: '988',
        website: 'https://988lifeline.org',
      },
      hours: '24/7',
      rating: 4.7,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/5699398/pexels-photo-5699398.jpeg',
      tags: ['crisis', 'trauma', 'anxiety', 'depression', 'counseling'],
      eligibility: 'Anyone in crisis',
      languages: ['English', 'Spanish', '150+ languages via interpreter'],
    },
    {
      id: '6',
      title: 'Mobile Medical Clinic',
      description: 'Free medical care, prescription assistance, and health screenings for disaster survivors.',
      category: 'medical',
      type: 'location',
      contact: {
        phone: '(555) 987-6543',
        address: 'Various locations - call for schedule',
      },
      hours: 'Mon-Sat 8am-6pm',
      rating: 4.3,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
      tags: ['mobile', 'free', 'prescriptions', 'screenings'],
      eligibility: 'Uninsured and underinsured individuals',
      languages: ['English', 'Spanish', 'Creole'],
    },
    {
      id: '7',
      title: 'Legal Aid Society',
      description: 'Free legal assistance for disaster-related issues including insurance claims, FEMA appeals, and housing rights.',
      category: 'legal',
      type: 'program',
      contact: {
        phone: '(555) 456-7890',
        website: 'https://legalaid.org',
        address: '456 Justice Blvd, Legal District',
      },
      hours: 'Mon-Fri 9am-5pm',
      rating: 4.1,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/5699479/pexels-photo-5699479.jpeg',
      tags: ['insurance', 'FEMA', 'appeals', 'housing', 'rights'],
      eligibility: 'Low-income disaster survivors',
      languages: ['English', 'Spanish', 'ASL'],
    },
    {
      id: '8',
      title: 'Community Food Bank',
      description: 'Emergency food assistance, hot meals, and nutrition programs for disaster-affected families.',
      category: 'food',
      type: 'location',
      contact: {
        phone: '(555) 234-5678',
        address: '321 Nutrition St, Food District',
      },
      hours: 'Mon-Fri 10am-4pm, Sat 9am-2pm',
      rating: 4.6,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg',
      tags: ['emergency', 'hot meals', 'nutrition', 'families'],
      eligibility: 'Anyone in need',
      languages: ['English', 'Spanish', 'Vietnamese'],
    },
    {
      id: '9',
      title: 'Utility Assistance Program',
      description: 'Help with electricity, gas, water, and internet bills for disaster survivors facing financial hardship.',
      category: 'utilities',
      type: 'program',
      contact: {
        phone: '(555) 345-6789',
        website: 'https://utilityhelp.org',
      },
      hours: 'Mon-Fri 8am-6pm',
      rating: 3.9,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/5699398/pexels-photo-5699398.jpeg',
      tags: ['electricity', 'gas', 'water', 'internet', 'bills'],
      eligibility: 'Low to moderate income households',
      languages: ['English', 'Spanish'],
    },
  ]);

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const loadResources = async () => {
    try {
      if (user) {
        const { data, error } = await supabase
          .from('user_documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Failed to load resources:', error);
        } else if (data) {
          const formattedResources = data.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            dateAdded: doc.created_at.split('T')[0],
            type: doc.type,
            category: doc.category,
            size: doc.size || 'Unknown',
            uri: doc.file_path,
            previewUrl: doc.preview_url,
            blockchainHash: doc.blockchain_hash,
            verified: !!doc.blockchain_hash,
          }));
          setResources(prev => [...formattedResources, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  const saveResourceToSupabase = async (resource: Omit<any, 'id'>) => {
    try {
      if (user) {
        const { data, error } = await supabase
          .from('user_documents')
          .insert([{
            user_id: user.id,
            name: resource.name,
            type: resource.type,
            category: resource.category,
            size: resource.size,
            file_path: resource.uri,
            preview_url: resource.previewUrl,
            blockchain_hash: resource.blockchainHash,
          }])
          .select()
          .single();

        if (error) {
          console.error('Failed to save resource:', error);
        } else {
          return data.id;
        }
      }
    } catch (error) {
      console.error('Error saving resource:', error);
    }
    return null;
  };

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

      const newDocument = {
        id: Date.now().toString(),
        name: result.assets[0].name,
        dateAdded: new Date().toISOString().split('T')[0],
        type: result.assets[0].mimeType?.startsWith('image/') ? 'image' : 'document',
        category: 'Documents',
        size: `${(result.assets[0].size || 0 / 1024 / 1024).toFixed(1)} MB`,
        uri: result.assets[0].uri,
        verified: false,
      };

      // Save to Supabase
      const savedId = await saveResourceToSupabase(newDocument);
      if (savedId) {
        newDocument.id = savedId;
      }

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

  const handleCameraCapture = async (imageUri: string) => {
    try {
      const fileName = `damage_photo_${Date.now()}.jpg`;
      const newImage = {
        id: Date.now().toString(),
        name: fileName,
        dateAdded: new Date().toISOString().split('T')[0],
        type: 'image',
        category: 'Insurance',
        size: 'Unknown',
        uri: imageUri,
        previewUrl: imageUri,
        verified: false,
      };

      // Save to Supabase
      const savedId = await saveResourceToSupabase(newImage);
      if (savedId) {
        newImage.id = savedId;
      }

      setResources(prev => [newImage, ...prev]);
      setShowCamera(false);
      
      analyticsService.trackEvent('damage_photo_captured', {
        category: newImage.category
      });
      
      addPoints(25, 'Captured damage photo');
      
      Alert.alert('Success', 'Damage photo captured and saved!');
      
    } catch (error) {
      console.error('Error saving captured image:', error);
      Alert.alert('Error', 'Failed to save captured image. Please try again.');
    }
  };

  const handleVerifyOnBlockchain = async (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;

    setVerifyingDocument(resourceId);
    analyticsService.trackEvent('blockchain_verification_started', { resource_id: resourceId });

    try {
      const mockContent = `Document: ${resource.name}\nDate: ${resource.dateAdded}\nSize: ${resource.size}`;
      
      const result = await algorandService.storeDocumentHash(mockContent);
      
      if (result) {
        // Update the resource with blockchain verification
        setResources(prev => prev.map(r => 
          r.id === resourceId 
            ? { ...r, verified: true, blockchainHash: result.hash }
            : r
        ));

        // Update in Supabase
        if (user) {
          await supabase
            .from('user_documents')
            .update({ blockchain_hash: result.hash })
            .eq('id', resourceId);
        }

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

  const toggleFavorite = (resourceId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(resourceId)) {
      newFavorites.delete(resourceId);
    } else {
      newFavorites.add(resourceId);
    }
    setFavorites(newFavorites);
  };

  const categories = [
    { id: 'all', label: 'All Resources', icon: '🏠' },
    { id: 'emergency', label: 'Emergency', icon: '🚨' },
    { id: 'financial', label: 'Financial Aid', icon: '💰' },
    { id: 'housing', label: 'Housing', icon: '🏘️' },
    { id: 'medical', label: 'Medical', icon: '🏥' },
    { id: 'legal', label: 'Legal Aid', icon: '⚖️' },
    { id: 'mental-health', label: 'Mental Health', icon: '🧠' },
    { id: 'food', label: 'Food Assistance', icon: '🍽️' },
    { id: 'utilities', label: 'Utilities', icon: '⚡' },
  ];

  const renderCategoryChip = (category: typeof categories[0]) => {
    const isSelected = category.id === selectedCategory;
    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryChip,
          { 
            backgroundColor: isSelected ? colors.primary : colors.surface,
            borderColor: isSelected ? colors.primary : colors.border,
            paddingHorizontal: deviceType === 'mobile' ? 12 : 16,
            paddingVertical: deviceType === 'mobile' ? 8 : 10,
          }
        ]}
        onPress={() => setSelectedCategory(category.id as ResourceCategory)}
      >
        <Text style={styles.categoryEmoji}>{category.icon}</Text>
        <Text
          style={[
            styles.categoryChipText,
            { 
              color: isSelected ? 'white' : colors.text,
              fontSize: deviceType === 'mobile' ? 14 : 15,
            }
          ]}
        >
          {category.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderResourceItem = ({ item }: { item: any }) => (
    <View
      key={item.id}
      style={[
        styles.resourceItem,
        { 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          width: deviceType === 'mobile' ? '100%' : '48%',
        }
      ]}
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
                backgroundColor: colors.primary + '20',
                borderColor: colors.primary,
              }
            ]}
            onPress={() => handleVerifyOnBlockchain(item.id)}
            disabled={verifyingDocument === item.id}
          >
            <Text style={[
              styles.verifyButtonText, 
              { 
                color: colors.primary
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
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingHorizontal: padding, maxWidth: 1000, alignSelf: 'center', width: '100%' }]}>
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
            keyExtractor={(item) => item.id}
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
            numColumns={deviceType === 'mobile' ? 1 : 2}
            key={deviceType === 'mobile' ? 'single' : 'double'}
            contentContainerStyle={styles.resourcesList}
            columnWrapperStyle={deviceType !== 'mobile' ? styles.row : undefined}
          />
        )}
        
        <View style={styles.addButtonsContainer}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleDocumentUpload}
          >
            <FolderPlus size={20} color="white" />
            <Text style={styles.addButtonText}>Add Document</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.accent }]}
            onPress={() => setShowCamera(true)}
          >
            <Camera size={20} color="white" />
            <Text style={styles.addButtonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showCamera} animationType="slide" presentationStyle="fullScreen">
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
          title="Document Damage"
          description="Take photos for insurance claims and recovery records"
        />
      </Modal>
      
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
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
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
    paddingBottom: 120,
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
  addButtonsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  addButton: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
});