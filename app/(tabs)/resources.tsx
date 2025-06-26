import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyticsService } from '@/services/analyticsService';
import { resourcesService, Resource, ResourceCategory } from '@/services/resourcesService';
import { Search, Filter, Heart, Phone, ExternalLink, MapPin, Clock, Star } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';

export default function ResourcesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { deviceType, padding } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all');
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    analyticsService.trackScreen('resources');
    loadResources();
  }, []);

  useEffect(() => {
    loadResources();
  }, [selectedCategory]);

  const loadResources = async () => {
    try {
      setIsLoading(true);
      const data = await resourcesService.getResources(
        selectedCategory === 'all' ? undefined : selectedCategory,
        searchQuery
      );
      setResources(data);
      
      // Update favorites
      const newFavorites = new Set<string>();
      data.forEach(resource => {
        if (resource.isFavorite) {
          newFavorites.add(resource.id);
        }
      });
      setFavorites(newFavorites);
      
      analyticsService.trackEvent('resources_loaded', {
        count: data.length,
        category: selectedCategory,
        has_search: !!searchQuery
      });
    } catch (error) {
      console.error('Failed to load resources:', error);
      Alert.alert('Error', 'Failed to load resources. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadResources();
  };

  const handleSearch = () => {
    loadResources();
    analyticsService.trackEvent('resource_search', {
      query: searchQuery,
      category: selectedCategory
    });
  };

  const toggleFavorite = async (resourceId: string) => {
    try {
      const success = await resourcesService.toggleFavorite(resourceId, user?.id);
      
      if (success) {
        setResources(prev => 
          prev.map(resource => 
            resource.id === resourceId 
              ? { ...resource, isFavorite: !resource.isFavorite }
              : resource
          )
        );
        
        // Update favorites set
        const newFavorites = new Set(favorites);
        if (newFavorites.has(resourceId)) {
          newFavorites.delete(resourceId);
        } else {
          newFavorites.add(resourceId);
        }
        setFavorites(newFavorites);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleContact = (resource: Resource, type: 'phone' | 'website') => {
    if (type === 'phone' && resource.contact?.phone) {
      Alert.alert(
        'Call Resource',
        `Would you like to call ${resource.title || resource.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => {
              console.log(`Calling ${resource.contact?.phone}`);
              analyticsService.trackEvent('resource_call_initiated', {
                resource_id: resource.id,
                resource_name: resource.name
              });
            }
          },
        ]
      );
    } else if (type === 'website' && resource.contact?.website) {
      console.log(`Opening ${resource.contact.website}`);
      analyticsService.trackEvent('resource_website_opened', {
        resource_id: resource.id,
        resource_name: resource.name
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            size={14} 
            color={star <= Math.round(rating) ? colors.warning : colors.disabled} 
            fill={star <= Math.round(rating) ? colors.warning : 'transparent'}
          />
        ))}
        <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

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
        onPress={() => {
          setSelectedCategory(category.id as ResourceCategory | 'all');
          analyticsService.trackEvent('resource_category_selected', {
            category: category.id
          });
        }}
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

  const renderResourceCard = (resource: Resource) => (
    <View
      key={resource.id}
      style={[
        styles.resourceCard,
        { 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          padding: deviceType === 'mobile' ? 12 : 16,
        }
      ]}
    >
      <Image source={{ uri: resource.image }} style={styles.resourceImage} />
      
      <View style={styles.resourceContent}>
        <View style={styles.resourceHeader}>
          <View style={styles.resourceTitleContainer}>
            <Text style={[
              styles.resourceTitle, 
              { 
                color: colors.text,
                fontSize: deviceType === 'mobile' ? 16 : 18,
              }
            ]} numberOfLines={2}>
              {resource.name}
            </Text>
            <TouchableOpacity
              onPress={() => toggleFavorite(resource.id)}
              style={styles.favoriteButton}
            >
              <Heart 
                size={20} 
                color={favorites.has(resource.id) ? colors.error : colors.textSecondary}
                fill={favorites.has(resource.id) ? colors.error : 'transparent'}
              />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.typeTag, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.typeTagText, { color: colors.primary }]}>
              {resource.type.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[
          styles.resourceDescription, 
          { 
            color: colors.textSecondary,
            fontSize: deviceType === 'mobile' ? 14 : 15,
          }
        ]} numberOfLines={3}>
          {resource.description}
        </Text>

        <View style={styles.resourceDetails}>
          {resource.contact?.address && (
            <View style={styles.detailRow}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
                {resource.contact.address}
              </Text>
            </View>
          )}
          
          {resource.hours && (
            <View style={styles.detailRow}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {resource.hours}
              </Text>
            </View>
          )}

          {resource.eligibility && (
            <View style={styles.detailRow}>
              <Text style={[styles.eligibilityLabel, { color: colors.primary }]}>Eligibility: </Text>
              <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={2}>
                {resource.eligibility}
              </Text>
            </View>
          )}
        </View>

        {renderStars(resource.rating)}

        <View style={styles.actionButtons}>
          {resource.contact?.phone && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={() => handleContact(resource, 'phone')}
            >
              <Phone size={16} color="white" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
          )}
          
          {resource.contact?.website && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => handleContact(resource, 'website')}
            >
              <ExternalLink size={16} color="white" />
              <Text style={styles.actionButtonText}>Visit</Text>
            </TouchableOpacity>
          )}
        </View>

        {resource.languages && resource.languages.length > 0 && (
          <View style={styles.languagesContainer}>
            <Text style={[styles.languagesLabel, { color: colors.textSecondary }]}>Languages: </Text>
            <Text style={[styles.languagesText, { color: colors.textSecondary }]} numberOfLines={1}>
              {resource.languages.join(', ')}
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
          <Text style={[
            styles.headerTitle, 
            { 
              color: colors.text,
              fontSize: deviceType === 'mobile' ? 24 : 28,
            }
          ]}>
            Recovery Resources
          </Text>
          <Text style={[
            styles.headerSubtitle, 
            { 
              color: colors.textSecondary,
              fontSize: deviceType === 'mobile' ? 16 : 18,
            }
          ]}>
            Find help and support services in your area
          </Text>
        </View>

        <View style={styles.searchSection}>
          <View style={[
            styles.searchContainer, 
            { 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              height: deviceType === 'mobile' ? 44 : 48,
            }
          ]}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={[
                styles.searchInput, 
                { 
                  color: colors.text,
                  fontSize: deviceType === 'mobile' ? 16 : 17,
                }
              ]}
              placeholder="Search resources, services, or keywords..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              { 
                backgroundColor: colors.surface, 
                borderColor: colors.border,
                width: deviceType === 'mobile' ? 44 : 48,
                height: deviceType === 'mobile' ? 44 : 48,
              }
            ]}
            onPress={() => {
              analyticsService.trackEvent('resource_filter_pressed');
              Alert.alert('Filters', 'Filter functionality would be implemented here.');
            }}
          >
            <Filter size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesList}
        >
          {categories.map(renderCategoryChip)}
        </ScrollView>
        
        <View style={styles.resultsHeader}>
          <Text style={[
            styles.resultsText, 
            { 
              color: colors.text,
              fontSize: deviceType === 'mobile' ? 14 : 15,
            }
          ]}>
            {resources.length} {resources.length === 1 ? 'resource' : 'resources'} found
          </Text>
          {favorites.size > 0 && (
            <Text style={[
              styles.favoritesText, 
              { 
                color: colors.primary,
                fontSize: deviceType === 'mobile' ? 14 : 15,
              }
            ]}>
              {favorites.size} saved
            </Text>
          )}
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading resources...
            </Text>
          </View>
        ) : (
          <FlatList
            data={resources}
            renderItem={({ item }) => renderResourceCard(item)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resourcesList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No resources found. Try adjusting your search or category filter.
                </Text>
              </View>
            }
          />
        )}
      </View>
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
    marginBottom: 20,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    // fontSize handled in component
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
  },
  filterButton: {
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
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsText: {
    fontWeight: '500',
  },
  favoritesText: {
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  resourcesList: {
    paddingBottom: 120,
  },
  resourceCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 16,
  },
  resourceImage: {
    width: '100%',
    height: 180,
  },
  resourceContent: {
    padding: 16,
  },
  resourceHeader: {
    marginBottom: 8,
  },
  resourceTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  resourceTitle: {
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  typeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  resourceDescription: {
    lineHeight: 20,
    marginBottom: 12,
  },
  resourceDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  eligibilityLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  languagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languagesLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  languagesText: {
    fontSize: 11,
    flex: 1,
  },
});