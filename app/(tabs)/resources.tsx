import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, FolderPlus, FileText, Image as ImageIcon } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

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
};

export default function ResourcesScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory>('All');

  // Mock data
  const resources: ResourceItem[] = [
    {
      id: '1',
      name: 'Insurance Policy.pdf',
      dateAdded: '2025-02-10',
      type: 'document',
      category: 'Insurance',
      size: '2.3 MB',
      previewUrl: 'https://images.pexels.com/photos/95916/pexels-photo-95916.jpeg',
    },
    {
      id: '2',
      name: 'Home Damage Photos',
      dateAdded: '2025-02-15',
      type: 'image',
      category: 'Insurance',
      size: '4.7 MB',
      previewUrl: 'https://images.pexels.com/photos/1556704/pexels-photo-1556704.jpeg',
    },
    {
      id: '3',
      name: 'Medical Records.pdf',
      dateAdded: '2025-01-22',
      type: 'document',
      category: 'Medical',
      size: '1.8 MB',
      previewUrl: 'https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg',
    },
    {
      id: '4',
      name: 'Property Deed.pdf',
      dateAdded: '2025-01-05',
      type: 'document',
      category: 'Legal',
      size: '3.2 MB',
      previewUrl: 'https://images.pexels.com/photos/7194314/pexels-photo-7194314.jpeg',
    },
  ];

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

      console.log('Document picked:', result.assets[0]);
      // Here you would normally upload the document to your storage
      // and add it to your resources list
      
      // For now, we'll just show a success alert
      alert(`Document "${result.assets[0].name}" added successfully!`);
      
    } catch (error) {
      console.error('Error picking document:', error);
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
        onPress={() => setSelectedCategory(category)}
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
        }
      ]}
      onPress={() => console.log(`Open ${item.name}`)}
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
        <Text style={[styles.resourceName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.resourceDetails, { color: colors.textSecondary }]}>
          {item.category} • {item.size}
        </Text>
        <Text style={[styles.resourceDate, { color: colors.textSecondary }]}>
          Added: {item.dateAdded}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
          onPress={() => console.log('Filter pressed')}
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
          contentContainerStyle={styles.resourcesList}
        />
      )}
      
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={handleDocumentUpload}
      >
        <FolderPlus size={24} color="white" />
        <Text style={styles.addButtonText}>Add Document</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
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
  resourceItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
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
  resourceName: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  resourceDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  resourceDate: {
    fontSize: 12,
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